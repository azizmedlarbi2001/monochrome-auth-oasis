
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AdminCourseStats } from './AdminCourseStats';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  tutor: string;
  deliverables: string[];
}

interface CourseStats {
  totalEnrollments: number;
  averageRating: number;
  totalRatings: number;
}

interface AdminCourseHeaderProps {
  course: Course;
  courseStats: CourseStats;
}

export const AdminCourseHeader: React.FC<AdminCourseHeaderProps> = ({ course, courseStats }) => {
  const navigate = useNavigate();

  return (
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
        <AdminCourseStats courseStats={courseStats} />
      </div>
    </nav>
  );
};
