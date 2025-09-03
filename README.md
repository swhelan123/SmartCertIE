# SmartCert

**SmartCert** is a web platform dedicated to helping 5th and 6th year Leaving Cert Biology students excel. We provide:

- **AI Chatbot** for quick, exam-focused Q&A with conversation context
- **Notebook** feature to save and review key responses
- **Topic Selector** covering core units and chapters
- **User Profiles** for a personalised experience

SmartCert is built by students for students and is **live** at [smartcert.ie](https://smartcert.ie).

## Recent Updates

### Enhanced Chat Features
- **Increased Token Limit**: Responses can now be up to 4096 tokens (previously 512) for more detailed explanations
- **Conversation Context**: The AI now remembers previous messages in the conversation for better continuity
- **Clear History**: Users can clear conversation history when needed
- **Improved Security**: API keys are now properly secured using environment variables and GitHub secrets

## Setup Instructions

### 1. API Configuration

To use the AI chatbot, you'll need a Google Gemini API key:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Replace `"YOUR_GEMINI_API_KEY_HERE"` in `js/config.js` with your actual key

### 2. Security Best Practices

⚠️ **Important**: Never commit API keys to your repository!

For production deployments:
- Use GitHub Secrets (see `GITHUB_SECRETS.md` for detailed instructions)
- For Firebase Functions, use Firebase Secrets Manager
- Copy `.env.example` to `.env` for local development

### 3. Local Development

```bash
# Clone the repository
git clone https://github.com/swhelan123/SmartCertIE.git
cd SmartCertIE

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# Then serve the files with any local server
python -m http.server 8000
# or
npx serve .
```

### 4. Firebase Deployment

For Firebase Functions:
```bash
cd functions
npm install

# Set up secrets
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase deploy --only functions
```

## Files Overview

- `js/chat.js` - Main chat functionality with conversation history
- `js/config.js` - Configuration including token limits and API settings
- `GITHUB_SECRETS.md` - Complete guide for securing API keys
- `.env.example` - Template for environment variables

---

## Contact

- **Email**: [contact@smartcert.ie](mailto:contact@smartcert.ie)

---

_Thanks for checking out SmartCert!_
