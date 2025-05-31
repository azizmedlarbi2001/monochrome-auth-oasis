
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, BookOpen, PlayCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CourseRating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  course_id: string;
  user_id: string;
  courses?: {
    title: string;
  } | null;
  profiles?: {
    email: string;
    full_name: string | null;
  } | null;
}

interface LessonRating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  lesson_id: string;
  user_id: string;
  lessons?: {
    title: string;
    courses?: {
      title: string;
    } | null;
  } | null;
  profiles?: {
    email: string;
    full_name: string | null;
  } | null;
}

export const RatingsFeedbackManagement = () => {
  const [activeTab, setActiveTab] = useState('courses');

  const { data: courseRatings, isLoading: loadingCourseRatings } = useQuery({
    queryKey: ['admin-course-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          *,
          courses(title),
          profiles(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching course ratings:', error);
        throw error;
      }
      return data as CourseRating[];
    },
  });

  const { data: lessonRatings, isLoading: loadingLessonRatings } = useQuery({
    queryKey: ['admin-lesson-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_ratings')
        .select(`
          *,
          lessons(
            title,
            courses(title)
          ),
          profiles(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lesson ratings:', error);
        throw error;
      }
      return data as LessonRating[];
    },
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAverageRating = (ratings: any[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Ratings & Feedback</h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Course Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseRatings?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Course Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating(courseRatings || [])}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Lesson Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lessonRatings?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Lesson Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating(lessonRatings || [])}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Course Ratings
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            Lesson Ratings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Course Ratings & Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCourseRatings ? (
                <div>Loading course ratings...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseRatings?.map((rating) => (
                      <TableRow key={rating.id}>
                        <TableCell className="font-medium">
                          {rating.courses?.title || 'Unknown Course'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {rating.profiles?.full_name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {rating.profiles?.email || 'No email'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {renderStars(rating.rating)}
                            <span className="text-sm font-medium">({rating.rating})</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {rating.comment ? (
                            <div className="truncate" title={rating.comment}>
                              {rating.comment}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No comment</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(rating.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Ratings & Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLessonRatings ? (
                <div>Loading lesson ratings...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Lesson</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessonRatings?.map((rating) => (
                      <TableRow key={rating.id}>
                        <TableCell className="font-medium">
                          {rating.lessons?.courses?.title || 'Unknown Course'}
                        </TableCell>
                        <TableCell>
                          {rating.lessons?.title || 'Unknown Lesson'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {rating.profiles?.full_name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {rating.profiles?.email || 'No email'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {renderStars(rating.rating)}
                            <span className="text-sm font-medium">({rating.rating})</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {rating.comment ? (
                            <div className="truncate" title={rating.comment}>
                              {rating.comment}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No comment</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(rating.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
