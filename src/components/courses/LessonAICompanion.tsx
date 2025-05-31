import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Loader2, X, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const PREBUILT_QUESTIONS = [
    'Summarize this lesson for me.',
    'What are the key takeaways?',
    'Explain the main concept.',
    'Give me an example.',
    'Quiz me on this.',
];

interface Message {
    role: 'user' | 'ai';
    text: string;
    id: string;
}

interface LessonAICompanionProps {
    lessonText: string;
}

export const LessonAICompanion: React.FC<LessonAICompanionProps> = ({ lessonText }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkServerHealth();
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const checkServerHealth = async () => {
        try {
            const res = await fetch('http://localhost:3001/health');
            if (!res.ok) {
                toast({
                    title: 'Server Connection Issue',
                    description: 'Unable to connect to AI service. Please try again later.',
                    variant: 'destructive',
                });
            }
        } catch (err) {
            console.error('Server health check error:', err);
        }
    };

    const generateMessageId = () => Math.random().toString(36).substring(7);

    const sendMessage = async (userText: string) => {
        if (!lessonText?.trim()) {
            toast({
                title: 'Error',
                description: 'No lesson content available for AI analysis.',
                variant: 'destructive',
            });
            return;
        }

        const messageId = generateMessageId();
        setMessages(prev => [...prev, { role: 'user', text: userText, id: messageId }]);
        setLoading(true);
        setError(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const res = await fetch('http://localhost:3001/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `You are a helpful AI tutor. Analyze the following lesson content and respond to the user's question:

Lesson Content:
${lessonText}

User Question: ${userText}

Please provide a clear, accurate, and helpful response.`
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.details || 'Failed to get AI response');
            }

            const data = await res.json();
            if (!data.text) {
                throw new Error('No response text from AI');
            }

            setMessages(prev => [...prev, { role: 'ai', text: data.text, id: generateMessageId() }]);
            
        } catch (err: any) {
            console.error('AI Error:', err);
            const errorMessage = err.name === 'AbortError' 
                ? 'Request timed out. Please try again.' 
                : err.message || 'Failed to get AI response';
            
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        const userInput = input;
        setInput('');
        await sendMessage(userInput);
    };

    return (
        <>
            <AnimatePresence>
                {/* Floating Bubble */}
                <motion.div 
                    className="fixed bottom-6 right-6 z-50"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    whileHover={{ scale: 1.1 }}
                >
                    <Button
                        onClick={() => setIsOpen(true)}
                        className="h-14 w-14 rounded-full bg-black hover:bg-gray-800 text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                        size="icon"
                    >
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                </motion.div>
            </AnimatePresence>

            {/* AI Chat Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col bg-white">
                    <DialogHeader className="border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                <DialogTitle>AI Learning Companion</DialogTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 rounded-full hover:bg-gray-100"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* Quick Questions */}
                    <div className="flex gap-2 flex-wrap py-3 px-4 border-b">
                        {PREBUILT_QUESTIONS.map((question, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => sendMessage(question)}
                                disabled={loading}
                                className="text-xs bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                {question}
                            </Button>
                        ))}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <AnimatePresence mode="popLayout">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={cn(
                                        "flex w-max max-w-[80%] rounded-lg px-4 py-2 shadow-sm",
                                        message.role === 'user' 
                                            ? "ml-auto bg-black text-white" 
                                            : "bg-gray-50 text-black"
                                    )}
                                >
                                    {message.text}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2 text-gray-500 bg-gray-50 w-max px-4 py-2 rounded-lg"
                            >
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Thinking...
                            </motion.div>
                        )}
                        
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-500 text-sm p-3 bg-red-50 rounded-lg"
                            >
                                {error}
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="border-t p-4">
                        <div className="flex gap-2">
                            <Textarea
                                value={input}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                                placeholder="Ask me anything about the lesson..."
                                className="min-h-[60px] flex-1 resize-none focus:ring-black"
                                disabled={loading}
                            />
                            <Button 
                                type="submit" 
                                disabled={loading || !input.trim()}
                                className="bg-black hover:bg-gray-800 text-white transition-colors"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};
