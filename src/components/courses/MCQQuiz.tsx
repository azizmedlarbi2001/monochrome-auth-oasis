import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface MCQQuestion {
    id: string;
    lesson_id: string;
    question: string;
    options: string[];
    correct_answer: number;
}

interface MCQQuizProps {
    lessonId: string;
    onQuizComplete: (passed: boolean, score: number, total: number) => void;
    onClose: () => void;
}

export const MCQQuiz = ({ lessonId, onQuizComplete, onClose }: MCQQuizProps) => {
    const [questions, setQuestions] = useState<MCQQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchQuestions();
    }, [lessonId]);

    const fetchQuestions = async () => {
        try {
            const { data, error } = await supabase
                .from('mcq_questions')
                .select('*')
                .eq('lesson_id', lessonId);

            if (error) throw error;

            const transformedData = (data || []).map(item => ({
                ...item,
                options: Array.isArray(item.options)
                    ? item.options.filter((opt): opt is string => typeof opt === 'string')
                    : []
            }));

            setQuestions(transformedData);
            setSelectedAnswers(new Array(transformedData.length).fill(-1));
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast({
                title: 'Error',
                description: 'Failed to load quiz questions.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = (answer: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setSelectedAnswers(newAnswers);
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach((question, index) => {
            if (selectedAnswers[index] === question.correct_answer) {
                correct++;
            }
        });
        return correct;
    };

    const handleSubmit = () => {
        const score = calculateScore();
        const total = questions.length;
        const passed = score >= Math.ceil(total * 0.7); // 70% passing grade

        setIsSubmitted(true);
        onQuizComplete(passed, score, total);
    };

    if (isLoading) {
        return (
            <Card className="border-2 border-black">
                <CardContent className="p-6">
                    <div className="text-center">Loading quiz questions...</div>
                </CardContent>
            </Card>
        );
    }

    if (questions.length === 0) {
        return (
            <Card className="border-2 border-black">
                <CardContent className="p-6">
                    <div className="text-center">
                        <p className="text-gray-600">No quiz questions available for this lesson.</p>
                        <Button onClick={onClose} className="mt-4">
                            Close
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <Card className="border-2 border-black">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-black">Lesson Quiz</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                    {/* Progress indicator */}
                    <div className="flex justify-between items-center mb-4">
                        <Badge variant="outline" className="text-black border-black">
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </Badge>
                        {!isSubmitted && (
                            <Badge 
                                variant="outline" 
                                className="bg-yellow-50 text-yellow-800 border-yellow-500"
                            >
                                70% Required to Pass
                            </Badge>
                        )}
                    </div>

                    {/* Question */}
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <h3 className="text-lg font-medium text-black">
                            {currentQuestion.question}
                        </h3>

                        <RadioGroup
                            value={selectedAnswers[currentQuestionIndex].toString()}
                            onValueChange={(value) => handleAnswer(parseInt(value))}
                            className="space-y-3"
                            disabled={isSubmitted}
                        >
                            {currentQuestion.options.map((option, index) => {
                                const isSelected = selectedAnswers[currentQuestionIndex] === index;
                                const isCorrect = isSubmitted && index === currentQuestion.correct_answer;
                                const isWrong = isSubmitted && isSelected && !isCorrect;

                                return (
                                    <div
                                        key={index}
                                        className={`relative flex items-center rounded-lg border p-4 transition-colors ${
                                            isSubmitted
                                                ? isCorrect
                                                    ? 'border-green-500 bg-green-50'
                                                    : isWrong
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-gray-200'
                                                : isSelected
                                                ? 'border-black'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <RadioGroupItem
                                            value={index.toString()}
                                            id={`option-${index}`}
                                            className="border-black"
                                        />
                                        <Label
                                            htmlFor={`option-${index}`}
                                            className="flex-grow ml-3 font-medium"
                                        >
                                            {option}
                                        </Label>
                                        {isSubmitted && (isCorrect || isWrong) && (
                                            <div className="absolute right-4">
                                                {isCorrect ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </motion.div>

                    {/* Navigation buttons */}
                    <div className="flex justify-between pt-4 border-t">
                        <Button
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                            disabled={currentQuestionIndex === 0 || isSubmitted}
                            variant="outline"
                            className="border-black text-black"
                        >
                            Previous
                        </Button>
                        {currentQuestionIndex < questions.length - 1 ? (
                            <Button
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                disabled={
                                    selectedAnswers[currentQuestionIndex] === -1 || isSubmitted
                                }
                                className="bg-black text-white"
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={
                                    selectedAnswers.some(ans => ans === -1) || isSubmitted
                                }
                                className="bg-black text-white"
                            >
                                Submit Quiz
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
