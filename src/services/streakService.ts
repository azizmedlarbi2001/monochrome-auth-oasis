
import { supabase } from '@/integrations/supabase/client';

interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  last_points_awarded_date: string | null;
}

export class StreakService {
  static async updateUserActivity(userId: string, studiedLesson: boolean = false): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    try {
      // Get current streak data
      const { data: currentStreak, error: fetchError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!currentStreak) {
        // Create initial streak record
        await supabase
          .from('user_streaks')
          .insert({
            user_id: userId,
            current_streak: studiedLesson ? 1 : 0,
            longest_streak: studiedLesson ? 1 : 0,
            last_activity_date: today
          });
        return;
      }

      // Check if user already updated today
      if (currentStreak.last_activity_date === today) {
        return;
      }

      const lastActivityDate = new Date(currentStreak.last_activity_date || '1970-01-01');
      const todayDate = new Date(today);
      const daysDifference = Math.floor((todayDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

      let newStreakCount = currentStreak.current_streak;
      
      if (studiedLesson) {
        if (daysDifference === 1) {
          // Consecutive day - increment streak
          newStreakCount = currentStreak.current_streak + 1;
        } else if (daysDifference > 1) {
          // Streak broken - reset to 1
          newStreakCount = 1;
        }
      } else if (daysDifference > 1) {
        // No study today and gap > 1 day - reset streak
        newStreakCount = 0;
      }

      const newLongestStreak = Math.max(currentStreak.longest_streak, newStreakCount);

      // Update streak
      await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreakCount,
          longest_streak: newLongestStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  static async getUserStreak(userId: string): Promise<UserStreak | null> {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user streak:', error);
      return null;
    }
  }

  static getPointsForStreak(streakDays: number): number {
    switch (streakDays) {
      case 3: return 10;
      case 4: return 15;
      case 5: return 20;
      case 6: return 30;
      case 7: return 40;
      default: return 0;
    }
  }

  static getNextStreakReward(currentStreak: number): { days: number; points: number } | null {
    const streakRewards = [
      { days: 3, points: 10 },
      { days: 4, points: 15 },
      { days: 5, points: 20 },
      { days: 6, points: 30 },
      { days: 7, points: 40 }
    ];

    return streakRewards.find(reward => reward.days > currentStreak) || null;
  }
}
