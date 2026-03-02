/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const {onRequest} = require("firebase-functions/v2/https");

const webhook = require("./webHook.js");
exports.stripeWebhook = webhook.stripeWebhook;


exports.createCheckoutSession = onRequest(
    {secrets: ["STRIPE_SECRET_KEY"]},
    async (req, res) => {
      // Handle CORS preflight requests
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        return res.status(204).send("");
      }

      // Only allow POST
      if (req.method !== "POST") {
        res.set("Access-Control-Allow-Origin", "*");
        return res.status(405).send("Method Not Allowed");
      }

      // Initialize Stripe using the secret key from environment variables
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

      // Parse firebaseUserId from request body
      const {firebaseUserId} = req.body;
      if (!firebaseUserId) {
        res.set("Access-Control-Allow-Origin", "*");
        return res.status(400).json({error: "Missing firebaseUserId"});
      }

      try {
        // Create the Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          line_items: [{
            price: "price_1Qy1kzGsigejaHFWZKqC600v",
            quantity: 1,
          }],
          success_url: "https://smartcert.ie/success.html",
          cancel_url: "https://smartcert.ie/pricing.html",
          metadata: {firebaseUserId: firebaseUserId},
        });

        // Set the CORS header on the successful response as well
        res.set("Access-Control-Allow-Origin", "*");
        return res.status(200).json({sessionId: session.id, url: session.url});
      } catch (error) {
        console.error("Error creating checkout session:", error);
        res.set("Access-Control-Allow-Origin", "*");
        return res.status(500).json({error: error.message});
      }
    },
);


const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

// Simple in-memory rate limiter: max 20 requests per user per hour
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(uid) {
  const now = Date.now();
  const entry = rateLimitMap.get(uid);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(uid, {windowStart: now, count: 1});
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

exports.askCerti = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Verify Firebase auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({error: "Unauthorized — missing token"});
  }

  let uid;
  try {
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    uid = decodedToken.uid;
  } catch (e) {
    return res.status(401).json({error: "Unauthorized — invalid token"});
  }

  // Check that user has an active subscription
  try {
    const userDoc = await admin.firestore()
        .collection("users").doc(uid).get();
    if (!userDoc.exists ||
        userDoc.data().subscriptionStatus !== "active") {
      return res.status(403).json({error: "Active subscription required"});
    }
  } catch (e) {
    console.error("Error checking subscription:", e);
    return res.status(500).json({error: "Failed to verify subscription"});
  }

  // Rate limit: max 20 requests per user per hour
  if (!checkRateLimit(uid)) {
    return res.status(429).json({
      error: "Too many requests. Please wait a while before trying again.",
    });
  }

  const {question, topicId, conversationHistory} = req.body;
  if (!question) {
    return res.status(400).json({error: "Missing question"});
  }

  let context = "";
  if (topicId) {
    try {
      const topicDoc = await admin.firestore()
          .collection("biology_context")
          .doc(topicId)
          .get();
      if (topicDoc.exists) {
        context = topicDoc.data().context || "";
      }
    } catch (e) {
      console.error("Error fetching topic context:", e);
    }
  }

  const {GoogleGenAI} = require("@google/genai");
  const ai = new GoogleGenAI({
    vertexai: true,
    project: "smartcert-f1965",
    location: "us-central1",
  });

  const basePrompt = "You are a Leaving Cert biology chatbot helper" +
    " called Certi. Answer the question with strict regard to the" +
    " Leaving Cert biology syllabus. Exam specific answers are priority.";

  let systemInstruction = basePrompt;
  if (context) systemInstruction += "\n\nContext:\n" + context;
  if (conversationHistory && conversationHistory.length > 0) {
    systemInstruction += "\n\nPrevious conversation:";
    conversationHistory.forEach((msg) => {
      const role = msg.role === "user" ? "Student" : "Certi";
      systemInstruction += `\n${role}: ${msg.content}`;
    });
    systemInstruction += "\n\nContinue the conversation naturally.";
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: question,
      config: {systemInstruction},
    });
    return res.status(200).json({answer: result.text});
  } catch (e) {
    console.error("Gemini error:", e);
    return res.status(500).json({error: "Failed to get response"});
  }
});

exports.createBillingPortalSession = onRequest(
    {secrets: ["STRIPE_SECRET_KEY"]},
    async (req, res) => {
      res.set("Access-Control-Allow-Origin", "*");

      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return res.status(204).send("");
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      // Verify Firebase auth token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({error: "Unauthorized"});
      }

      let uid;
      try {
        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        uid = decodedToken.uid;
      } catch (e) {
        return res.status(401).json({error: "Invalid token"});
      }

      try {
        const userDoc = await admin.firestore()
            .collection("users").doc(uid).get();
        if (!userDoc.exists || !userDoc.data().stripeCustomerId) {
          return res.status(404).json({error: "No subscription found"});
        }

        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.billingPortal.sessions.create({
          customer: userDoc.data().stripeCustomerId,
          return_url: "https://smartcert.ie/account.html",
        });

        return res.status(200).json({url: session.url});
      } catch (error) {
        console.error("Error creating portal session:", error);
        return res.status(500).json({error: error.message});
      }
    },
);

exports.getSubscriptionDetails = onRequest(
    {secrets: ["STRIPE_SECRET_KEY"]},
    async (req, res) => {
      const uid = req.query.uid;
      if (!uid) {
        return res.status(400).json({error: "Missing uid parameter"});
      }

      try {
        const userDoc = await admin.firestore()
            .collection("users").doc(uid).get();
        if (!userDoc.exists) {
          return res.status(404).json({error: "User not found"});
        }
        const userData = userDoc.data();

        const subscription = userData.subscription;
        if (!subscription) {
          return res.status(404).json({
            error: "Subscription data not found",
          });
        }

        const startDate = subscription.startDate
            .toDate().toISOString().split("T")[0];
        const nextBillingDate = subscription.nextBillingDate
            .toDate().toISOString().split("T")[0];
        const paymentMethod =
            subscription.paymentMethod || "Card info unavailable";
        const isActive = subscription.isActive === true;

        return res.json({
          startDate,
          nextBillingDate,
          paymentMethod,
          isActive,
        });
      } catch (error) {
        console.error("Error fetching subscription details:", error);
        return res.status(500).json({error: "Internal Server Error"});
      }
    },
);
