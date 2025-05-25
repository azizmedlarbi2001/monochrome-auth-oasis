
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { MCQForm } from './MCQForm';
import { Badge } from '@/components/ui/badge';

interface Lesson {
  id: string;
  title: string;
  description: string;
}

interface MCQQuestion {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

interface MCQManagementProps {
  lesson: Lesson;
  onBack: () => void;
}

export const MCQManagement = ({ lesson, onBack }: MCQManagementProps) => {
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<MCQQuestion | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, [lesson.id]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('mcq_questions')
        .select('*')
        .eq('lesson_id', lesson.id);

      if (error) throw error;
      
      // Transform the data to ensure options is a string array
      const transformedData = (data || []).map(item => ({
        ...item,
        options: Array.isArray(item.options) ? item.options : []
      }));
      
      setQuestions(transformedData);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch questions.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('mcq_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Question deleted successfully.',
      });

      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingQuestion(null);
    fetchQuestions();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-2xl font-bold text-black">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-black text-black hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lessons
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-black">{lesson.title} - MCQ Questions</h2>
          <p className="text-gray-600">{lesson.description}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Badge variant="outline" className="text-black border-black">
          {questions.length} Questions
        </Badge>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {showForm && (
        <MCQForm
          lessonId={lesson.id}
          question={editingQuestion}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingQuestion(null);
          }}
        />
      )}

      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id} className="border-2 border-black">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-black">
                  {index + 1}. {question.question}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setEditingQuestion(question);
                      setShowForm(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-black text-black hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteQuestion(question.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`p-3 rounded border ${
                      optionIndex === question.correct_answer
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <span className="font-medium">
                      {String.fromCharCode(65 + optionIndex)}.
                    </span>{' '}
                    {option}
                    {optionIndex === question.correct_answer && (
                      <Badge className="ml-2 bg-green-500 text-white">Correct</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No questions found. Add your first question!</p>
        </div>
      )}
    </div>
  );
};
