
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Star, Trophy, Gift } from 'lucide-react';

interface PointsNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  pointsEarned: number;
  courseName: string;
}

export const PointsNotification: React.FC<PointsNotificationProps> = ({
  isOpen,
  onClose,
  pointsEarned,
  courseName
}) => {
  const navigate = useNavigate();

  const handleViewPoints = () => {
    onClose();
    navigate('/dashboard');
    // Small delay to ensure navigation completes, then trigger tab change
    setTimeout(() => {
      const pointsTab = document.querySelector('[data-tab="points"]') as HTMLButtonElement;
      if (pointsTab) {
        pointsTab.click();
      }
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Congratulations!
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Points Earned!</h3>
          
          <p className="text-gray-600 mb-4">
            You earned <span className="font-bold text-yellow-600">{pointsEarned} points</span> for your feedback on "{courseName}"
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Gift className="w-4 h-4" />
            <span>Check your rewards dashboard to redeem points</span>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>
              Continue Learning
            </Button>
            <Button onClick={handleViewPoints} className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              View Rewards
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
