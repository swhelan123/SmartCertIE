# SmartCert AI Integration Setup

## Google Gemini API Key Setup

This application now uses Google Gemini 1.5 Flash for AI-powered tutoring. To set up your API key:

### 1. Get Your Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 2. Configure the API Key
1. Open `js/config.js`
2. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key:

```javascript
export const geminiConfig = {
  apiKey: "your-actual-api-key-here", // Replace this
  model: "gemini-1.5-flash",
  apiUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
};
```

### 3. Firebase Configuration
The Firebase configuration is already set up for the SmartCert project. If you want to use your own Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Get your project configuration
4. Update the `firebaseConfig` object in `js/config.js`

## Features Fixed

### Firebase Integration
- ✅ Updated to Firebase SDK v10.7.1 (latest stable)
- ✅ Added proper error handling for Firebase initialization
- ✅ Fixed hosting configuration in `firebase.json`
- ✅ Added null checks for auth and database operations

### AI Integration
- ✅ Replaced AIML API with Google Gemini 1.5 Flash
- ✅ Added proper error handling for API calls
- ✅ Configured for free tier usage
- ✅ Added placeholder for API key with clear setup instructions

### API Limits
- Gemini 1.5 Flash has a free tier with generous limits
- No credit card required for the free tier
- Rate limits apply - see [Google AI pricing](https://ai.google.dev/pricing) for details

## Testing the Setup

1. Open your browser's developer console
2. Navigate to the chat page
3. Try sending a biology question
4. Check for any error messages in the console

If you see "Please configure your Google Gemini API key" - follow the setup instructions above.

## Troubleshooting

### Common Issues
1. **"Firebase configuration error"** - Check your internet connection and Firebase settings
2. **"Invalid API key"** - Verify your Gemini API key is correct and has proper permissions
3. **"API quota exceeded"** - You've hit the free tier limits, wait or upgrade your plan

### Getting Help
- Check the browser console for detailed error messages
- Verify your API key is correctly set in `js/config.js`
- Ensure you have a stable internet connection for API calls