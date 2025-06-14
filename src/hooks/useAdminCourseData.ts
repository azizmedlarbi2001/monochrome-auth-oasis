
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

export const useAdminCourseData = (courseId: string | undefined) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats>({
    totalEnrollments: 0,
    averageRating: 0,
    totalRatings: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

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

  return {
    course,
    lessons,
    courseStats,
    isLoading
  };
};
