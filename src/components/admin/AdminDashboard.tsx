
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CourseManagement } from './CourseManagement';
import { UserManagement } from './UserManagement';
import { EnrollmentTracking } from './EnrollmentTracking';
import { AccessRequestManagement } from './AccessRequestManagement';
import { RatingsFeedbackManagement } from './RatingsFeedbackManagement';

export const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b-2 border-black p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="bg-white text-black border-2 border-black hover:bg-gray-100"
            >
              User Dashboard
            </Button>
            <Button
              onClick={() => navigate('/courses')}
              variant="outline"
              className="bg-white text-black border-2 border-black hover:bg-gray-100"
            >
              Browse Courses
            </Button>
            <span className="text-black font-medium">{user?.email}</span>
            <Button
              onClick={signOut}
              variant="outline"
              className="bg-white text-black border-2 border-black hover:bg-gray-100"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="courses" className="w-full">
            <TabsList
              className="w-full mb-8 grid grid-cols-2 sm:grid-cols-5 gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300"
              style={{ minWidth: 0 }}
            >
              <TabsTrigger value="courses" className="text-black font-medium">Course Management</TabsTrigger>
              <TabsTrigger value="requests" className="text-black font-medium">Access Requests</TabsTrigger>
              <TabsTrigger value="users" className="text-black font-medium">User Management</TabsTrigger>
              <TabsTrigger value="enrollments" className="text-black font-medium">Enrollment Tracking</TabsTrigger>
              <TabsTrigger value="ratings" className="text-black font-medium">Ratings & Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="courses">
              <CourseManagement />
            </TabsContent>
            
            <TabsContent value="requests">
              <AccessRequestManagement />
            </TabsContent>
            
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="enrollments">
              <EnrollmentTracking />
            </TabsContent>
            
            <TabsContent value="ratings">
              <RatingsFeedbackManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
