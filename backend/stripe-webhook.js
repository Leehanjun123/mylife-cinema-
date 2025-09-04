// Stripe webhook endpoint for backend
export function setupStripeWebhook(app, stripe, supabase) {
  app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    let event;

    try {
      // In production, verify webhook signature
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } else {
        // For testing without webhook secret
        event = JSON.parse(req.body.toString());
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Update user subscription in Supabase
        if (session.metadata?.userId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_tier: session.metadata.priceId === 'price_creator_monthly' ? 'creator' : 'pro',
              subscription_status: 'active',
              stripe_customer_id: session.customer,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.metadata.userId);

          if (error) {
            console.error('Failed to update subscription:', error);
          } else {
            console.log('Subscription updated for user:', session.metadata.userId);
          }
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  });
}