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

    // Determine if this is a test/simulation webhook
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const isTestMode = body.live_mode === false || !body.live_mode || body.id === '123456';
    
    // For production webhooks, signature verification is MANDATORY
    if (!isTestMode && (!mercadoPagoWebhookSecret || !xSignature || !xRequestId)) {
      console.error('Production webhook missing signature credentials');
      return new Response(
        JSON.stringify({ error: 'Webhook signature required for production' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }
    
    // Log test mode
    if (isTestMode) {
      console.log('Test mode webhook - skipping signature verification');
    }

    // Skip signature verification for test webhooks
    if (!isTestMode && mercadoPagoWebhookSecret && xSignature && xRequestId) {
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

      // Validate timestamp to prevent replay attacks (5 minute window)
      const timestamp = parseInt(ts);
      const now = Math.floor(Date.now() / 1000);
      if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
        console.error('Webhook timestamp validation failed - possible replay attack');
        return new Response(
          JSON.stringify({ error: 'Expired or invalid webhook timestamp' }),
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
        console.error('Signature verification failed - invalid HMAC signature');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        );
      }
      
        console.log('Webhook signature and timestamp verified successfully');
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
    } else if (!isTestMode) {
      console.log('Skipping signature verification - missing credentials');
    }

    // Handle payment notifications
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
      
      // Validate userId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!userId || !uuidRegex.test(userId)) {
        console.error('Invalid user ID format:', userId);
        return new Response(
          JSON.stringify({ error: 'Invalid external reference format' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Verify user exists before updating
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (profileError || !profile) {
        console.error('User not found:', userId);
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }

      const status = payment.status; // approved, pending, rejected, etc.
      console.log('Processing payment for user:', userId, 'with status:', status);

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
    
    // Handle subscription preapproval notifications
    if (body.type === 'subscription_preapproval' || body.entity === 'preapproval') {
      const preapprovalId = body.data.id;
      console.log('Processing subscription preapproval:', preapprovalId);

      // Get preapproval details from Mercado Pago
      const preapprovalResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
        },
      });

      if (!preapprovalResponse.ok) {
        console.error('Failed to fetch preapproval details:', preapprovalResponse.status);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch subscription details' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      const preapproval = await preapprovalResponse.json();
      console.log('Preapproval details:', preapproval);

      const userId = preapproval.external_reference;
      
      // Validate userId
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!userId || !uuidRegex.test(userId)) {
        console.error('Invalid user ID in preapproval:', userId);
        return new Response(
          JSON.stringify({ error: 'Invalid external reference format' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Verify user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (profileError || !profile) {
        console.error('User not found for preapproval:', userId);
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }

      const status = preapproval.status; // authorized, paused, cancelled, etc.
      console.log('Processing preapproval for user:', userId, 'with status:', status);

      // Update user subscription based on preapproval status
      if (status === 'authorized') {
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

        console.log('User upgraded to premium via subscription:', userId);
      } else if (status === 'cancelled' || status === 'paused') {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled'
          })
          .eq('user_id', userId);

        console.log('Subscription cancelled/paused for user:', userId);
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
