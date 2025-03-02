/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const {onRequest} = require("firebase-functions/v2/https");


exports.createCheckoutSession = onRequest(
    {secrets: ["STRIPE_SECRET_KEY"]},
    async (req, res) => {
      // Initialize Stripe inside the function so that the secret is available.
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription", // Recurring payment mode.
          line_items: [{
            price: "price_1Qy1kzGsigejaHFWZKqC600v",
            // Replace with your actual Price ID.
            quantity: 1,
          }],
          success_url: "https://smartcert.ie",
          cancel_url: "https://smartcert.ie",
        });
        res.status(200).json({sessionId: session.id, url: session.url});
      } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({error: error.message});
      }
    },
);
