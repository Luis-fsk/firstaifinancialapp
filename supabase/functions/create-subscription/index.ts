import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionRequest {
  userId: string;
  email: string;
  planAmount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, planAmount }: SubscriptionRequest = await req.json();
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');

    if (!mercadoPagoToken) {
      throw new Error('Mercado Pago token not configured');
    }

    console.log('Creating subscription for user:', userId);

    // Create subscription preference in Mercado Pago
    const preferenceResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: 'Plano Premium - Mensal',
            description: 'Acesso completo a todos os recursos da plataforma',
            quantity: 1,
            unit_price: planAmount,
            currency_id: 'BRL',
          }
        ],
        payer: {
          email: email,
        },
        back_urls: {
          success: `${Deno.env.get('SUPABASE_URL')}/functions/v1/subscription-webhook?status=success`,
          failure: `${Deno.env.get('SUPABASE_URL')}/functions/v1/subscription-webhook?status=failure`,
          pending: `${Deno.env.get('SUPABASE_URL')}/functions/v1/subscription-webhook?status=pending`,
        },
        auto_return: 'approved',
        external_reference: userId,
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/subscription-webhook`,
      }),
    });

    if (!preferenceResponse.ok) {
      const errorData = await preferenceResponse.text();
      console.error('Mercado Pago error:', errorData);
      throw new Error('Failed to create payment preference');
    }

    const preference = await preferenceResponse.json();
    console.log('Subscription preference created:', preference.id);

    // Store subscription info in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('profiles')
      .update({
        subscription_id: preference.id,
        subscription_status: 'pending'
      })
      .eq('user_id', userId);

    return new Response(
      JSON.stringify({
        init_point: preference.init_point,
        preference_id: preference.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-subscription:', error);
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
