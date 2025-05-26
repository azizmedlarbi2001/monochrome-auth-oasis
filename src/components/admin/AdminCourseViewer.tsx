
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, CheckCircle, Users, Star } from 'lucide-react';
import { LessonPlayer } from '../courses/LessonPlayer';

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

interface CourseStats {
  totalEnrollments: number;
  averageRating: number;
  totalRatings: number;
}

export const AdminCourseViewer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats>({
    totalEnrollments: 0,
    averageRating: 0,
    totalRatings: 0
  });
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

      // Fetch course stats
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId);

      if (enrollmentsError) throw enrollmentsError;

      const { data: ratingsData, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('course_id', courseId);

      if (ratingsError) throw ratingsError;

      const averageRating = ratingsData.length > 0
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
        : 0;

      setCourse(courseData);
      setLessons(lessonsData || []);
      setCourseStats({
        totalEnrollments: enrollmentsData.length,
        averageRating,
        totalRatings: ratingsData.length
      });
      
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-black">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Course Not Found</h2>
          <Button onClick={() => navigate('/admin')} className="bg-black text-white">
            Back to Admin Panel
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
              onClick={() => navigate('/admin')}
              variant="outline"
              className="border-black text-black hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-xl font-bold text-black">{course.title}</h1>
              <p className="text-gray-600">{course.category} • Admin Preview</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {courseStats.totalEnrollments} enrolled
              </div>
              {courseStats.totalRatings > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="w-4 h-4" />
                  {courseStats.averageRating.toFixed(1)} ({courseStats.totalRatings} ratings)
                </div>
              )}
            </div>
            <Badge variant="outline" className="text-red-700 border-red-500 bg-red-50">
              Admin View
            </Badge>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Lesson Sidebar */}
        <div className="w-80 border-r-2 border-black bg-gray-50 min-h-screen">
          <div className="p-4">
            <h3 className="font-bold text-black mb-4">Course Content</h3>
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
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
                        <Play className="w-5 h-5 text-gray-400" />
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
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {selectedLesson ? (
            <LessonPlayer
              lesson={selectedLesson}
              isCompleted={false}
              onMarkComplete={() => {
                toast({
                  title: 'Admin Preview',
                  description: 'This is a preview. Progress is not saved for admins.',
                });
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">Select a lesson to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
