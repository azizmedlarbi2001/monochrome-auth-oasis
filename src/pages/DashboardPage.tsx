
import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserDashboard } from '@/components/dashboard/UserDashboard';

const DashboardPage = () => (
  <ProtectedRoute>
    <UserDashboard />
  </ProtectedRoute>
);

export default DashboardPage;
