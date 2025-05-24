
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { CourseForm } from './CourseForm';
import { LessonManagement } from './LessonManagement';
import { Badge } from '@/components/ui/badge';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  tutor: string;
  deliverables: string[];
  created_at: string;
}

export const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courses.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all lessons and MCQs.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Course deleted successfully.',
      });

      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCourse(null);
    fetchCourses();
  };

  if (selectedCourse) {
    return (
      <LessonManagement 
        course={selectedCourse} 
        onBack={() => setSelectedCourse(null)} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-2xl font-bold text-black">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black">Courses</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </div>

      {showForm && (
        <CourseForm
          course={editingCourse}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingCourse(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="border-2 border-black">
            <CardHeader>
              <CardTitle className="text-black">{course.title}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-black border-black">
                  {course.category}
                </Badge>
                <Badge variant="outline" className="text-black border-black">
                  {course.tutor}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4 line-clamp-3">{course.description}</p>
              
              {course.deliverables && course.deliverables.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-black mb-2">Deliverables:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {course.deliverables.map((deliverable, index) => (
                      <li key={index}>• {deliverable}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedCourse(course)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-black text-black hover:bg-gray-100"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Lessons
                </Button>
                <Button
                  onClick={() => {
                    setEditingCourse(course);
                    setShowForm(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => deleteCourse(course.id)}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No courses found. Create your first course!</p>
        </div>
      )}
    </div>
  );
};
