
import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

const AdminPage = () => {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminDashboard />
    </ProtectedRoute>
  );
};

export default AdminPage;
