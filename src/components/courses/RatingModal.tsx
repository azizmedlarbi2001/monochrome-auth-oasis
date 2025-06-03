
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'lesson' | 'course';
  itemId: string;
  itemTitle: string;
  onRatingSubmitted: () => void;
}

export const RatingModal = ({ 
  isOpen, 
  onClose, 
  type, 
  itemId, 
  itemTitle, 
  onRatingSubmitted 
}: RatingModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch existing rating when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchExistingRating();
    }
  }, [isOpen, user, type, itemId]);

  const fetchExistingRating = async () => {
    if (!user) return;

    try {
      if (type === 'lesson') {
        const { data, error } = await supabase
          .from('lesson_ratings')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', itemId)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setExistingRating(data);
          setRating(data.rating);
          setComment(data.comment || '');
        }
      } else {
        const { data, error } = await supabase
          .from('course_ratings')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', itemId)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setExistingRating(data);
          setRating(data.rating);
          setComment(data.comment || '');
        }
      }
    } catch (error) {
      console.error('Error fetching existing rating:', error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setIsSubmitting(true);
    try {
      if (type === 'lesson') {
        const { error } = await supabase
          .from('lesson_ratings')
          .upsert([
            {
              user_id: user.id,
              lesson_id: itemId,
              rating,
              comment: comment.trim() || null
            }
          ], {
            onConflict: 'user_id,lesson_id'
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('course_ratings')
          .upsert([
            {
              user_id: user.id,
              course_id: itemId,
              rating,
              comment: comment.trim() || null
            }
          ], {
            onConflict: 'user_id,course_id'
          });

        if (error) throw error;
      }

      toast({
        title: existingRating ? 'Rating Updated' : 'Rating Submitted',
        description: `Thank you for ${existingRating ? 'updating your rating for' : 'rating'} this ${type}!`,
      });

      onRatingSubmitted();
      onClose();
      resetForm();
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

  const resetForm = () => {
    setRating(0);
    setComment('');
    setExistingRating(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 border-2 border-black">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-black">
              {existingRating ? 'Update Your Rating' : `Rate ${type === 'lesson' ? 'Lesson' : 'Course'}`}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-gray-600 text-sm">{itemTitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Your Rating *
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Comment (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this lesson..."
              className="border-2 border-black"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-black text-black hover:bg-gray-100"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
