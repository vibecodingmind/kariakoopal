'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { toast } from 'sonner';

type PaymentProvider = 'pesapal' | 'stripe' | 'paypal';
type PaymentState = 'idle' | 'processing' | 'success' | 'failed';

interface PaymentResult {
  success: boolean;
  reference: string;
  provider: PaymentProvider;
  demoMode: boolean;
}

export function usePayments() {
  const { user, walletBalance, setWalletBalance, language } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const topUpPesapal = useCallback(async (phone: string, amount: number): Promise<PaymentResult> => {
    try {
      const res = await fetch('/api/payments/pesapal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          amount,
          accountRef: `KARIKO_${user?.id || 'demo'}`,
          email: user?.email,
          description: 'Wallet Top Up via Pesapal',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.demoMode) {
          // Wait for simulated processing
          await new Promise(resolve => setTimeout(resolve, 2500));
          setWalletBalance(walletBalance + amount);
        }
        addNotification({
          userId: user?.id || '',
          type: 'payment',
          title: l('Top Up Successful', 'Kupakia Imefanikiwa'),
          message: `TZS ${amount.toLocaleString()} ${l('added via Pesapal', 'imeongezwa kupitia Pesapal')}`,
          read: false,
        });
        return { success: true, reference: data.mockReceipt || data.orderTrackingId, provider: 'pesapal', demoMode: !!data.demoMode };
      }
      throw new Error(data.error || 'Pesapal payment failed');
    } catch (error) {
      toast.error(l('Pesapal payment failed', 'Malipo ya Pesapal yameshindwa'));
      return { success: false, reference: '', provider: 'pesapal', demoMode: false };
    }
  }, [user, walletBalance, setWalletBalance, addNotification, l]);

  const topUpStripe = useCallback(async (email: string, amount: number): Promise<PaymentResult> => {
    try {
      const res = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          email,
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.demoMode) {
          await new Promise(resolve => setTimeout(resolve, 2500));
          setWalletBalance(walletBalance + amount);
          // If production, redirect to Stripe Checkout
          if (data.url) {
            window.open(data.url, '_blank');
          }
        } else if (data.url) {
          window.open(data.url, '_blank');
        }
        addNotification({
          userId: user?.id || '',
          type: 'payment',
          title: l('Top Up Successful', 'Kupakia Imefanikiwa'),
          message: `TZS ${amount.toLocaleString()} ${l('added via Stripe', 'imeongezwa kupitia Stripe')}`,
          read: false,
        });
        return { success: true, reference: data.mockReceipt || data.sessionId, provider: 'stripe', demoMode: !!data.demoMode };
      }
      throw new Error(data.error || 'Stripe payment failed');
    } catch (error) {
      toast.error(l('Stripe payment failed', 'Malipo ya Stripe yameshindwa'));
      return { success: false, reference: '', provider: 'stripe', demoMode: false };
    }
  }, [user, walletBalance, setWalletBalance, addNotification, l]);

  const topUpPayPal = useCallback(async (email: string, amount: number): Promise<PaymentResult> => {
    try {
      const res = await fetch('/api/payments/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          email,
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.demoMode) {
          await new Promise(resolve => setTimeout(resolve, 2500));
          setWalletBalance(walletBalance + amount);
          if (data.approvalUrl) {
            window.open(data.approvalUrl, '_blank');
          }
        } else if (data.approvalUrl) {
          window.open(data.approvalUrl, '_blank');
        }
        addNotification({
          userId: user?.id || '',
          type: 'payment',
          title: l('Top Up Successful', 'Kupakia Imefanikiwa'),
          message: `TZS ${amount.toLocaleString()} ${l('added via PayPal', 'imeongezwa kupitia PayPal')}`,
          read: false,
        });
        return { success: true, reference: data.mockReceipt || data.orderId, provider: 'paypal', demoMode: !!data.demoMode };
      }
      throw new Error(data.error || 'PayPal payment failed');
    } catch (error) {
      toast.error(l('PayPal payment failed', 'Malipo ya PayPal yameshindwa'));
      return { success: false, reference: '', provider: 'paypal', demoMode: false };
    }
  }, [user, walletBalance, setWalletBalance, addNotification, l]);

  const withdraw = useCallback(async (amount: number, phone: string, provider: string): Promise<PaymentResult> => {
    try {
      // Simulate withdrawal via Pesapal (mobile money)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setWalletBalance(walletBalance - amount);
      addNotification({
        userId: user?.id || '',
        type: 'payment',
        title: l('Withdrawal Initiated', 'Utoaji Umeanza'),
        message: `TZS ${amount.toLocaleString()} ${l('being sent to', 'inatumwa kwa')} ${phone}`,
        read: false,
      });
      return { success: true, reference: `WD_${Date.now()}`, provider: 'pesapal', demoMode: true };
    } catch {
      toast.error(l('Withdrawal failed', 'Utoaji umeshindwa'));
      return { success: false, reference: '', provider: 'pesapal', demoMode: false };
    }
  }, [user, walletBalance, setWalletBalance, addNotification, l]);

  const checkStatus = useCallback(async (provider: PaymentProvider, referenceId: string) => {
    try {
      const routes: Record<PaymentProvider, string> = {
        pesapal: `/api/payments/pesapal/status?orderTrackingId=${encodeURIComponent(referenceId)}`,
        stripe: `/api/payments/stripe?sessionId=${encodeURIComponent(referenceId)}`,
        paypal: `/api/payments/paypal?orderId=${encodeURIComponent(referenceId)}`,
      };
      const res = await fetch(routes[provider]);
      return await res.json();
    } catch {
      return { status: 'UNKNOWN' };
    }
  }, []);

  return { topUpPesapal, topUpStripe, topUpPayPal, withdraw, checkStatus };
}
