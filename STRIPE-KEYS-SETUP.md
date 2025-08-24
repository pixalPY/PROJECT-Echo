# 🔑 Stripe Keys Setup Instructions

## Your Stripe API Keys

**Public Key (Frontend):**
```
pk_test_[YOUR_PUBLIC_KEY_HERE]
```

**Secret Key (Backend):**
```
sk_test_[YOUR_SECRET_KEY_HERE]
```

## Setup Steps

### 1. For Local Development (if you run the backend locally):

Create a `.env` file in the `server/` directory:
```bash
STRIPE_SECRET_KEY=sk_test_[YOUR_SECRET_KEY_HERE]
STRIPE_PUBLIC_KEY=pk_test_[YOUR_PUBLIC_KEY_HERE]
```

### 2. For Netlify Deployment:

Since your app is deployed on Netlify as a static site, you need to set up a serverless function or use a different backend service to handle the Stripe secret key securely.

#### Option A: Use Netlify Functions (Recommended)
1. Create `netlify/functions/stripe-payment.js`
2. Set environment variables in Netlify dashboard
3. Update frontend to call Netlify function instead of `/api/payments/`

#### Option B: Use a Backend Service
- Deploy the server folder to a service like Heroku, Railway, or Vercel
- Set the environment variables in the hosting service
- Update the frontend fetch URL to point to your backend

## Current Status

✅ **Frontend Integration**: Complete - Stripe.js is loaded and configured  
✅ **Backend Route**: Complete - Payment processing endpoint created  
⚠️ **Environment Setup**: Needs configuration for your deployment method  

## Testing

Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

## Security Notes

- ✅ Secret keys are stored in environment variables (not in code)
- ✅ Frontend only uses public keys (safe to expose)
- ✅ All payment processing happens on Stripe's secure servers
- ✅ No credit card data is stored in your app

## Next Steps

1. Choose your backend deployment method
2. Set up the environment variables
3. Test a donation to ensure it works
4. Consider setting up webhooks for payment confirmations

The donation button is now fully functional and will redirect users to Stripe's secure checkout page! 🚀
