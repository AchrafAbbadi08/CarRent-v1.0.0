//import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
//import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno'

// NE PAS UTILISER: import Stripe from 'stripe' 
// UTILISE CETTE VERSION POUR DENO:
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(), // Important pour Deno
});

/*const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})*/

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { amount, currency, reservationId } = await req.json()

    const { data, error } = await supabase.functions.invoke('create-payment-intent',{
      amount: amount * 100,
      currency: currency || 'usd',
      metadata: { reservationId },
    })

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})