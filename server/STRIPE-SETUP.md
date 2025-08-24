# Stripe Payment Integration Setup

This document explains how to set up Stripe payments for the PROJECT:Echo donation system.

## Prerequisites

1. **Stripe Account**: Create a free account at [stripe.com](https://stripe.com)
2. **Test Mode**: Start with test mode for development and testing

## Setup Steps

### 1. Get Your Stripe Keys

1. Log in to your Stripe Dashboard
2. Navigate to **Developers** → **API Keys**
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)

### 2. Configure Environment Variables

Create or update your `.env` file in the `server/` directory:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_PUBLIC_KEY=pk_test_your_actual_public_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Update Frontend Configuration

In `index.html`, update the Stripe public key:

```javascript
// Initialize Stripe
window.stripe = Stripe('pk_test_your_actual_public_key_here');
```

### 4. Install Dependencies

```bash
cd server
npm install stripe
```

### 5. Test the Integration

1. Start your server: `npm run dev`
2. Open the app and click the "💝 Donate" button
3. Use Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future date for expiry and any 3-digit CVC

## Webhook Setup (Optional)

For production, set up webhooks to handle payment confirmations:

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select events: `checkout.session.completed`
4. Copy the webhook secret to your `.env` file

## Going Live

1. Switch to **Live mode** in your Stripe Dashboard
2. Get your live API keys (starts with `pk_live_` and `sk_live_`)
3. Update your environment variables
4. Test with real payments (start small!)

## Security Notes

- ✅ Secret keys are stored in environment variables
- ✅ Public keys are safe to include in frontend code
- ✅ Payment processing happens on Stripe's secure servers
- ✅ We never store credit card information

## Current Configuration

The system is currently configured with:
- **Public Key**: `pk_test_51Rvuuc3bHJKA1SJwlKDVDaUogCMDrEHvSgleYLxsBHdXXoLiE5xEdmCLtcFggmNCCZk8s2AUN1jOzAaAYntPh2oF00MtslSllT`
- **Secret Key**: Set via environment variable `STRIPE_SECRET_KEY`

## Troubleshooting

### "Payment system not configured" Error
- Check that `STRIPE_SECRET_KEY` is set in your `.env` file
- Restart your server after updating environment variables

### "Stripe not loaded" Error
- Check browser console for JavaScript errors
- Ensure Stripe.js script is loaded before your app code

### Payment Fails
- Check Stripe Dashboard logs for detailed error messages
- Verify your API keys are correct and not expired
- Ensure you're using test card numbers in test mode

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe API Reference](https://stripe.com/docs/api)
