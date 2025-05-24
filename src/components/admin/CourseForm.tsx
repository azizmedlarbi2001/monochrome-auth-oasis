
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  tutor: string;
  deliverables: string[];
}

interface CourseFormProps {
  course?: Course | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CourseForm = ({ course, onSuccess, onCancel }: CourseFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tutor: '',
  });
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [newDeliverable, setNewDeliverable] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description,
        category: course.category,
        tutor: course.tutor,
      });
      setDeliverables(course.deliverables || []);
    }
  }, [course]);

  const addDeliverable = () => {
    if (newDeliverable.trim()) {
      setDeliverables([...deliverables, newDeliverable.trim()]);
      setNewDeliverable('');
    }
  };

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const courseData = {
        ...formData,
        deliverables,
      };

      if (course) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', course.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Course updated successfully.',
        });
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([courseData]);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Course created successfully.',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: 'Error',
        description: 'Failed to save course.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-black">
      <CardHeader>
        <CardTitle className="text-black">
          {course ? 'Edit Course' : 'Create New Course'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Course Title
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-black"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Category
              </label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Tutor
              </label>
              <Input
                value={formData.tutor}
                onChange={(e) => setFormData({ ...formData, tutor: e.target.value })}
                className="border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Deliverables
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                placeholder="Add a deliverable..."
                className="border-black"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
              />
              <Button
                type="button"
                onClick={addDeliverable}
                variant="outline"
                className="border-black text-black hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {deliverables.map((deliverable, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                  <span className="text-black">{deliverable}</span>
                  <Button
                    type="button"
                    onClick={() => removeDeliverable(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="border-black text-black hover:bg-gray-100"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
