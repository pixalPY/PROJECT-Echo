const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const { amount, userEmail, userName } = JSON.parse(event.body);

    // Validate the amount (minimum $1, maximum $999)
    if (!amount || amount < 1 || amount > 999) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid donation amount. Must be between $1 and $999.' 
        }),
      };
    }

    // Get the origin from headers
    const origin = event.headers.origin || event.headers.referer || 'https://projectecho0.netlify.app';

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
      success_url: `${origin}?donation=success&amount=${amount}`,
      cancel_url: `${origin}?donation=cancelled`,
      customer_email: userEmail,
      metadata: {
        type: 'donation',
        project: 'PROJECT:Echo',
        userName: userName || 'Anonymous',
        userEmail: userEmail || 'anonymous@example.com'
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
    };

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create checkout session',
        details: error.message 
      }),
    };
  }
};
