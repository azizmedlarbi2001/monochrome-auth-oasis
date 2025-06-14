
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { StreakService } from '@/services/streakService';
import { Flame, Calendar, Trophy } from 'lucide-react';

export const StreakDisplay = () => {
  const [streak, setStreak] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStreak();
    }
  }, [user]);

  const fetchStreak = async () => {
    if (!user) return;
    
    try {
      const streakData = await StreakService.getUserStreak(user.id);
      setStreak(streakData);
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-orange-500">
        <CardContent className="p-6">
          <div className="animate-pulse">Loading streak...</div>
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const nextReward = StreakService.getNextStreakReward(currentStreak);

  return (
    <Card className="border-2 border-orange-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <Flame className="w-5 h-5" />
          Daily Study Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Current Streak</span>
            </div>
            <Badge variant={currentStreak > 0 ? "default" : "secondary"} className="text-lg">
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </Badge>
          </div>

          {/* Longest Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Longest Streak</span>
            </div>
            <Badge variant="outline" className="text-lg">
              {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
            </Badge>
          </div>

          {/* Next Reward */}
          {nextReward && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm font-medium text-orange-800 mb-1">
                Next Reward:
              </div>
              <div className="text-sm text-orange-700">
                Study for {nextReward.days - currentStreak} more consecutive days to earn {nextReward.points} points!
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Target: {nextReward.days} day streak = {nextReward.points} points
              </div>
            </div>
          )}

          {/* Streak Rules */}
          <div className="mt-4 text-xs text-gray-600">
            <div className="font-medium mb-1">Streak Rewards:</div>
            <div className="space-y-1">
              <div>3 days: 10 points</div>
              <div>4 days: 15 points</div>
              <div>5 days: 20 points</div>
              <div>6 days: 30 points</div>
              <div>7 days: 40 points</div>
            </div>
            <div className="mt-2 text-gray-500">
              * Must study at least one lesson per day to maintain streak
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
