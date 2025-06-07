
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Settings, Gift } from 'lucide-react';

interface Course {
  id: string;
  title: string;
}

interface PointsSetting {
  id: string;
  course_id: string;
  points_awarded: number;
  courses: { title: string };
}

interface ConversionRule {
  id: string;
  points_required: number;
  discount_percentage: number;
  description: string;
  is_active: boolean;
}

export const PointsManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pointsSettings, setPointsSettings] = useState<PointsSetting[]>([]);
  const [conversionRules, setConversionRules] = useState<ConversionRule[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [pointsValue, setPointsValue] = useState('');
  const [newRule, setNewRule] = useState({
    points_required: '',
    discount_percentage: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .order('title');

      if (coursesError) throw coursesError;

      // Fetch points settings
      const { data: pointsData, error: pointsError } = await supabase
        .from('points_settings')
        .select(`
          id,
          course_id,
          points_awarded,
          courses(title)
        `);

      if (pointsError) throw pointsError;

      // Fetch conversion rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('conversion_rules')
        .select('*')
        .order('points_required');

      if (rulesError) throw rulesError;

      setCourses(coursesData || []);
      setPointsSettings(pointsData || []);
      setConversionRules(rulesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load points data',
        variant: 'destructive',
      });
    }
  };

  const handleSetCoursePoints = async () => {
    if (!selectedCourse || !pointsValue) {
      toast({
        title: 'Error',
        description: 'Please select a course and enter points value',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('points_settings')
        .upsert({
          course_id: selectedCourse,
          points_awarded: parseInt(pointsValue),
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Course points updated successfully',
      });

      setSelectedCourse('');
      setPointsValue('');
      fetchData();
    } catch (error) {
      console.error('Error setting course points:', error);
      toast({
        title: 'Error',
        description: 'Failed to update course points',
        variant: 'destructive',
      });
    }
  };

  const handleAddConversionRule = async () => {
    if (!newRule.points_required || !newRule.discount_percentage) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('conversion_rules')
        .insert({
          points_required: parseInt(newRule.points_required),
          discount_percentage: parseInt(newRule.discount_percentage),
          description: newRule.description || `${newRule.discount_percentage}% discount for ${newRule.points_required} points`,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Conversion rule added successfully',
      });

      setNewRule({ points_required: '', discount_percentage: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding conversion rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to add conversion rule',
        variant: 'destructive',
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('conversion_rules')
        .update({ is_active: !currentStatus })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Rule ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling rule status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rule status',
        variant: 'destructive',
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('conversion_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Rule deleted successfully',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete rule',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Points Settings */}
      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Settings className="w-5 h-5" />
            Course Points Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="course-select">Select Course</Label>
              <select
                id="course-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="points-value">Points to Award</Label>
              <Input
                id="points-value"
                type="number"
                value={pointsValue}
                onChange={(e) => setPointsValue(e.target.value)}
                placeholder="e.g., 100"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSetCoursePoints} className="w-full">
                Set Points
              </Button>
            </div>
          </div>

          {/* Current Points Settings */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Current Course Points</h4>
            <div className="space-y-2">
              {pointsSettings.map((setting) => (
                <div key={setting.id} className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">{setting.courses.title}</span>
                  <Badge variant="outline">{setting.points_awarded} points</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rules */}
      <Card className="border-2 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Gift className="w-5 h-5" />
            Points Conversion Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="points-required">Points Required</Label>
              <Input
                id="points-required"
                type="number"
                value={newRule.points_required}
                onChange={(e) => setNewRule({ ...newRule, points_required: e.target.value })}
                placeholder="e.g., 250"
              />
            </div>
            <div>
              <Label htmlFor="discount-percentage">Discount %</Label>
              <Input
                id="discount-percentage"
                type="number"
                value={newRule.discount_percentage}
                onChange={(e) => setNewRule({ ...newRule, discount_percentage: e.target.value })}
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="Custom description"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddConversionRule} className="w-full">
                Add Rule
              </Button>
            </div>
          </div>

          {/* Current Rules */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Current Conversion Rules</h4>
            <div className="space-y-2">
              {conversionRules.map((rule) => (
                <div key={rule.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <span className="font-medium">
                      {rule.points_required} points → {rule.discount_percentage}% discount
                    </span>
                    {rule.description && (
                      <p className="text-sm text-gray-600">{rule.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                    >
                      {rule.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
