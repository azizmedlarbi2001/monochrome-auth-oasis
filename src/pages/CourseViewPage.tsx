
import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CourseViewer } from '@/components/courses/CourseViewer';

const CourseViewPage = () => (
  <ProtectedRoute>
    <CourseViewer />
  </ProtectedRoute>
);

export default CourseViewPage;
