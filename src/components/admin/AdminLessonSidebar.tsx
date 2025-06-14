
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  text_content: string;
  order_index: number;
}

interface AdminLessonSidebarProps {
  lessons: Lesson[];
  selectedLesson: Lesson | null;
  onLessonSelect: (lesson: Lesson) => void;
}

export const AdminLessonSidebar: React.FC<AdminLessonSidebarProps> = ({
  lessons,
  selectedLesson,
  onLessonSelect,
}) => {
  return (
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
              onClick={() => onLessonSelect(lesson)}
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
  );
};
