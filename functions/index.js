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
        res.set("Access-Control-Allow-Origin", "*"); // Also se
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
            price: "price_1Qy1kzGsigejaHFWZKqC600v", // Replace with
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

exports.askCerti = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
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
