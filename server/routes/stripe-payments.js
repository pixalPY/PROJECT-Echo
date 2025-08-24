const express = require('express');
const router = express.Router();

// Initialize Stripe with secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY not found in environment variables. Stripe payments will not work.');
}
const stripe = require('stripe')(stripeSecretKey || 'sk_test_placeholder');

// Create a Stripe Checkout session for donations
router.post('/create-checkout-session', async (req, res) => {
  try {
    // Check if Stripe is properly configured
    if (!stripeSecretKey || stripeSecretKey === 'sk_test_placeholder') {
      return res.status(500).json({ 
        error: 'Payment system not configured. Please contact the administrator.' 
      });
    }

    const { amount, userEmail, userName } = req.body;

    // Validate the amount (minimum $1, maximum $999)
    if (!amount || amount < 1 || amount > 999) {
      return res.status(400).json({ 
        error: 'Invalid donation amount. Must be between $1 and $999.' 
      });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PROJECT:Echo Donation',
              description: `Support PROJECT:Echo development - Thank you ${userName || 'Anonymous'}!`,
              images: ['https://via.placeholder.com/300x300/7777FF/FFFFFF?text=PROJECT:Echo'],
            },
            unit_amount: amount * 100, // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:3000'}?donation=success&amount=${amount}`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}?donation=cancelled`,
      customer_email: userEmail,
      metadata: {
        type: 'donation',
        project: 'PROJECT:Echo',
        userName: userName || 'Anonymous',
        userEmail: userEmail || 'anonymous@example.com'
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Webhook endpoint to handle successful payments (optional)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // You'll need to set this

  try {
    if (webhookSecret) {
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          console.log('✅ Donation successful:', {
            amount: session.amount_total / 100,
            customer_email: session.customer_email,
            metadata: session.metadata
          });
          // Here you could save donation records to your database
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Get donation statistics (optional)
router.get('/stats', async (req, res) => {
  try {
    // This is a simple example - in production you'd want proper authentication
    res.json({
      message: 'Donation stats would be here',
      note: 'This endpoint needs proper implementation based on your needs'
    });
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({ error: 'Failed to fetch donation stats' });
  }
});

module.exports = router;
