
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Search } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  points_spent: number;
  is_redeemed: boolean;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export const PromoCodeVerification = () => {
  const [searchCode, setSearchCode] = useState('');
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const searchPromoCode = async () => {
    if (!searchCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a promo code to search',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', searchCode.toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: 'Code Not Found',
            description: 'No promo code found with this code',
            variant: 'destructive',
          });
          setPromoCode(null);
        } else {
          throw error;
        }
      } else {
        setPromoCode(data);
      }
    } catch (error) {
      console.error('Error searching promo code:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for promo code',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const redeemPromoCode = async () => {
    if (!promoCode || !user) return;

    if (promoCode.is_redeemed) {
      toast({
        title: 'Error',
        description: 'This promo code has already been redeemed',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(promoCode.expires_at) < new Date()) {
      toast({
        title: 'Error',
        description: 'This promo code has expired',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({
          is_redeemed: true,
          redeemed_at: new Date().toISOString(),
          redeemed_by_admin: user.id,
        })
        .eq('id', promoCode.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Promo code redeemed! ${promoCode.discount_percentage}% discount applied.`,
      });

      // Refresh the promo code data
      setPromoCode({
        ...promoCode,
        is_redeemed: true,
      });
    } catch (error) {
      console.error('Error redeeming promo code:', error);
      toast({
        title: 'Error',
        description: 'Failed to redeem promo code',
        variant: 'destructive',
      });
    }
  };

  const isExpired = promoCode && new Date(promoCode.expires_at) < new Date();
  const canRedeem = promoCode && !promoCode.is_redeemed && !isExpired;

  return (
    <Card className="border-2 border-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-600">
          <Search className="w-5 h-5" />
          Promo Code Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="promo-code">Enter Promo Code</Label>
            <Input
              id="promo-code"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              maxLength={8}
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={searchPromoCode} 
              disabled={isSearching}
              className="px-6"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {promoCode && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Promo Code Details</h4>
                <div className="space-y-2">
                  <p><strong>Code:</strong> {promoCode.code}</p>
                  <p><strong>Discount:</strong> {promoCode.discount_percentage}%</p>
                  <p><strong>Points Spent:</strong> {promoCode.points_spent}</p>
                  <p><strong>Created:</strong> {new Date(promoCode.created_at).toLocaleDateString()}</p>
                  <p><strong>Expires:</strong> {new Date(promoCode.expires_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {promoCode.is_redeemed ? (
                      <>
                        <XCircle className="w-5 h-5 text-red-500" />
                        <Badge variant="destructive">Already Redeemed</Badge>
                      </>
                    ) : isExpired ? (
                      <>
                        <XCircle className="w-5 h-5 text-orange-500" />
                        <Badge variant="secondary">Expired</Badge>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <Badge variant="default">Valid</Badge>
                      </>
                    )}
                  </div>

                  {canRedeem && (
                    <Button 
                      onClick={redeemPromoCode}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    >
                      Confirm & Redeem Code
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
