
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, Star } from 'lucide-react';

interface CourseStats {
  totalEnrollments: number;
  averageRating: number;
  totalRatings: number;
}

interface AdminCourseStatsProps {
  courseStats: CourseStats;
}

export const AdminCourseStats: React.FC<AdminCourseStatsProps> = ({ courseStats }) => {
  return (
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
  );
};
