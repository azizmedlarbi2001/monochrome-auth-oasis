
import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminCourseViewer } from '@/components/admin/AdminCourseViewer';

const AdminCourseViewPage = () => {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminCourseViewer />
    </ProtectedRoute>
  );
};

export default AdminCourseViewPage;
