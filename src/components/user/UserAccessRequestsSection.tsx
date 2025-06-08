
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Calendar, FileText } from 'lucide-react';
import { UserMessageInterface } from '../courses/UserMessageInterface';
import { useToast } from '@/hooks/use-toast';

interface AccessRequest {
  id: string;
  course_id: string;
  status: string;
  message: string;
  requested_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  courses: {
    title: string;
  };
}

export const UserAccessRequestsSection = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAccessRequests();
    }
  }, [user]);

  const fetchAccessRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_access_requests')
        .select(`
          id,
          course_id,
          status,
          message,
          requested_at,
          reviewed_at,
          admin_notes,
          courses(title)
        `)
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching access requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your access requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading your requests...</div>
      </div>
    );
  }

  if (selectedRequest) {
    const request = requests.find(r => r.id === selectedRequest);
    if (!request) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setSelectedRequest(null)}
            variant="outline"
            className="border-black"
          >
            ← Back to Requests
          </Button>
          <h3 className="text-xl font-bold">
            Messages for "{request.courses.title}"
          </h3>
        </div>
        
        <UserMessageInterface
          requestId={selectedRequest}
          courseName={request.courses.title}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-black mb-2">Your Course Access Requests</h3>
        <p className="text-gray-600">Track your course access requests and communicate with admins</p>
      </div>

      {requests.length === 0 ? (
        <Card className="border-2 border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Access Requests</h3>
              <p className="text-gray-500">You haven't requested access to any courses yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-2 border-black">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{request.courses.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`text-white ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Requested {new Date(request.requested_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedRequest(request.id)}
                    variant="outline"
                    size="sm"
                    className="border-black"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Messages
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {request.message && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Your Request Message:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{request.message}</p>
                  </div>
                )}
                
                {request.admin_notes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Admin Response:</h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                      {request.admin_notes}
                    </p>
                  </div>
                )}

                {request.reviewed_at && (
                  <p className="text-xs text-gray-500">
                    Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
