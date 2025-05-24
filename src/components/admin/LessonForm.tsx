
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  text_content: string;
  images: string[];
  order_index: number;
}

interface LessonFormProps {
  courseId: string;
  lesson?: Lesson | null;
  nextOrderIndex: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const LessonForm = ({ courseId, lesson, nextOrderIndex, onSuccess, onCancel }: LessonFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    text_content: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        description: lesson.description,
        video_url: lesson.video_url,
        text_content: lesson.text_content,
      });
      setImages(lesson.images || []);
    }
  }, [lesson]);

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const lessonData = {
        ...formData,
        course_id: courseId,
        images,
        order_index: lesson ? lesson.order_index : nextOrderIndex,
      };

      if (lesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', lesson.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Lesson updated successfully.',
        });
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([lessonData]);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Lesson created successfully.',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to save lesson.',
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
          {lesson ? 'Edit Lesson' : 'Create New Lesson'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Lesson Title
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
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Video URL
            </label>
            <Input
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              className="border-black"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Text Content
            </label>
            <Textarea
              value={formData.text_content}
              onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
              className="border-black"
              rows={6}
              placeholder="Enter the lesson content..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Image URLs
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Add an image URL..."
                className="border-black"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              />
              <Button
                type="button"
                onClick={addImage}
                variant="outline"
                className="border-black text-black hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {images.map((imageUrl, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                  <span className="text-black truncate">{imageUrl}</span>
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
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
              {isSubmitting ? 'Saving...' : lesson ? 'Update Lesson' : 'Create Lesson'}
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
