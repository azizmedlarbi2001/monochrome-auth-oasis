
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageNotifications } from './MessageNotifications';

interface MessageCenterProps {
  onNotificationClick: (requestId: string) => void;
}

export const MessageCenter: React.FC<MessageCenterProps> = ({
  onNotificationClick
}) => {
  return (
    <Card className="border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="text-blue-600">Message Center</CardTitle>
      </CardHeader>
      <CardContent>
        <MessageNotifications onNotificationClick={onNotificationClick} />
      </CardContent>
    </Card>
  );
};
