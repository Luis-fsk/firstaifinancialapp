import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret token
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET_TOKEN");
    
    if (!expectedSecret) {
      console.error("CRON_SECRET_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (cronSecret !== expectedSecret) {
      console.error("Unauthorized cron job attempt");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking expired subscriptions...');

    // Find all expired premium subscriptions
    const now = new Date().toISOString();
    const { data: expiredUsers, error } = await supabase
      .from('profiles')
      .select('user_id, subscription_expires_at')
      .eq('plan_type', 'premium')
      .lt('subscription_expires_at', now);

    if (error) {
      console.error('Error fetching expired subscriptions:', error);
      throw error;
    }

    console.log(`Found ${expiredUsers?.length || 0} expired subscriptions`);

    // Downgrade expired users back to free_trial
    if (expiredUsers && expiredUsers.length > 0) {
      for (const user of expiredUsers) {
        await supabase
          .from('profiles')
          .update({
            plan_type: 'free_trial',
            subscription_status: 'cancelled'
          })
          .eq('user_id', user.user_id);

        console.log('Downgraded user:', user.user_id);
      }
    }

    // Find users with 5 days left in trial for notification
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

    const { data: soonToExpireUsers } = await supabase
      .from('profiles')
      .select('user_id, trial_start')
      .eq('plan_type', 'free_trial')
      .not('trial_start', 'is', null);

    if (soonToExpireUsers) {
      const usersToNotify = soonToExpireUsers.filter(user => {
        const trialStart = new Date(user.trial_start);
        const trialEnd = new Date(trialStart);
        trialEnd.setDate(trialEnd.getDate() + 30);
        
        const daysLeft = Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft === 5;
      });

      console.log(`Found ${usersToNotify.length} users with 5 days left in trial`);
      // TODO: Send email notifications to these users
    }

    return new Response(
      JSON.stringify({
        success: true,
        expiredCount: expiredUsers?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-subscriptions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
