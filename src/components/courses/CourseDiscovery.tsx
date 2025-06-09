
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, BookOpen, Clock, User, Star, MessageSquare, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAccessRequests } from './UserAccessRequests';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  tutor: string;
  deliverables: string[];
  created_at: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  course: Course;
}

interface AccessRequest {
  id: string;
  course_id: string;
  status: string;
  requested_at: string;
}

export const CourseDiscovery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [myRequests, setMyRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [user]);

  // Debug: log state after fetch
  useEffect(() => {
    console.log('availableCourses', availableCourses);
    console.log('myEnrollments', myEnrollments);
    console.log('myRequests', myRequests);
  }, [availableCourses, myEnrollments, myRequests]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch available courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch user's enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('user_id', user.id);

      if (enrollmentsError) throw enrollmentsError;

      // Fetch user's access requests
      const { data: requests, error: requestsError } = await supabase
        .from('course_access_requests')
        .select('*')
        .eq('user_id', user.id);

      if (requestsError) throw requestsError;

      setAvailableCourses(courses || []);
      setMyEnrollments(enrollments || []);
      setMyRequests(requests || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courses.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = availableCourses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description ? course.description.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
    (course.category ? course.category.toLowerCase().includes(searchTerm.toLowerCase()) : false)
  );

  const requestAccess = async (courseId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('course_access_requests')
        .insert([
          {
            user_id: user.id,
            course_id: courseId,
            message: 'I would like to request access to this course.'
          }
        ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Access request sent successfully!',
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error requesting access:', error);
      toast({
        title: 'Error',
        description: 'Failed to send access request.',
        variant: 'destructive',
      });
    }
  };

  const getRequestStatus = (courseId: string) => {
    return myRequests.find(req => req.course_id === courseId);
  };

  const isEnrolled = (courseId: string) => {
    return myEnrollments.some(enrollment => enrollment.course_id === courseId);
  };

  const viewCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  const viewAdminCourse = (courseId: string) => {
    navigate(`/admin/course/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-black">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b-2 border-black p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">Mentify Courses</h1>
          <div className="flex items-center space-x-4">
            <span className="text-black font-medium">{user?.email}</span>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-black text-white hover:bg-gray-800 border-2 border-black"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              onClick={() => setShowMyRequests(!showMyRequests)}
              variant="outline"
              className="bg-white text-black border-2 border-black hover:bg-gray-100"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              My Requests
            </Button>
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="bg-white text-black border-2 border-black hover:bg-gray-100"
              >
                Admin Panel
              </Button>
            )}
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
          {/* Show access requests if toggled */}
          {showMyRequests ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowMyRequests(false)}
                  variant="outline"
                  className="border-black"
                >
                  ← Back to Courses
                </Button>
                <h2 className="text-2xl font-bold text-black">My Course Requests</h2>
              </div>
              
              {selectedCourseId ? (
                <UserAccessRequests courseId={selectedCourseId} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myRequests.map((request) => {
                    const course = availableCourses.find(c => c.id === request.course_id);
                    if (!course) return null;
                    
                    return (
                      <Card key={request.id} className="border-2 border-black">
                        <CardHeader>
                          <CardTitle className="text-black">{course.title}</CardTitle>
                          <Badge variant="outline" className="w-fit">
                            {request.status}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-4 line-clamp-3">{course.description}</p>
                          <Button
                            onClick={() => setSelectedCourseId(request.course_id)}
                            className="w-full bg-black text-white hover:bg-gray-800"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            View Messages
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search courses by title, description, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 border-black text-black placeholder-gray-500 focus:ring-0 focus:border-black"
                  />
                </div>
              </div>

              {/* Search Results (when searching) */}
              {searchTerm && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-black mb-4">
                    Search Results ({filteredCourses.length})
                  </h2>
                  {filteredCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-lg">No courses found matching your search.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 sm:px-0">
                      {filteredCourses.map((course) => {
                        const isUserEnrolled = isEnrolled(course.id);
                        const request = getRequestStatus(course.id);

                        return (
                          <Card key={course.id} className="border-2 border-black">
                            <CardHeader>
                              <CardTitle className="text-black">{course.title}</CardTitle>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-black border-black">
                                  {course.category}
                                </Badge>
                                <Badge variant="outline" className="text-black border-black">
                                  {course.tutor}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-700 mb-4 line-clamp-3">{course.description || 'No description provided.'}</p>
                              
                              {Array.isArray(course.deliverables) && course.deliverables.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="font-medium text-black mb-2">What you'll learn:</h4>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {course.deliverables.slice(0, 3).map((deliverable, index) => (
                                      <li key={index}>• {deliverable}</li>
                                    ))}
                                    {course.deliverables.length > 3 && (
                                      <li className="text-gray-500">+ {course.deliverables.length - 3} more...</li>
                                    )}
                                  </ul>
                                </div>
                              )}

                              <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  Created {new Date(course.created_at).toLocaleDateString()}
                                </span>
                              </div>

                              {isUserEnrolled ? (
                                <Button
                                  onClick={() => viewCourse(course.id)}
                                  className="w-full bg-black text-white hover:bg-gray-800"
                                >
                                  <BookOpen className="w-4 h-4 mr-2" />
                                  View Course
                                </Button>
                              ) : isAdmin ? (
                                <Button
                                  onClick={() => viewAdminCourse(course.id)}
                                  variant="outline"
                                  className="w-full border-blue-500 text-blue-500 hover:bg-blue-50"
                                >
                                  Preview as Admin
                                </Button>
                              ) : request ? (
                                <Button
                                  disabled
                                  variant="outline"
                                  className="w-full border-orange-500 text-orange-500"
                                >
                                  {request.status === 'pending' && 'Request Pending'}
                                  {request.status === 'approved' && 'Request Approved'}
                                  {request.status === 'rejected' && 'Request Rejected'}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => requestAccess(course.id)}
                                  variant="outline"
                                  className="w-full border-black text-black hover:bg-gray-100"
                                >
                                  Request Access
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* My Enrollments (always visible when not searching) */}
              {!searchTerm && myEnrollments.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-black mb-4">My Enrolled Courses</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 sm:px-0">
                    {myEnrollments.map((enrollment) => (
                      <Card key={enrollment.id} className="border-2 border-black">
                        <CardHeader>
                          <CardTitle className="text-black">{enrollment.course.title}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-green-700 border-green-500 bg-green-50">
                              Enrolled
                            </Badge>
                            <Badge variant="outline" className="text-black border-black">
                              {enrollment.course.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                              <p className="text-gray-700 mb-4 line-clamp-3">{enrollment.course.description || 'No description provided.'}</p>
                          <div className="flex items-center gap-2 mb-4">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{enrollment.course.tutor}</span>
                          </div>
                          <Button
                            onClick={() => viewCourse(enrollment.course.id)}
                            className="w-full bg-black text-white hover:bg-gray-800"
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Continue Learning
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Courses (when not searching) */}
              {!searchTerm && (
                <div>
                  <h2 className="text-2xl font-bold text-black mb-4">Available Courses</h2>
                  {availableCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">No courses available.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 sm:px-0">
                      {availableCourses.map((course) => {
                        const isUserEnrolled = isEnrolled(course.id);
                        const request = getRequestStatus(course.id);

                        // Skip showing enrolled courses in available section
                        if (isUserEnrolled) return null;

                        return (
                          <Card key={course.id} className="border-2 border-black">
                            <CardHeader>
                              <CardTitle className="text-black">{course.title}</CardTitle>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-black border-black">
                                  {course.category}
                                </Badge>
                                <Badge variant="outline" className="text-black border-black">
                                  {course.tutor}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-700 mb-4 line-clamp-3">{course.description}</p>
                              
                              {course.deliverables && course.deliverables.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="font-medium text-black mb-2">What you'll learn:</h4>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {course.deliverables.slice(0, 3).map((deliverable, index) => (
                                      <li key={index}>• {deliverable}</li>
                                    ))}
                                    {course.deliverables.length > 3 && (
                                      <li className="text-gray-500">+ {course.deliverables.length - 3} more...</li>
                                    )}
                                  </ul>
                                </div>
                              )}

                              <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  Created {new Date(course.created_at).toLocaleDateString()}
                                </span>
                              </div>

                              {isAdmin ? (
                                <Button
                                  onClick={() => viewAdminCourse(course.id)}
                                  variant="outline"
                                  className="w-full border-blue-500 text-blue-500 hover:bg-blue-50"
                                >
                                  Preview as Admin
                                </Button>
                              ) : request ? (
                                <Button
                                  disabled
                                  variant="outline"
                                  className="w-full border-orange-500 text-orange-500"
                                >
                                  {request.status === 'pending' && 'Request Pending'}
                                  {request.status === 'approved' && 'Request Approved'}
                                  {request.status === 'rejected' && 'Request Rejected'}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => requestAccess(course.id)}
                                  variant="outline"
                                  className="w-full border-black text-black hover:bg-gray-100"
                                >
                                  Request Access
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
