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
    const isDevEnvironment = Deno.env.get('ENVIRONMENT') === 'development';
    
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));
    console.log('Headers:', {
      'x-signature': req.headers.get('x-signature'),
      'x-request-id': req.headers.get('x-request-id'),
    });

    // Only allow test mode in development environment
    // NEVER trust client-supplied values for security decisions
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const isTestMode = isDevEnvironment && body.id === '123456';
    
    // For production webhooks, signature verification is MANDATORY
    if (!isTestMode && !mercadoPagoWebhookSecret) {
      console.error('CRITICAL: MERCADO_PAGO_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    if (!isTestMode && (!xSignature || !xRequestId)) {
      console.error('Production webhook missing signature headers');
      return new Response(
        JSON.stringify({ error: 'Webhook signature required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }
    
    // Log test mode
    if (isTestMode) {
      console.log('Development test mode - skipping signature verification');
    }

    // Verify signature for all production webhooks
    if (!isTestMode && xSignature && xRequestId) {
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

        // Audit log
        await supabase.from('subscription_audit_log').insert({
          user_id: userId,
          event_type: 'payment_approved',
          payment_id: paymentId,
          external_reference: userId,
          status: status,
          metadata: { payment_details: payment },
          source: 'mercado_pago_webhook'
        });

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
        // Audit log
        await supabase.from('subscription_audit_log').insert({
          user_id: userId,
          event_type: 'payment_cancelled',
          payment_id: paymentId,
          external_reference: userId,
          status: status,
          metadata: { payment_details: payment },
          source: 'mercado_pago_webhook'
        });

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

      // For test webhooks with test ID, acknowledge without processing
      if (isTestMode) {
        console.log('Test webhook acknowledged - no real processing for test ID:', preapprovalId);
        return new Response(
          JSON.stringify({ success: true, message: 'Test webhook received' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      // Get preapproval details from Mercado Pago for production webhooks
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

        // Audit log
        await supabase.from('subscription_audit_log').insert({
          user_id: userId,
          event_type: 'subscription_authorized',
          payment_id: preapprovalId,
          external_reference: userId,
          status: status,
          metadata: { preapproval_details: preapproval },
          source: 'mercado_pago_webhook'
        });

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
        // Audit log
        await supabase.from('subscription_audit_log').insert({
          user_id: userId,
          event_type: 'subscription_cancelled',
          payment_id: preapprovalId,
          external_reference: userId,
          status: status,
          metadata: { preapproval_details: preapproval },
          source: 'mercado_pago_webhook'
        });

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
