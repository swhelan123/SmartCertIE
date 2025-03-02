/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const {onRequest} = require("firebase-functions/v2/https");


// const {onRequest} =
// require("firebase-functions/v2/https");
// commented the below line out for the moment as it was causing
// issues because it wasnt being used
// const logger =
// require("firebase-functions/logger");

// added this instead and
// checking if it works

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Minimal function for testing
/*
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello, world!");
});

*/


exports.createCheckoutSession = onRequest(
    {secrets: ["STRIPE_SECRET_KEY"]},
    async (req, res) => {
      // Initialize Stripe inside the function so that the secret is available.
      const stripe = require("stripe")(process.env.sk_test_51OcmVgGsigejaHFWSHlGAsnqILBQ3Pj5VBBtXaIThuQMQPL4OB5LIZY4K7G9KzSo4sfQZjbPGlkxcgzxJur4fccx00xXHWJEXq);

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


/*
exports.createCheckoutSession = functions.https.onRequest(
    async (req, res) => {
      // Optionally, you can add a check for the HTTP method here.
      try {
        // Create a new checkout session with Stripe
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          // Set the mode to subscription for recurring payments.
          line_items: [{
            price: "price_1Qy1kzGsigejaHFWZKqC600v",
            // Replace with your actual Price ID from Stripe.
            quantity: 1,
          }],
          // Replace these URLs with your actual success and cancel pages.
          success_url: "https://smartcert.ie",
          cancel_url: "https://smartcert.ie",
          // success_url: 'https://your-domain.com/success?session_id={CHECKOUT_SESSION_ID}',
          // cancel_url: 'https://your-domain.com/cancel',
        });
        // Return the session details to the client.
        res.status(200).json({sessionId: session.id, url: session.url});
      } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({error: error.message});
      }
    });
*/
