
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, User, BookOpen, MessageCircle } from 'lucide-react';
import { AccessRequestMessages } from './AccessRequestMessages';

interface AccessRequest {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  requested_at: string;
  message: string;
  course: {
    title: string;
    category: string;
  } | null;
  user_profile: {
    email: string;
    full_name: string;
  } | null;
}

export const AccessRequestManagement = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequestForMessages, setSelectedRequestForMessages] = useState<AccessRequest | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // First, get the access requests with course data
      const { data: requestsData, error: requestsError } = await supabase
        .from('course_access_requests')
        .select(`
          *,
          course:courses(title, category)
        `)
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Then, get the user profiles separately
      const userIds = requestsData?.map(req => req.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const transformedData = (requestsData || []).map(item => {
        const userProfile = profilesData?.find(profile => profile.id === item.user_id);
        return {
          ...item,
          course: item.course || null,
          user_profile: userProfile ? {
            email: userProfile.email,
            full_name: userProfile.full_name
          } : null
        };
      });
      
      setRequests(transformedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch access requests.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('course_access_requests')
        .update({
          status: action,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, create enrollment
      if (action === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          const { error: enrollmentError } = await supabase
            .from('enrollments')
            .insert([
              {
                user_id: request.user_id,
                course_id: request.course_id,
                access_request_id: requestId
              }
            ]);

          if (enrollmentError) throw enrollmentError;
        }
      }

      toast({
        title: 'Success',
        description: `Request ${action} successfully.`,
      });

      fetchRequests();
    } catch (error) {
      console.error('Error handling request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process request.',
        variant: 'destructive',
      });
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
        <div className="text-2xl font-bold text-black">Loading requests...</div>
      </div>
    );
  }

  // Show messaging interface if a request is selected
  if (selectedRequestForMessages) {
    return (
      <div className="space-y-6">
        <AccessRequestMessages
          requestId={selectedRequestForMessages.id}
          userEmail={selectedRequestForMessages.user_profile?.email || 'Unknown User'}
          onClose={() => setSelectedRequestForMessages(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-black">Course Access Requests</h2>
      
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No access requests found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-2 border-black">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-black flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {request.user_profile?.email || 'Unknown User'}
                    </CardTitle>
                    <p className="text-gray-600">
                      {request.user_profile?.full_name && `${request.user_profile.full_name} • `}
                      Requested {new Date(request.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-black">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-medium">{request.course?.title || 'Unknown Course'}</span>
                    {request.course?.category && (
                      <Badge variant="outline" className="text-black border-black">
                        {request.course.category}
                      </Badge>
                    )}
                  </div>
                  
                  {request.message && (
                    <div className="bg-gray-50 p-3 rounded border">
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
                      Messages
                    </Button>

                    {request.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleRequest(request.id, 'approved')}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRequest(request.id, 'rejected')}
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
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
