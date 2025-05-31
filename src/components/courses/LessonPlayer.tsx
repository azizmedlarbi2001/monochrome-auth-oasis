import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { CheckCircle, Play, BookOpen } from 'lucide-react';
import { RatingModal } from './RatingModal';
import { LessonAICompanion } from './LessonAICompanion';
import { MCQQuiz } from './MCQQuiz';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  text_content: string;
  order_index: number;
}

interface LessonPlayerProps {
  lesson: Lesson;
  isCompleted: boolean;
  onMarkComplete: () => void;
}

export const LessonPlayer = ({ lesson, isCompleted, onMarkComplete }: LessonPlayerProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [hasPassedQuiz, setHasPassedQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkIfUserHasRated();
    checkQuizStatus();
  }, [lesson.id, user]);

  const checkIfUserHasRated = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lesson_ratings')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setHasRated(!!data);
    } catch (error) {
      console.error('Error checking rating:', error);
    }
  };

  const checkQuizStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('mcq_score, mcq_total')
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setQuizScore({ score: data.mcq_score, total: data.mcq_total });
        setHasPassedQuiz(data.mcq_score >= Math.ceil(data.mcq_total * 0.7));
      }
    } catch (error) {
      console.error('Error checking quiz status:', error);
    }
  };

  const handleQuizComplete = async (passed: boolean, score: number, total: number) => {
    setHasPassedQuiz(passed);
    setQuizScore({ score, total });

    if (passed) {
      toast({
        title: 'Quiz Passed! 🎉',
        description: `You scored ${score}/${total}. You can now proceed to the next lesson.`,
      });

      // Update progress with quiz score
      try {
        const progressData = {
          user_id: user?.id,
          lesson_id: lesson.id,
          mcq_score: score,
          mcq_total: total,
          completed: true,
          completed_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('lesson_progress')
          .upsert([progressData]);

        if (error) throw error;
        onMarkComplete();
      } catch (error) {
        console.error('Error updating progress:', error);
        toast({
          title: 'Error',
          description: 'Failed to update lesson progress.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Quiz Not Passed',
        description: `You scored ${score}/${total}. You need 70% to pass. Try again!`,
        variant: 'destructive',
      });
    }
  };

  const handleMarkComplete = () => {
    if (!hasPassedQuiz) {
      setShowQuiz(true);
      return;
    }

    if (!hasRated) {
      setShowRatingModal(true);
    } else {
      onMarkComplete();
    }
  };

  const handleRatingSubmitted = () => {
    setHasRated(true);
    onMarkComplete();
  };

  // Improved video URL processing for better compatibility
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Handle YouTube URLs
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;
      }
    }
    
    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
      let videoId = '';
      
      if (url.includes('/file/d/')) {
        videoId = url.split('/file/d/')[1].split('/')[0];
      } else if (url.includes('id=')) {
        videoId = url.split('id=')[1].split('&')[0];
      }
      
      if (videoId) {
        return `https://drive.google.com/file/d/${videoId}/preview`;
      }
    }
    
    // Handle direct video URLs
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg')) {
      return url;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(lesson.video_url);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">{lesson.title}</h1>
              <p className="text-gray-600">{lesson.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              ) : (
                <Button
                  onClick={handleMarkComplete}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  {hasPassedQuiz ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Take Quiz
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Quiz Score Display */}
          {quizScore && (
            <div className={`mb-4 p-3 rounded-lg border ${
              hasPassedQuiz 
                ? 'border-green-500 bg-green-50 text-green-800' 
                : 'border-yellow-500 bg-yellow-50 text-yellow-800'
            }`}>
              <div className="flex items-center gap-2">
                {hasPassedQuiz ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <BookOpen className="w-5 h-5" />
                )}
                <span>
                  Quiz Score: {quizScore.score}/{quizScore.total} 
                  ({Math.round((quizScore.score / quizScore.total) * 100)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Video Player */}
        {lesson.video_url && (
          <Card className="border-2 border-black mb-6">
            <CardHeader>
              <CardTitle className="text-black">Lesson Video</CardTitle>
            </CardHeader>
            <CardContent>
              {!showVideo ? (
                <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                  <Button
                    onClick={() => setShowVideo(true)}
                    className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-4"
                  >
                    <Play className="w-6 h-6 mr-2" />
                    Play Video
                  </Button>
                </div>
              ) : (
                <div className="aspect-video">
                  <iframe
                    className="w-full h-full rounded-lg"
                    src={getEmbedUrl(lesson.video_url)}
                    allowFullScreen
                    title={lesson.title}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Text Content */}
        {lesson.text_content && (
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle className="text-black">Lesson Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {lesson.text_content}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!lesson.video_url && !lesson.text_content && (
          <div className="text-center py-12">
            <p className="text-gray-500">No content available for this lesson yet.</p>
          </div>
        )}

        {/* AI Companion Section */}
        <LessonAICompanion lessonText={lesson.text_content || lesson.description || ''} />
      </div>

      {/* MCQ Quiz Dialog */}
      <AlertDialog open={showQuiz} onOpenChange={setShowQuiz}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Lesson Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              You need to score at least 70% to complete this lesson.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <MCQQuiz
            lessonId={lesson.id}
            onQuizComplete={handleQuizComplete}
            onClose={() => setShowQuiz(false)}
          />
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        type="lesson"
        itemId={lesson.id}
        itemTitle={lesson.title}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </div>
  );
};
