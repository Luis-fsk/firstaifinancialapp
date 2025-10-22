import { useAuth } from './useAuth';
import { useMemo } from 'react';

interface SubscriptionStatus {
  isPremium: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  daysLeftInTrial: number;
  planType: string;
}

export function useSubscription(): SubscriptionStatus {
  const { profile } = useAuth();

  const status = useMemo(() => {
    if (!profile) {
      return {
        isPremium: false,
        isTrialActive: false,
        isTrialExpired: false,
        daysLeftInTrial: 0,
        planType: 'free_trial'
      };
    }

    const planType = profile.plan_type || 'free_trial';
    const isPremium = planType === 'premium';

    if (isPremium) {
      return {
        isPremium: true,
        isTrialActive: false,
        isTrialExpired: false,
        daysLeftInTrial: 0,
        planType
      };
    }

    // Check trial status
    const trialStart = profile.trial_start ? new Date(profile.trial_start) : new Date();
    const now = new Date();
    const daysElapsed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeftInTrial = Math.max(0, Math.floor(30 - daysElapsed));
    const isTrialExpired = daysElapsed >= 30;
    const isTrialActive = !isTrialExpired && daysLeftInTrial > 0;

    console.log('Trial Status:', {
      trialStart: trialStart.toISOString(),
      now: now.toISOString(),
      daysElapsed,
      daysLeftInTrial,
      isTrialExpired,
      isTrialActive
    });

    return {
      isPremium: false,
      isTrialActive,
      isTrialExpired,
      daysLeftInTrial,
      planType
    };
  }, [profile]);

  return status;
}
