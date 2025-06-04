
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LessonAICompanionProps {
    lessonText: string;
}

export const LessonAICompanion: React.FC<LessonAICompanionProps> = ({ lessonText }) => {
    return (
        <AnimatePresence>
            {/* Floating Bubble */}
            <motion.div 
                className="fixed bottom-6 right-6 z-50"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileHover={{ scale: 1.1 }}
            >
                <div className="relative">
                    <Button
                        disabled
                        className="h-14 w-14 rounded-full bg-gray-400 text-white shadow-lg cursor-not-allowed"
                        size="icon"
                    >
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                    
                    {/* Coming Soon Tooltip */}
                    <div className="absolute bottom-16 right-0 bg-black text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            <span>AI Learning Companion</span>
                        </div>
                        <div className="text-xs text-gray-300 mt-1">Coming Soon</div>
                        {/* Arrow pointing down */}
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black"></div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
