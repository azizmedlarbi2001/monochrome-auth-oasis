
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StreakService } from '@/services/streakService';

export const useStreakTracking = () => {
  const { user } = useAuth();

  // Track daily login
  useEffect(() => {
    if (user) {
      StreakService.updateUserActivity(user.id, false);
    }
  }, [user]);

  // Function to call when user completes a lesson
  const trackLessonStudy = async () => {
    if (user) {
      await StreakService.updateUserActivity(user.id, true);
    }
  };

  return { trackLessonStudy };
};
