const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();

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

  const db = admin.firestore();

  /**
   * Finds a Firebase user document by their Stripe customer ID.
   * @param {string} customerId - The Stripe customer ID.
   * @return {Object|null} The user document or null.
   */
  async function findUserByCustomerId(customerId) {
    const snapshot = await db.collection("users")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();
    if (snapshot.empty) return null;
    return snapshot.docs[0];
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const firebaseUserId = session.metadata.firebaseUserId;
      console.log("Checkout session completed for user:", firebaseUserId);

      if (firebaseUserId) {
        try {
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
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const userDoc = await findUserByCustomerId(sub.customer);
      if (userDoc) {
        const updates = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (sub.pause_collection) {
          updates.subscriptionStatus = "paused";
        } else if (sub.cancel_at_period_end) {
          updates.subscriptionStatus = "active";
        } else if (sub.status === "active") {
          updates.subscriptionStatus = "active";
        }
        await userDoc.ref.update(updates);
        console.log("Subscription updated for user:", userDoc.id);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const userDoc = await findUserByCustomerId(sub.customer);
      if (userDoc) {
        await userDoc.ref.update({
          subscriptionStatus: "cancelled",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("Subscription cancelled for user:", userDoc.id);
      }
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({received: true});
});
