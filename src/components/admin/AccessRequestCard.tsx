
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, User, BookOpen, MessageCircle } from 'lucide-react';

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

interface AccessRequestCardProps {
  request: AccessRequest;
  onStatusChange: (requestId: string, action: 'approved' | 'rejected') => void;
  onOpenMessages: (request: AccessRequest) => void;
}

export const AccessRequestCard: React.FC<AccessRequestCardProps> = ({
  request,
  onStatusChange,
  onOpenMessages
}) => {
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

  return (
    <Card className="border-2 border-black">
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
              onClick={() => onOpenMessages(request)}
              variant="outline"
              className="border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Messages
            </Button>

            {request.status === 'pending' && (
              <>
                <Button
                  onClick={() => onStatusChange(request.id, 'approved')}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => onStatusChange(request.id, 'rejected')}
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
  );
};
