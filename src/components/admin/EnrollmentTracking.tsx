
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, TrendingUp, Award } from 'lucide-react';

interface EnrollmentData {
  course_id: string;
  course_title: string;
  course_category: string;
  enrollment_count: number;
  completed_count: number;
  completion_rate: number;
}

export const EnrollmentTracking = () => {
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalCourses: 0,
    totalEnrollments: 0,
    averageCompletion: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEnrollmentData();
  }, []);

  const fetchEnrollmentData = async () => {
    try {
      // Fetch courses with enrollment statistics
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, category');

      if (coursesError) throw coursesError;

      // Fetch enrollment data
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('course_id, completed_at');

      if (enrollmentsError) throw enrollmentsError;

      // Process data
      const enrollmentStats = courses.map(course => {
        const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
        const completedEnrollments = courseEnrollments.filter(e => e.completed_at);
        const enrollmentCount = courseEnrollments.length;
        const completedCount = completedEnrollments.length;
        const completionRate = enrollmentCount > 0 ? (completedCount / enrollmentCount) * 100 : 0;

        return {
          course_id: course.id,
          course_title: course.title,
          course_category: course.category,
          enrollment_count: enrollmentCount,
          completed_count: completedCount,
          completion_rate: completionRate,
        };
      });

      // Calculate total stats
      const totalCourses = courses.length;
      const totalEnrollments = enrollments.length;
      const totalCompleted = enrollments.filter(e => e.completed_at).length;
      const averageCompletion = totalEnrollments > 0 ? (totalCompleted / totalEnrollments) * 100 : 0;

      setEnrollmentData(enrollmentStats);
      setTotalStats({
        totalCourses,
        totalEnrollments,
        averageCompletion,
      });
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch enrollment data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-2xl font-bold text-black">Loading enrollment data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-black">Enrollment Tracking</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{totalStats.totalCourses}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{totalStats.totalEnrollments}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Completion</CardTitle>
            <Award className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {totalStats.averageCompletion.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course-wise Enrollment Data */}
      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle className="text-black">Course Enrollment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left p-4 font-bold text-black">Course</th>
                  <th className="text-left p-4 font-bold text-black">Category</th>
                  <th className="text-left p-4 font-bold text-black">Enrollments</th>
                  <th className="text-left p-4 font-bold text-black">Completed</th>
                  <th className="text-left p-4 font-bold text-black">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {enrollmentData.map((course) => (
                  <tr key={course.course_id} className="border-b border-gray-300">
                    <td className="p-4 text-black font-medium">{course.course_title}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="border-black text-black">
                        {course.course_category}
                      </Badge>
                    </td>
                    <td className="p-4 text-black">{course.enrollment_count}</td>
                    <td className="p-4 text-black">{course.completed_count}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-black h-2 rounded-full"
                            style={{ width: `${Math.min(course.completion_rate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-black font-medium">
                          {course.completion_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {enrollmentData.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No enrollment data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
