
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Play } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  text_content: string;
  order_index: number;
}

interface LessonPlayerProps {
  lesson: Lesson;
  isCompleted: boolean;
  onMarkComplete: () => void;
}

export const LessonPlayer = ({ lesson, isCompleted, onMarkComplete }: LessonPlayerProps) => {
  const [showVideo, setShowVideo] = useState(false);

  // Extract video ID from Google Drive URL
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Handle different Google Drive URL formats
    let videoId = '';
    
    if (url.includes('/file/d/')) {
      videoId = url.split('/file/d/')[1].split('/')[0];
    } else if (url.includes('id=')) {
      videoId = url.split('id=')[1].split('&')[0];
    }
    
    if (videoId) {
      return `https://drive.google.com/file/d/${videoId}/preview`;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(lesson.video_url);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">{lesson.title}</h1>
              <p className="text-gray-600">{lesson.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
              {!isCompleted && (
                <Button
                  onClick={onMarkComplete}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Video Player */}
        {lesson.video_url && (
          <Card className="border-2 border-black mb-6">
            <CardHeader>
              <CardTitle className="text-black">Lesson Video</CardTitle>
            </CardHeader>
            <CardContent>
              {!showVideo ? (
                <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                  <Button
                    onClick={() => setShowVideo(true)}
                    className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-4"
                  >
                    <Play className="w-6 h-6 mr-2" />
                    Play Video
                  </Button>
                </div>
              ) : (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={lesson.title}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Text Content */}
        {lesson.text_content && (
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle className="text-black">Lesson Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {lesson.text_content}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!lesson.video_url && !lesson.text_content && (
          <div className="text-center py-12">
            <p className="text-gray-500">No content available for this lesson yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
