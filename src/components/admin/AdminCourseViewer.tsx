
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LessonPlayer } from '../courses/LessonPlayer';
import { AdminCourseHeader } from './AdminCourseHeader';
import { AdminLessonSidebar } from './AdminLessonSidebar';
import { useAdminCourseData } from '@/hooks/useAdminCourseData';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  text_content: string;
  order_index: number;
}

export const AdminCourseViewer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { course, lessons, courseStats, isLoading } = useAdminCourseData(courseId);

  // Set first lesson as selected when lessons load
  React.useEffect(() => {
    if (lessons.length > 0 && !selectedLesson) {
      setSelectedLesson(lessons[0]);
    }
  }, [lessons, selectedLesson]);

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
      <AdminCourseHeader course={course} courseStats={courseStats} />

      <div className="flex">
        <AdminLessonSidebar
          lessons={lessons}
          selectedLesson={selectedLesson}
          onLessonSelect={setSelectedLesson}
        />

        {/* Main Content */}
        <div className="flex-1">
          {selectedLesson ? (
            <LessonPlayer
              lesson={selectedLesson}
              isCompleted={false}
              onComplete={() => {
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
