
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourseManagement } from './CourseManagement';
import { UserManagement } from './UserManagement';
import { EnrollmentTracking } from './EnrollmentTracking';
import { AccessRequestManagement } from './AccessRequestManagement';
import { RatingsFeedbackManagement } from './RatingsFeedbackManagement';

export const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8">Admin Dashboard</h1>
        
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
  );
};
