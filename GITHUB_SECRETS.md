# Using GitHub Secrets for API Keys

This guide explains how to securely store and use API keys with GitHub Secrets instead of hardcoding them in your repository.

## Why Use GitHub Secrets?

- **Security**: API keys are never exposed in your code or commit history
- **Team Collaboration**: Team members can deploy without seeing sensitive keys
- **Multiple Environments**: Different keys for development, staging, and production

## Setting Up GitHub Secrets

### 1. Access Repository Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 2. Add Your API Keys

Add these secrets one by one:

#### Required Secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `GEMINI_API_KEY` | Your Google Gemini API key | `AIzaSy...` |
| `STRIPE_SECRET_KEY` | Your Stripe secret key | `sk_test_...` or `sk_live_...` |

#### Optional Secrets (if overriding Firebase config):

| Secret Name | Description |
|-------------|-------------|
| `FIREBASE_API_KEY` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `FIREBASE_PROJECT_ID` | Firebase project ID |

### 3. Getting API Keys

#### Google Gemini API Key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your GitHub secrets

#### Stripe Secret Key:
1. Log into your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to **Developers** → **API Keys**
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
4. Add to GitHub secrets

## Using Secrets in GitHub Actions

If you have GitHub Actions workflows, you can access secrets like this:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Firebase
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
        run: |
          # Your deployment commands here
          firebase deploy
```

## Using Secrets in Firebase Functions

For Firebase Functions, set secrets using the Firebase CLI:

```bash
# Set Gemini API key
firebase functions:secrets:set GEMINI_API_KEY

# Set Stripe secret key  
firebase functions:secrets:set STRIPE_SECRET_KEY

# Deploy functions with secrets
firebase deploy --only functions
```

Then access in your functions:

```javascript
const {onRequest} = require("firebase-functions/v2/https");

exports.myFunction = onRequest(
  {secrets: ["GEMINI_API_KEY", "STRIPE_SECRET_KEY"]},
  async (req, res) => {
    const geminiKey = process.env.GEMINI_API_KEY;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    // Use your keys here
  }
);
```

## Local Development

For local development, create a `.env` file (use `.env.example` as template):

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual keys
# Note: .env is gitignored and won't be committed
```

## Security Best Practices

1. **Never commit API keys** to your repository
2. **Use different keys** for development and production
3. **Rotate keys regularly** (especially if compromised)
4. **Limit API key permissions** when possible
5. **Monitor API usage** for unusual activity

## Troubleshooting

### "API key not found" errors:
- Check that secret names match exactly (case-sensitive)
- Verify secrets are set at repository level, not organization level
- Make sure your GitHub Actions workflow has access to secrets

### Firebase Functions not finding secrets:
- Ensure secrets are properly set with `firebase functions:secrets:set`
- Check that function configuration includes the secret names
- Verify you're deploying to the correct Firebase project

### Local development issues:
- Make sure `.env` file exists and has correct values
- Check that your local server/build process loads environment variables
- Verify file permissions on `.env` (should not be world-readable)

## Migration from Hardcoded Keys

If you currently have hardcoded keys:

1. **First**: Set up GitHub secrets as described above
2. **Then**: Update your code to use environment variables
3. **Finally**: Remove hardcoded keys from your code
4. **Important**: If keys were previously committed, consider them compromised and generate new ones

## Additional Resources

- [GitHub Encrypted Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env#secret_manager)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Stripe API Keys](https://stripe.com/docs/keys)