
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Gift, TrendingUp, Clock } from 'lucide-react';

interface UserPoints {
  total_points: number;
  available_points: number;
}

interface ConversionRule {
  id: string;
  points_required: number;
  discount_percentage: number;
  description: string;
}

interface Transaction {
  id: string;
  points_change: number;
  transaction_type: string;
  description: string;
  created_at: string;
  courses?: { title: string };
}

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  is_redeemed: boolean;
  expires_at: string;
  created_at: string;
}

export const PointsDashboard = () => {
  const [userPoints, setUserPoints] = useState<UserPoints>({ total_points: 0, available_points: 0 });
  const [conversionRules, setConversionRules] = useState<ConversionRule[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user points
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points, available_points')
        .eq('user_id', user.id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        throw pointsError;
      }

      // Fetch conversion rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('conversion_rules')
        .select('*')
        .eq('is_active', true)
        .order('points_required');

      if (rulesError) throw rulesError;

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('points_transactions')
        .select(`
          id,
          points_change,
          transaction_type,
          description,
          created_at,
          courses(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;

      // Fetch user's promo codes
      const { data: promoData, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (promoError) throw promoError;

      setUserPoints(pointsData || { total_points: 0, available_points: 0 });
      setConversionRules(rulesData || []);
      setTransactions(transactionsData || []);
      setPromoCodes(promoData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load points data',
        variant: 'destructive',
      });
    }
  };

  const redeemPoints = async (ruleId: string, pointsRequired: number, discountPercentage: number) => {
    if (!user || userPoints.available_points < pointsRequired) {
      toast({
        title: 'Insufficient Points',
        description: `You need ${pointsRequired} points to redeem this reward`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate promo code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_promo_code');

      if (codeError) throw codeError;

      // Create promo code record
      const { error: insertError } = await supabase
        .from('promo_codes')
        .insert({
          user_id: user.id,
          code: codeData,
          discount_percentage: discountPercentage,
          points_spent: pointsRequired,
        });

      if (insertError) throw insertError;

      // Update user points
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          available_points: userPoints.available_points - pointsRequired,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          points_change: -pointsRequired,
          transaction_type: 'spent',
          description: `Redeemed ${discountPercentage}% discount code`,
        });

      if (transactionError) throw transactionError;

      toast({
        title: 'Success!',
        description: `Your promo code is: ${codeData}. Share this with the admin to get your discount!`,
      });

      fetchUserData();
    } catch (error) {
      console.error('Error redeeming points:', error);
      toast({
        title: 'Error',
        description: 'Failed to redeem points',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Star className="w-5 h-5" />
              Total Points Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">
              {userPoints.total_points}
            </div>
            <p className="text-sm text-gray-600">Lifetime points earned</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Gift className="w-5 h-5" />
              Available Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {userPoints.available_points}
            </div>
            <p className="text-sm text-gray-600">Ready to redeem</p>
          </CardContent>
        </Card>
      </div>

      {/* Rewards */}
      <Card className="border-2 border-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-600">
            <Gift className="w-5 h-5" />
            Available Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversionRules.map((rule) => {
              const canRedeem = userPoints.available_points >= rule.points_required;
              return (
                <div key={rule.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{rule.discount_percentage}% Discount</h4>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                    <p className="text-sm font-medium">Cost: {rule.points_required} points</p>
                  </div>
                  <Button
                    onClick={() => redeemPoints(rule.id, rule.points_required, rule.discount_percentage)}
                    disabled={!canRedeem || isLoading}
                    variant={canRedeem ? "default" : "secondary"}
                  >
                    {canRedeem ? 'Redeem' : 'Need More Points'}
                  </Button>
                </div>
              );
            })}
            {conversionRules.length === 0 && (
              <p className="text-gray-500 text-center py-4">No rewards available at the moment</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <TrendingUp className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge 
                  variant={transaction.transaction_type === 'earned' ? "default" : "secondary"}
                >
                  {transaction.transaction_type === 'earned' ? '+' : ''}{transaction.points_change} pts
                </Badge>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promo Codes */}
      <Card className="border-2 border-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <Clock className="w-5 h-5" />
            Your Promo Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {promoCodes.map((promo) => (
              <div key={promo.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-mono font-bold text-lg">{promo.code}</p>
                  <p className="text-sm text-gray-600">
                    {promo.discount_percentage}% discount • Created {new Date(promo.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Expires: {new Date(promo.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={promo.is_redeemed ? "secondary" : "default"}>
                  {promo.is_redeemed ? 'Used' : 'Available'}
                </Badge>
              </div>
            ))}
            {promoCodes.length === 0 && (
              <p className="text-gray-500 text-center py-4">No promo codes yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
