
import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CourseDiscovery } from '@/components/courses/CourseDiscovery';

const CoursesPage = () => {
  return (
    <ProtectedRoute>
      <CourseDiscovery />
    </ProtectedRoute>
  );
};

export default CoursesPage;
