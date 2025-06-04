
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AccessRequestMessages } from './AccessRequestMessages';
import { MessageCenter } from './MessageCenter';
import { AccessRequestCard } from './AccessRequestCard';

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

  const handleNotificationClick = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setSelectedRequestForMessages(request);
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
      
      {/* Message Center */}
      <MessageCenter onNotificationClick={handleNotificationClick} />
      
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No access requests found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <AccessRequestCard
              key={request.id}
              request={request}
              onStatusChange={handleRequest}
              onOpenMessages={setSelectedRequestForMessages}
            />
          ))}
        </div>
      )}
    </div>
  );
};
