// Import necessary modules
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
// Make sure express is installed (npm install express)

admin.initializeApp();

// Create an Express application instance
const app = express();

// Use the express.raw() middleware to capture the raw request body
// Express dont parse the body -> we can verify Stripe's signature.
app.use(express.raw({type: "*/*"}));

// Define a POST route at the root path, where the webhook events will be sent.
app.post("/", async (req, res) => {
  // Initialize Stripe using the secret key from your environment variables.
  // This key is provided via Firebase Secrets.
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Retrieve the 'stripe-signature' header which Stripe uses to sign the reque
  const sig = req.headers["stripe-signature"];
  let event;

  // Construct the event using Stripe's webhook utility.
  try {
    // req.body =Buffer containing the raw request bodyrequired for verificatio
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    // If signature verification fails, return an error.
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event based on its type
  switch (event.type) {
    case "checkout.session.completed": {
      // Extract the session object from the event data.
      const session = event.data.object;
      // Retrieve the Firebase user ID from the session metadata.
      const firebaseUserId = session.metadata.firebaseUserId;
      console.log("Checkout session completed for user:", firebaseUserId);

      if (firebaseUserId) {
        try {
          // Access Firestore and update the user's document.
          const db = admin.firestore();
          await db.collection("users").doc(firebaseUserId).update({
            subscriptionStatus: "active",
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log("Updated Firestore for user:", firebaseUserId);
        } catch (updateError) {
          console.error("Error updating Firestore:", updateError);
        }
      }
      break; // End of this case block.
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Send a JSON response to acknowledge receipt of the event.
  res.json({received: true});
});

// Export the Express app as a Cloud Function using onRequest.
exports.stripeWebhook = onRequest(app);
