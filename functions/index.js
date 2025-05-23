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
          subscription_data: {
            trial_period_days: 28, // Length trial
          },
          success_url: "https://smartcert.ie/success.html",
          cancel_url: "https://smartcert.ie/success.html",
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

// Check if Firebase Admin has already been initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.getSubscriptionDetails = onRequest(
    {secrets: ["STRIPE_SECRET_KEY"]}, // process.env.STRIPE_SECRET_KEY
    async (req, res) => {
    // Optional: If you need Stripe in this function, instantiate it here.
    // If you’re only reading from Firestore, you can skip this.
    // const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

      // Get the uid from the query parameter
      const uid = req.query.uid;
      if (!uid) {
        return res.status(400).json({error: "Missing uid parameter"});
      }

      try {
      // Retrieve user document from Firestore
        const userDoc = await admin.firestore()
            .collection("users")
            .doc(uid)
            .get();
        if (!userDoc.exists) {
          return res.status(404).json({error: "User not found"});
        }
        const userData = userDoc.data();

        // Retrieve subscription data from Firestore
        // (ensure you store this when a user subscribes)
        const subscription = userData.subscription;
        if (!subscription) {
          return res.status(404).json({error: "Subscription data not found"});
        }

        // Format dates assuming stored as Firestore Timestamps
        const startDate = subscription.startDate.toDate().toISOString()
            .split("T")[0];
        const nextBillingDate = subscription.nextBillingDate.toDate()
            .toISOString().split("T")[0];

        // Payment method info (for example, "Visa ending in 4242")
        const paymentMethod = subscription.paymentMethod ||
            "Card info unavailable";

        // Determine if the subscription is active
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
