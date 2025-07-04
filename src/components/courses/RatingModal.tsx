
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PointsNotification } from './PointsNotification';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'course' | 'lesson';
  itemId: string;
  itemTitle: string;
  onRatingSubmitted?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  type,
  itemId,
  itemTitle,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPointsNotification, setShowPointsNotification] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast({
        title: 'Error',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if user has already rated this item to prevent duplicate points
      let hasExistingRating = false;
      
      if (type === 'course') {
        const { data: existingRating } = await supabase
          .from('course_ratings')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', itemId)
          .maybeSingle();
        
        hasExistingRating = !!existingRating;
        
        // Submit or update the rating
        const { error: ratingError } = await supabase
          .from('course_ratings')
          .upsert({
            user_id: user.id,
            course_id: itemId,
            rating,
            comment: comment.trim() || null,
          }, {
            onConflict: 'user_id,course_id'
          });

        if (ratingError) throw ratingError;
      } else {
        const { data: existingRating } = await supabase
          .from('lesson_ratings')
          .select('id')
          .eq('user_id', user.id)
          .eq('lesson_id', itemId)
          .maybeSingle();
        
        hasExistingRating = !!existingRating;
        
        // Submit or update the rating
        const { error: ratingError } = await supabase
          .from('lesson_ratings')
          .upsert({
            user_id: user.id,
            lesson_id: itemId,
            rating,
            comment: comment.trim() || null,
          }, {
            onConflict: 'user_id,lesson_id'
          });

        if (ratingError) throw ratingError;
      }

      // Award points only for NEW ratings (not updates)
      let pointsAwarded = 0;
      if (!hasExistingRating) {
        const feedbackPoints = 5;
        pointsAwarded = feedbackPoints;
        
        // Update user points
        const { data: existingPoints } = await supabase
          .from('user_points')
          .select('total_points, available_points')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingPoints) {
          const { error: updateError } = await supabase
            .from('user_points')
            .update({
              total_points: existingPoints.total_points + feedbackPoints,
              available_points: existingPoints.available_points + feedbackPoints,
            })
            .eq('user_id', user.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('user_points')
            .insert({
              user_id: user.id,
              total_points: feedbackPoints,
              available_points: feedbackPoints,
            });

          if (insertError) throw insertError;
        }

        // Record the transaction
        await supabase
          .from('points_transactions')
          .insert({
            user_id: user.id,
            points_change: feedbackPoints,
            transaction_type: 'earned',
            description: `Feedback points for ${type}: ${itemTitle}`,
          });
      }

      setPointsEarned(pointsAwarded);
      
      toast({
        title: 'Thank you!',
        description: hasExistingRating 
          ? 'Your rating has been updated successfully.' 
          : 'Your rating has been submitted successfully.',
      });

      if (onRatingSubmitted) {
        onRatingSubmitted();
      }

      // Close the rating modal and show points notification if points were earned
      onClose();
      if (pointsAwarded > 0) {
        setShowPointsNotification(true);
      }
      
      // Reset form
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-8 h-8 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Rate this {type === 'course' ? 'Course' : 'Lesson'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h3 className="font-medium mb-2">{itemTitle}</h3>
              <p className="text-sm text-gray-600 mb-4">
                How would you rate this {type}?
              </p>
              {renderStars()}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Comments (optional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Share your thoughts about this ${type}...`}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {pointsEarned > 0 && (
        <PointsNotification
          isOpen={showPointsNotification}
          onClose={() => setShowPointsNotification(false)}
          pointsEarned={pointsEarned}
          courseName={itemTitle}
        />
      )}
    </>
  );
};
