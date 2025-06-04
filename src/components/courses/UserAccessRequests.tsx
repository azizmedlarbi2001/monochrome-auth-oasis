
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, BookOpen, MessageCircle } from 'lucide-react';
import { UserMessageInterface } from './UserMessageInterface';

interface AccessRequest {
  id: string;
  course_id: string;
  status: string;
  requested_at: string;
  message: string;
  course: {
    title: string;
    category: string;
  } | null;
}

export const UserAccessRequests = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequestForMessages, setSelectedRequestForMessages] = useState<AccessRequest | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserRequests();
    }
  }, [user]);

  const fetchUserRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_access_requests')
        .select(`
          *,
          course:courses(title, category)
        `)
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching user requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your access requests.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-500"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-500"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-2xl font-bold text-black">Loading your requests...</div>
      </div>
    );
  }

  // Show messaging interface if a request is selected
  if (selectedRequestForMessages) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => setSelectedRequestForMessages(null)}
          variant="outline"
          className="border-black"
        >
          ← Back to Requests
        </Button>
        <UserMessageInterface
          requestId={selectedRequestForMessages.id}
          courseName={selectedRequestForMessages.course?.title || 'Unknown Course'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-black">My Course Access Requests</h2>
      
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">You haven't made any course access requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-2 border-black">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-black">
                    <BookOpen className="w-5 h-5" />
                    <CardTitle>{request.course?.title || 'Unknown Course'}</CardTitle>
                    {request.course?.category && (
                      <Badge variant="outline" className="text-black border-black">
                        {request.course.category}
                      </Badge>
                    )}
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-gray-600">
                  Requested on {new Date(request.requested_at).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.message && (
                    <div className="bg-gray-50 p-3 rounded border">
                      <p className="text-gray-700 text-sm font-medium mb-1">Your message:</p>
                      <p className="text-gray-700 text-sm">{request.message}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedRequestForMessages(request)}
                      variant="outline"
                      className="border-blue-500 text-blue-500 hover:bg-blue-50"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat with Admin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
