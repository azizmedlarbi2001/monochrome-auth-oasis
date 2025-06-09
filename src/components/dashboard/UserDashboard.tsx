
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Star, Trophy, MessageCircle, FileText } from 'lucide-react';
import { PointsDashboard } from '../user/PointsDashboard';
import { UserAccessRequestsSection } from '../user/UserAccessRequestsSection';

export const UserDashboard = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'points'>('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'requests':
        return (
          <div className="bg-white border-2 border-black p-8">
            <UserAccessRequestsSection />
          </div>
        );
      case 'points':
        return (
          <div className="bg-white border-2 border-black p-8">
            <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Rewards & Points
            </h2>
            <PointsDashboard />
          </div>
        );
      default:
        return (
          <>
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
                
                <div className="border-2 border-black p-6">
                  <h3 className="text-xl font-bold text-black mb-2">Quick Stats</h3>
                  <p className="text-black mb-2">📚 Access messaging from Course Requests tab</p>
                  <p className="text-black mb-2">🏆 Check your points in Rewards & Points tab</p>
                  <p className="text-black">🎯 Complete courses to earn more rewards!</p>
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

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className="bg-white border-2 border-black p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab('requests')}
              >
                <div className="flex items-center gap-4">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-bold text-black">Course Requests & Messaging</h3>
                    <p className="text-gray-600">Request course access and message admins</p>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white border-2 border-black p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab('points')}
              >
                <div className="flex items-center gap-4">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                  <div>
                    <h3 className="text-xl font-bold text-black">Rewards & Points</h3>
                    <p className="text-gray-600">Check your points and redeem rewards</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

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

      {/* Tab Navigation */}
      <div className="border-b-2 border-black bg-gray-50">
        <div className="max-w-6xl mx-auto flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white border-r-2 border-black text-black'
                : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'requests'
                ? 'bg-white border-r-2 border-black text-black'
                : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Course Requests
          </button>
          <button
            onClick={() => setActiveTab('points')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'points'
                ? 'bg-white border-r-2 border-black text-black'
                : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Rewards & Points
          </button>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
