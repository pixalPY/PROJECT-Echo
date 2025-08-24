# 🚀 Netlify Stripe Setup Instructions

## Environment Variable Setup

You need to add your Stripe secret key to Netlify's environment variables.

### Steps:

1. **Go to your Netlify Dashboard**
   - Visit [netlify.com](https://netlify.com) and log in
   - Select your PROJECT:Echo site

2. **Navigate to Environment Variables**
   - Go to **Site settings** → **Environment variables**
   - Or go to **Site configuration** → **Environment variables**

3. **Add the Stripe Secret Key**
   - Click **"Add a variable"** or **"New variable"**
   - **Key**: `STRIPE_SECRET_KEY`
   - **Value**: `sk_test_your_stripe_secret_key_here` (Use the key provided by the user)
   - **Scopes**: Select "All scopes" or "Functions"
   - Click **"Create variable"**

4. **Redeploy Your Site**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Deploy site"**
   - Or just push a new commit to trigger auto-deploy

## What's Fixed:

✅ **Netlify Function Created**: `/.netlify/functions/create-checkout-session`  
✅ **Frontend Updated**: Now calls Netlify function instead of `/api/payments/`  
✅ **CORS Headers**: Properly configured for cross-origin requests  
✅ **Error Handling**: Better error messages and validation  

## Testing After Setup:

1. Wait for deployment to complete
2. Visit your site: `https://projectecho0.netlify.app`
3. Click the **"💝 Donate"** button
4. Select an amount and click **"Donate $X"**
5. Should redirect to Stripe Checkout (not show the JSON error)

## Test Card Numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future expiry date + any 3-digit CVC

## Troubleshooting:

### Still getting "Unexpected token" error?
- Check that the environment variable is set correctly
- Make sure you redeployed after setting the variable
- Check the Netlify function logs in the dashboard

### "Payment system not configured" error?
- The `STRIPE_SECRET_KEY` environment variable is missing
- Make sure it starts with `sk_test_` and is the full key

### Function not found (404)?
- Check that the Netlify function deployed correctly
- Look at the deploy logs for any build errors
- Make sure `netlify.toml` is configured properly

The donation system should now work perfectly with your Netlify deployment! 🎉
