
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface MCQQuestion {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

interface MCQFormProps {
  lessonId: string;
  question?: MCQQuestion | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MCQForm = ({ lessonId, question, onSuccess, onCancel }: MCQFormProps) => {
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (question) {
      setQuestionText(question.question);
      setOptions(question.options);
      setCorrectAnswer(question.correct_answer);
    }
  }, [question]);

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const mcqData = {
        lesson_id: lessonId,
        question: questionText,
        options,
        correct_answer: correctAnswer,
      };

      if (question) {
        const { error } = await supabase
          .from('mcq_questions')
          .update(mcqData)
          .eq('id', question.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Question updated successfully.',
        });
      } else {
        const { error } = await supabase
          .from('mcq_questions')
          .insert([mcqData]);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Question created successfully.',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: 'Error',
        description: 'Failed to save question.',
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
          {question ? 'Edit Question' : 'Create New Question'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Question
            </label>
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="border-black"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Options
            </label>
            <RadioGroup
              value={correctAnswer.toString()}
              onValueChange={(value) => setCorrectAnswer(parseInt(value))}
            >
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="font-medium">
                    {String.fromCharCode(65 + index)}.
                  </Label>
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="border-black"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    required
                  />
                </div>
              ))}
            </RadioGroup>
            <p className="text-sm text-gray-600 mt-2">
              Select the radio button next to the correct answer.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? 'Saving...' : question ? 'Update Question' : 'Create Question'}
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
