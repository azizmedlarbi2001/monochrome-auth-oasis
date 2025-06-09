
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface AccessRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  created_at: string;
  course_id: string;
  courses: {
    title: string;
  };
}

interface RequestMessage {
  id: string;
  message: string;
  is_from_user: boolean;
  created_at: string;
  sender_name?: string;
}

interface UserAccessRequestsProps {
  courseId: string;
}

export const UserAccessRequests: React.FC<UserAccessRequestsProps> = ({ courseId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [messages, setMessages] = useState<Record<string, RequestMessage[]>>({});
  const [newMessages, setNewMessages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && courseId) {
      fetchRequests();
    }
  }, [user, courseId]);

  const fetchRequests = async () => {
    if (!user || !courseId) return;

    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select(`
          *,
          courses(title)
        `)
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
      
      // Fetch messages for each request
      if (data && data.length > 0) {
        for (const request of data) {
          await fetchMessages(request.id);
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load access requests',
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('request_messages')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data.map(msg => ({
        ...msg,
        sender_name: msg.profiles?.full_name || (msg.is_from_user ? 'You' : 'Admin')
      }));

      setMessages(prev => ({
        ...prev,
        [requestId]: formattedMessages
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (requestId: string) => {
    const messageText = newMessages[requestId]?.trim();
    if (!messageText || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('request_messages')
        .insert({
          request_id: requestId,
          user_id: user.id,
          message: messageText,
          is_from_user: true,
        });

      if (error) throw error;

      setNewMessages(prev => ({
        ...prev,
        [requestId]: ''
      }));

      await fetchMessages(requestId);

      toast({
        title: 'Message Sent',
        description: 'Your message has been sent to the admin.',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAccessRequest = async () => {
    if (!user || !courseId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('access_requests')
        .insert({
          user_id: user.id,
          course_id: courseId,
          message: 'Requesting access to this course',
          status: 'pending'
        });

      if (error) throw error;

      await fetchRequests();

      toast({
        title: 'Request Submitted',
        description: 'Your access request has been submitted. You can now message the admin.',
      });
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: 'Failed to create access request',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Course Access & Messaging
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              You haven't requested access to this course yet.
            </p>
            <Button 
              onClick={createAccessRequest}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Request Access & Start Messaging
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Access Request
              </div>
              <Badge className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">
                Requested on: {new Date(request.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm font-medium">{request.message}</p>
            </div>

            {/* Messages */}
            <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
              <h4 className="font-medium mb-3">Messages</h4>
              {messages[request.id]?.length > 0 ? (
                <div className="space-y-2">
                  {messages[request.id].map((message) => (
                    <div
                      key={message.id}
                      className={`p-2 rounded ${
                        message.is_from_user
                          ? 'bg-blue-100 ml-8 text-right'
                          : 'bg-white mr-8'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {message.sender_name} • {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
              )}
            </div>

            {/* Message Input - Always available */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message to the admin..."
                value={newMessages[request.id] || ''}
                onChange={(e) =>
                  setNewMessages(prev => ({
                    ...prev,
                    [request.id]: e.target.value
                  }))
                }
                className="flex-1"
                rows={2}
              />
              <Button
                onClick={() => sendMessage(request.id)}
                disabled={isLoading || !newMessages[request.id]?.trim()}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
