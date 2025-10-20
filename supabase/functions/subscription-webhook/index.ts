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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    const mercadoPagoWebhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET');
    
    const body = await req.json();
    console.log('Webhook received:', body);

    // Verify Mercado Pago signature for security
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    
    if (!xSignature || !xRequestId || !mercadoPagoWebhookSecret) {
      console.error('Missing signature or webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid signature' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Verify the signature using HMAC SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(mercadoPagoWebhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(xRequestId)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (xSignature !== expectedSignature) {
      console.error('Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Signature verification failed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Mercado Pago sends notifications with payment updates
    if (body.type === 'payment') {
      const paymentId = body.data.id;

      // Get payment details from Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
        },
      });

      const payment = await paymentResponse.json();
      console.log('Payment details:', payment);

      const userId = payment.external_reference;
      const status = payment.status; // approved, pending, rejected, etc.

      // Update user subscription status
      if (status === 'approved') {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

        await supabase
          .from('profiles')
          .update({
            plan_type: 'premium',
            subscription_status: 'authorized',
            subscription_expires_at: expiresAt.toISOString()
          })
          .eq('user_id', userId);

        console.log('User upgraded to premium:', userId);
      } else if (status === 'rejected' || status === 'cancelled') {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled'
          })
          .eq('user_id', userId);

        console.log('Subscription cancelled for user:', userId);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in subscription-webhook:', error);
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
