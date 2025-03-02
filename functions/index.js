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
      // Handle CORS preflight request
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        return res.status(204).send("");
      }
      // Initialize Stripe inside the function so that the secret is available.
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      // Parse firebase userID from request body
      const {firebaseUserId} = req.body;
      if (!firebaseUserId) {
        return res.status(400).json({error: "Missing firebaseUserId"});
      }

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription", // Recurring payment mode.
          line_items: [{
            price: "price_1Qy1kzGsigejaHFWZKqC600v",
            quantity: 1,
          }],
          success_url: "https://smartcert.ie",
          cancel_url: "https://smartcert.ie",
          metadata: {firebaseUserId: firebaseUserId},
        });
        res.status(200).json({sessionId: session.id, url: session.url});
      } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({error: error.message});
      }
    },
);
