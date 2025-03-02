const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Ensure STRIPE_WEBHOOK_SECRET is set in your Firebase environment

exports.stripeWebhook = onRequest(
    {secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
        runtimeOptions: {memory: "256MB", timeoutSeconds: 60}},
    async (req, res) => {
    // IMPORTANT: Ensure you have access to the raw body
    // If using Firebase Functions v2 with express,
    // you might need to disable body parsing. For now, assume req.rawBody is available.

      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object;
          // Extract metadata (Firebase user ID)
          const firebaseUserId = session.metadata.firebaseUserId;
          console.log("Checkout session completed for user:", firebaseUserId);

          if (firebaseUserId) {
            try {
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
          break;

          // Optionally handle other events:
          // case "customer.subscription.deleted":
          //   // Update Firestore accordingly,
          // for example, set subscriptionStatus to "canceled"
          //   break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Return a response to acknowledge receipt of the event
      res.json({received: true});
    },
);
