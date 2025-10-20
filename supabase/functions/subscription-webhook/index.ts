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
    console.log('Webhook received:', JSON.stringify(body, null, 2));
    console.log('Headers:', {
      'x-signature': req.headers.get('x-signature'),
      'x-request-id': req.headers.get('x-request-id'),
    });

    // Verify Mercado Pago signature if secret is configured and headers are present
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    
    if (mercadoPagoWebhookSecret && xSignature && xRequestId) {
      console.log('Verifying webhook signature...');
      
      try {
        // Parse x-signature header: "ts=123456,v1=hash"
        const parts = xSignature.split(',');
        let ts = '';
        let hash = '';
        
        for (const part of parts) {
          const [key, value] = part.trim().split('=');
          if (key === 'ts') ts = value;
          if (key === 'v1') hash = value;
        }
        
        if (!ts || !hash) {
          console.error('Invalid signature format');
          return new Response(
            JSON.stringify({ error: 'Invalid signature format' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401,
            }
          );
        }

        // Create the manifest: id;request-id;ts
        const manifest = `id:${body.data?.id};request-id:${xRequestId};ts:${ts};`;
        console.log('Manifest:', manifest);
        
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
          encoder.encode(manifest)
        );
        
        const expectedSignature = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        console.log('Expected signature:', expectedSignature);
        console.log('Received signature:', hash);
        
        if (hash !== expectedSignature) {
          console.error('Signature verification failed');
          return new Response(
            JSON.stringify({ error: 'Signature verification failed' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401,
            }
          );
        }
        
        console.log('Signature verified successfully');
      } catch (error) {
        console.error('Error verifying signature:', error);
        return new Response(
          JSON.stringify({ error: 'Error verifying signature' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        );
      }
    } else {
      console.warn('Skipping signature verification - webhook secret or signature headers not present');
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
