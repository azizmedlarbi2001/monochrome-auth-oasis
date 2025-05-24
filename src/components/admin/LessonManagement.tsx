
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, HelpCircle } from 'lucide-react';
import { LessonForm } from './LessonForm';
import { MCQManagement } from './MCQManagement';
import { Badge } from '@/components/ui/badge';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  tutor: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  text_content: string;
  images: string[];
  order_index: number;
}

interface LessonManagementProps {
  course: Course;
  onBack: () => void;
}

export const LessonManagement = ({ course, onBack }: LessonManagementProps) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLessons();
  }, [course.id]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch lessons.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson? This will also delete all MCQs.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lesson deleted successfully.',
      });

      fetchLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lesson.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingLesson(null);
    fetchLessons();
  };

  if (selectedLesson) {
    return (
      <MCQManagement 
        lesson={selectedLesson} 
        onBack={() => setSelectedLesson(null)} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-2xl font-bold text-black">Loading lessons...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-black text-black hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-black">{course.title} - Lessons</h2>
          <p className="text-gray-600">{course.description}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Badge variant="outline" className="text-black border-black">
          {lessons.length} Lessons
        </Badge>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lesson
        </Button>
      </div>

      {showForm && (
        <LessonForm
          courseId={course.id}
          lesson={editingLesson}
          nextOrderIndex={lessons.length}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingLesson(null);
          }}
        />
      )}

      <div className="space-y-4">
        {lessons.map((lesson, index) => (
          <Card key={lesson.id} className="border-2 border-black">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-black">
                    {index + 1}. {lesson.title}
                  </CardTitle>
                  <p className="text-gray-600 mt-2">{lesson.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedLesson(lesson)}
                    variant="outline"
                    size="sm"
                    className="border-black text-black hover:bg-gray-100"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    MCQs
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingLesson(lesson);
                      setShowForm(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-black text-black hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteLesson(lesson.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lesson.video_url && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-black">Video</h4>
                    <div className="bg-gray-100 p-3 rounded border">
                      <a 
                        href={lesson.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Video
                      </a>
                    </div>
                  </div>
                )}
                
                {lesson.text_content && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-black">Text Content</h4>
                    <div className="bg-gray-100 p-3 rounded border max-h-20 overflow-y-auto">
                      <p className="text-sm text-gray-700">{lesson.text_content}</p>
                    </div>
                  </div>
                )}
                
                {lesson.images && lesson.images.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-black">Images</h4>
                    <div className="bg-gray-100 p-3 rounded border">
                      <p className="text-sm text-gray-700">{lesson.images.length} image(s)</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lessons.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No lessons found. Add your first lesson!</p>
        </div>
      )}
    </div>
  );
};
