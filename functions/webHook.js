const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

exports.stripeWebhook = onRequest({
  secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  // This tells Firebase not to parse the request body at all
  // so we get the raw bytes for Stripe signature verification
  rawBody: true,
}, async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    // Here, we use req.rawBody (a Buffer) instead of req.body
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
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
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({received: true});
});
