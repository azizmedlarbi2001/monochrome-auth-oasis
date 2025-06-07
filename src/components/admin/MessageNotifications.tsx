
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';

interface MessageNotification {
  requestId: string;
  unreadCount: number;
  userEmail: string;
  courseName: string;
  lastMessageAt: string;
}

interface MessageNotificationsProps {
  onNotificationClick: (requestId: string) => void;
}

export const MessageNotifications: React.FC<MessageNotificationsProps> = ({
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);

  useEffect(() => {
    fetchUnreadMessages();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'course_messages',
          filter: 'is_admin_sender=eq.false'
        },
        () => {
          fetchUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUnreadMessages = async () => {
    try {
      // Get all user messages (non-admin messages) with request details
      const { data: messages, error: messagesError } = await supabase
        .from('course_messages')
        .select(`
          id,
          course_access_request_id,
          sent_at,
          course_access_requests!inner(
            id,
            user_id,
            course_id,
            courses(title)
          )
        `)
        .eq('is_admin_sender', false)
        .order('sent_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Get user profiles separately
      const userIds = messages?.map(msg => msg.course_access_requests.user_id) || [];
      const uniqueUserIds = [...new Set(userIds)];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', uniqueUserIds);

      if (profilesError) throw profilesError;

      // Get admin responses to determine what's been "read"
      const { data: adminMessages, error: adminError } = await supabase
        .from('course_messages')
        .select('course_access_request_id, sent_at')
        .eq('is_admin_sender', true)
        .order('sent_at', { ascending: false });

      if (adminError) throw adminError;

      // Group by request and count unread messages
      const requestMap = new Map<string, MessageNotification>();

      messages?.forEach(message => {
        const requestId = message.course_access_request_id;
        const userId = message.course_access_requests.user_id;
        const userProfile = profiles?.find(p => p.id === userId);
        const userEmail = userProfile?.email || 'Unknown';
        const courseName = message.course_access_requests.courses?.title || 'Unknown Course';

        // Find latest admin response for this request
        const latestAdminResponse = adminMessages?.find(
          am => am.course_access_request_id === requestId
        );

        // If no admin response or user message is after admin response, it's unread
        const isUnread = !latestAdminResponse || 
          new Date(message.sent_at) > new Date(latestAdminResponse.sent_at);

        if (isUnread) {
          if (requestMap.has(requestId)) {
            const existing = requestMap.get(requestId)!;
            existing.unreadCount += 1;
            if (new Date(message.sent_at) > new Date(existing.lastMessageAt)) {
              existing.lastMessageAt = message.sent_at;
            }
          } else {
            requestMap.set(requestId, {
              requestId,
              unreadCount: 1,
              userEmail,
              courseName,
              lastMessageAt: message.sent_at
            });
          }
        }
      });

      setNotifications(Array.from(requestMap.values()));
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  const getTotalUnread = () => {
    return notifications.reduce((total, notif) => total + notif.unreadCount, 0);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        <h3 className="font-semibold">Unread Messages</h3>
        <Badge variant="destructive">{getTotalUnread()}</Badge>
      </div>

      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.requestId}
            onClick={() => onNotificationClick(notification.requestId)}
            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium text-sm">{notification.userEmail}</div>
                <div className="text-xs text-gray-600">{notification.courseName}</div>
                <div className="text-xs text-gray-500">
                  {new Date(notification.lastMessageAt).toLocaleString()}
                </div>
              </div>
              <Badge variant="destructive" className="text-xs">
                {notification.unreadCount}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
