
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, CheckCircle, Lock } from 'lucide-react';
import { LessonPlayer } from './LessonPlayer';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  tutor: string;
  deliverables: string[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  text_content: string;
  order_index: number;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  completed_at: string;
  mcq_score: number;
  mcq_total: number;
}

export const CourseViewer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    if (!courseId || !user) return;

    try {
      // Check if user is enrolled
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (enrollmentError && enrollmentError.code !== 'PGRST116') {
        throw enrollmentError;
      }

      setIsEnrolled(!!enrollment);

      if (!enrollment) {
        toast({
          title: 'Access Denied',
          description: 'You need to be enrolled in this course to view it.',
          variant: 'destructive',
        });
        navigate('/courses');
        return;
      }

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (lessonsError) throw lessonsError;

      // Fetch progress
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', lessonsData.map(l => l.id));

      if (progressError) throw progressError;

      setCourse(courseData);
      setLessons(lessonsData || []);
      setProgress(progressData || []);
      
      // Select first lesson by default
      if (lessonsData && lessonsData.length > 0) {
        setSelectedLesson(lessonsData[0]);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLessonProgress = (lessonId: string) => {
    return progress.find(p => p.lesson_id === lessonId);
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert([
          {
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      // Refresh progress
      fetchCourseData();
      
      toast({
        title: 'Lesson Completed',
        description: 'Great job! Keep up the learning.',
      });
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lesson progress.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-black">Loading course...</div>
      </div>
    );
  }

  if (!course || !isEnrolled) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Access Required</h2>
          <p className="text-gray-600 mb-4">You need to be enrolled to view this course.</p>
          <Button onClick={() => navigate('/courses')} className="bg-black text-white">
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b-2 border-black p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/courses')}
              variant="outline"
              className="border-black text-black hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
            <div>
              <h1 className="text-xl font-bold text-black">{course.title}</h1>
              <p className="text-gray-600">{course.category}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-green-700 border-green-500 bg-green-50">
            Enrolled
          </Badge>
        </div>
      </nav>

      <div className="flex">
        {/* Lesson Sidebar */}
        <div className="w-80 border-r-2 border-black bg-gray-50 min-h-screen">
          <div className="p-4">
            <h3 className="font-bold text-black mb-4">Course Content</h3>
            <div className="space-y-2">
              {lessons.map((lesson, index) => {
                const lessonProgress = getLessonProgress(lesson.id);
                const isCompleted = lessonProgress?.completed;
                
                return (
                  <Card
                    key={lesson.id}
                    className={`cursor-pointer transition-colors ${
                      selectedLesson?.id === lesson.id
                        ? 'border-black bg-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Play className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black truncate">
                            {index + 1}. {lesson.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {lesson.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {selectedLesson ? (
            <LessonPlayer
              lesson={selectedLesson}
              isCompleted={!!getLessonProgress(selectedLesson.id)?.completed}
              onMarkComplete={() => markLessonComplete(selectedLesson.id)}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">Select a lesson to begin learning</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
