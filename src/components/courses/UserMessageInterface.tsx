
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, Paperclip, Download, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  course_access_request_id: string;
  sender_id: string;
  message_text: string | null;
  attachments: string[] | null;
  sent_at: string;
  is_admin_sender: boolean;
}

interface UserMessageInterfaceProps {
  requestId: string;
  courseName: string;
}

export const UserMessageInterface: React.FC<UserMessageInterfaceProps> = ({
  requestId,
  courseName
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('course_messages')
        .select('*')
        .eq('course_access_request_id', requestId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch messages.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAttachment = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!user) return;

    setIsSending(true);
    try {
      let attachmentUrls: string[] = [];
      
      if (attachments.length > 0) {
        attachmentUrls = await Promise.all(
          attachments.map(file => uploadAttachment(file))
        );
      }

      const { error } = await supabase
        .from('course_messages')
        .insert([
          {
            course_access_request_id: requestId,
            sender_id: user.id,
            message_text: newMessage.trim() || null,
            attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
            is_admin_sender: false
          }
        ]);

      if (error) throw error;

      setNewMessage('');
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: 'Success',
        description: 'Message sent successfully.',
      });

      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading messages...</div>
      </div>
    );
  }

  return (
    <Card className="border-2 border-black">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Messages about "{courseName}"
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 overflow-y-auto mb-4 space-y-3 border border-gray-200 rounded p-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Send a message to the admin!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${!message.is_admin_sender ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    !message.is_admin_sender
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-black'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        !message.is_admin_sender
                          ? 'border-white text-white'
                          : 'border-black text-black'
                      }`}
                    >
                      {message.is_admin_sender ? 'Admin' : 'You'}
                    </Badge>
                    <span className={`text-xs ${
                      !message.is_admin_sender ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {new Date(message.sent_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {message.message_text && (
                    <p className="mb-2">{message.message_text}</p>
                  )}
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-2">
                      {message.attachments.map((url, index) => (
                        <div key={index} className="border rounded p-2">
                          {isImage(url) ? (
                            <img
                              src={url}
                              alt="Attachment"
                              className="max-w-full h-auto rounded cursor-pointer"
                              onClick={() => window.open(url, '_blank')}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4" />
                              <span className="text-sm truncate flex-1">
                                {url.split('/').pop()}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(url, '_blank')}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            <div className="text-sm font-medium">Attachments:</div>
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                <Paperclip className="w-4 h-4" />
                <span className="text-sm flex-1">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAttachment(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border-black"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="icon"
            className="border-black"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            onClick={sendMessage}
            disabled={isSending || (!newMessage.trim() && attachments.length === 0)}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
