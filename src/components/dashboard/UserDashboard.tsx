
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Star, Trophy } from 'lucide-react';
import { PointsDashboard } from '../user/PointsDashboard';

export const UserDashboard = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b-2 border-black p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">Dashboard</h1>
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <span className="bg-black text-white px-3 py-1 text-sm font-bold">
                ADMIN
              </span>
            )}
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border-2 border-black p-8 mb-8">
            <h2 className="text-3xl font-bold text-black mb-4">
              Welcome back!
            </h2>
            <p className="text-black text-lg mb-6">
              Ready to continue your learning journey and earn rewards?
            </p>
            
            <div className="flex gap-4 mb-8">
              <Button 
                className="bg-black text-white hover:bg-gray-800 border-2 border-black"
                onClick={() => navigate('/courses')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-black p-6">
                <h3 className="text-xl font-bold text-black mb-2">Your Profile</h3>
                <p className="text-black"><strong>Email:</strong> {user?.email}</p>
                <p className="text-black"><strong>User ID:</strong> {user?.id}</p>
                <p className="text-black"><strong>Role:</strong> {isAdmin ? 'Admin' : 'User'}</p>
              </div>
              
              {isAdmin && (
                <div className="border-2 border-black p-6">
                  <h3 className="text-xl font-bold text-black mb-2">Admin Access</h3>
                  <p className="text-black mb-4">
                    You have administrative privileges to manage courses and users.
                  </p>
                  <Button 
                    className="bg-black text-white hover:bg-gray-800 border-2 border-black"
                    onClick={() => navigate('/admin')}
                  >
                    Go to Admin Panel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Points Dashboard */}
          <div className="bg-white border-2 border-black p-8">
            <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Rewards & Points
            </h2>
            <PointsDashboard />
          </div>
        </div>
      </div>
    </div>
  );
};
