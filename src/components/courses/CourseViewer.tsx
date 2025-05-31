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
import { RatingModal } from './RatingModal';

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
  const [showCourseRatingModal, setShowCourseRatingModal] = useState(false);
  const [hasCourseRating, setHasCourseRating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // <-- move here
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
      // Debug: log lessonsData
      console.log('Fetched lessonsData:', lessonsData);

      // Defensive: ensure lessonsData is an array
      const safeLessons = Array.isArray(lessonsData) ? lessonsData : [];

      // Fetch progress only if there are lessons
      let progressData = [];
      if (safeLessons.length > 0) {
        const { data: progressFetched, error: progressError } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', safeLessons.map(l => l.id));
        if (progressError) throw progressError;
        progressData = progressFetched || [];
      }

      // Check if user has rated the course
      const { data: courseRating, error: courseRatingError } = await supabase
        .from('course_ratings')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (courseRatingError && courseRatingError.code !== 'PGRST116') {
        throw courseRatingError;
      }

      setCourse(courseData);
      setLessons(safeLessons);
      setProgress(progressData);
      setHasCourseRating(!!courseRating);
      
      // Select first lesson by default
      if (lessonsData && lessonsData.length > 0) {
        setSelectedLesson(lessonsData[0]);
      }

      // Check if course is completed and needs rating
      checkCourseCompletion(lessonsData, progressData || [], enrollment);
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

  const checkCourseCompletion = async (lessonsData: Lesson[], progressData: LessonProgress[], enrollment: any) => {
    if (lessonsData.length === 0) return;

    const allLessonsCompleted = lessonsData.every(lesson => 
      progressData.some(p => p.lesson_id === lesson.id && p.completed)
    );

    if (allLessonsCompleted) {
      // Mark enrollment as completed if not already marked
      if (!enrollment.completed_at) {
        try {
          await supabase
            .from('enrollments')
            .update({ completed_at: new Date().toISOString() })
            .eq('id', enrollment.id);
        } catch (error) {
          console.error('Error updating enrollment completion:', error);
        }
      }

      // Show rating modal if user hasn't rated the course yet
      if (!hasCourseRating) {
        setShowCourseRatingModal(true);
      }
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

  const handleCourseRatingSubmitted = () => {
    setHasCourseRating(true);
    toast({
      title: 'Course Completed!',
      description: 'Congratulations on completing the course!',
    });
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

  const allLessonsCompleted = lessons.length > 0 && lessons.every(lesson => 
    progress.some(p => p.lesson_id === lesson.id && p.completed)
  );



  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b-2 border-black p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
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
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Button className="sm:hidden border-black text-black" variant="outline" onClick={() => setSidebarOpen(true)}>
              Show Lessons
            </Button>
            <Badge variant="outline" className="text-green-700 border-green-500 bg-green-50">
              Enrolled
            </Badge>
            {allLessonsCompleted && hasCourseRating && (
              <Badge variant="outline" className="text-blue-700 border-blue-500 bg-blue-50">
                Completed
              </Badge>
            )}
          </div>
        </div>
      </nav>

      <div className="flex flex-col sm:flex-row">
        {/* Sidebar for desktop, Drawer for mobile */}
        {/* Desktop Sidebar */}
        <div className="hidden sm:block w-80 border-r-2 border-black bg-gray-50 min-h-screen flex-shrink-0">
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
            {allLessonsCompleted && (
              <div className="mt-6 p-4 border-2 border-green-500 bg-green-50 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Course Completed!</span>
                </div>
                {!hasCourseRating && (
                  <Button
                    onClick={() => setShowCourseRatingModal(true)}
                    size="sm"
                    className="w-full bg-green-600 text-white hover:bg-green-700"
                  >
                    Rate Course
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Drawer Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex">
            <div className="w-4/5 max-w-xs bg-white border-r-2 border-black min-h-screen p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-black">Course Content</h3>
                <Button size="sm" variant="outline" className="border-black text-black" onClick={() => setSidebarOpen(false)}>
                  Close
                </Button>
              </div>
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
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setSidebarOpen(false);
                      }}
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
              {allLessonsCompleted && (
                <div className="mt-6 p-4 border-2 border-green-500 bg-green-50 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Course Completed!</span>
                  </div>
                  {!hasCourseRating && (
                    <Button
                      onClick={() => {
                        setShowCourseRatingModal(true);
                        setSidebarOpen(false);
                      }}
                      size="sm"
                      className="w-full bg-green-600 text-white hover:bg-green-700"
                    >
                      Rate Course
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {lessons.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500 text-lg">No lessons found for this course. Please contact your instructor.</p>
            </div>
          ) : selectedLesson ? (
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

      <RatingModal
        isOpen={showCourseRatingModal}
        onClose={() => setShowCourseRatingModal(false)}
        type="course"
        itemId={courseId!}
        itemTitle={course.title}
        onRatingSubmitted={handleCourseRatingSubmitted}
      />
    </div>
  );
};
