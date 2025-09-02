/*******************************************************
 * CONFIGURATION FILE
 * 
 * This file contains configuration settings and API keys.
 * Replace placeholder values with your actual API keys.
 *******************************************************/

// Firebase Configuration
// You can keep these values as they are, or replace with your own Firebase project
export const firebaseConfig = {
  apiKey: "AIzaSyDe5pXEGR015hQbXvoSGyJc955hgXO8tio",
  authDomain: "smartcert-f1965.firebaseapp.com",
  projectId: "smartcert-f1965", 
  storageBucket: "smartcert-f1965.firebasestorage.app",
  messagingSenderId: "1075815326636",
  appId: "1:1075815326636:web:ffd63ed204d2832e295009",
  measurementId: "G-6CJR44Z4MK",
};

// Google Gemini API Configuration
// Get your API key from: https://makersuite.google.com/app/apikey
export const geminiConfig = {
  apiKey: "AIzaSyBYiYPIA-EK00NRzM-mS7dCHgYIaHfjbmQ",
  model: "gemini-2.0-flash", // Using Gemini 2.0 Flash (free tier available)
  apiUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
};

// Application Settings
export const appConfig = {
  systemPrompt: "You are a friendly Leaving Certificate biology tutor named Certi. You help students understand complex biological concepts through clear explanations, examples, and encouragement. Always be supportive and adapt your teaching style to the student's level of understanding. Use simple language when needed and provide practical examples.",
  maxTokens: 512,
  temperature: 0.7
};
