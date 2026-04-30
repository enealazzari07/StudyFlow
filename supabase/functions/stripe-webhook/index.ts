import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2025-12-15.clover',
  });

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const userId = session.subscription_data?.metadata?.supabase_user_id
          || session.metadata?.supabase_user_id;

        if (!userId) {
          // Fallback: look up by customer id
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', session.customer)
            .single();

          if (profile) {
            await supabase.from('profiles').update({
              plan: 'pro',
              stripe_subscription_id: session.subscription as string,
              pro_since: new Date().toISOString(),
            }).eq('id', profile.id);
          }
        } else {
          await supabase.from('profiles').update({
            plan: 'pro',
            stripe_subscription_id: session.subscription as string,
            pro_since: new Date().toISOString(),
          }).eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabase.from('profiles').update({
            plan: 'free',
            stripe_subscription_id: null,
          }).eq('id', userId);
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', subscription.customer)
            .single();

          if (profile) {
            await supabase.from('profiles').update({
              plan: 'free',
              stripe_subscription_id: null,
            }).eq('id', profile.id);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        const isActive = subscription.status === 'active';

        const updateFn = async (id: string) => {
          await supabase.from('profiles').update({
            plan: isActive ? 'pro' : 'free',
            stripe_subscription_id: isActive ? subscription.id : null,
          }).eq('id', id);
        };

        if (userId) {
          await updateFn(userId);
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', subscription.customer)
            .single();
          if (profile) await updateFn(profile.id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response(JSON.stringify({ error: 'Handler failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
