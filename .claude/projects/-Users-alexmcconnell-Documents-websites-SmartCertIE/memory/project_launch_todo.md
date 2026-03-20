---
name: Pre-launch TODO list
description: Remaining items to fix before SmartCert goes public - tracked from audit on 2026-03-20
type: project
---

## Pre-Launch TODO List (as of 2026-03-20)

### CRITICAL - Must Fix

| # | Item | Effort | Status |
|---|------|--------|--------|
| 1 | Switch Stripe to live keys + live price ID (`price_1Qy1kzGsigejaHFWZKqC600v` in `functions/index.js:48`) + register live webhook in Stripe dashboard | Config | TODO |
| 2 | Fix `getSubscriptionDetails` auth — currently takes `uid` as query param with NO auth, anyone can read any user's subscription data (`functions/index.js:253-295`) | Small | TODO |
| 3 | Fix setup.html + account.html forms — they collect firstName, lastName, phone but only save `photoURL` to Firestore (`js/script.js` setup handler ~line 822, account handler ~line 948) | Small | TODO |
| 4 | Handle Stripe cancellation/failure webhooks — `functions/webHook.js` only handles `checkout.session.completed`, not `customer.subscription.deleted`, `customer.subscription.updated`, or `invoice.payment_failed`. Cancelled users stay "active" forever | Medium | TODO |
| 5 | Lock down CORS — all Cloud Functions use `Access-Control-Allow-Origin: *`. Change to `https://smartcert.ie` | Small | TODO |

### MEDIUM - Should Fix

| # | Item | Effort | Status |
|---|------|--------|--------|
| 6 | Update privacy policy — states chat history is browser-only, but chat sessions are now stored in Firestore (`chatSessions` subcollection) | Small | TODO |
| 7 | Write proper About page bios — currently has joke placeholder text ("massive nerd, has a website", etc.) in `about.html` | Content | TODO |
| 8 | Fix cache busting — `firebase.json` caches JS/CSS for 1 year with no content hash in filenames. Users will get stale files after updates | Small | TODO |

### DONE (completed 2026-03-20)

- ~~Update copyright to 2026~~ (all footers)
- ~~Delete `js/config.js`~~ (exposed Gemini API key) and ~~`js/manageSubscription.js`~~ (dead code with broken `/get-subscription-details` endpoint)
- ~~Fix email consistency~~ (support@smartcert.ie → contact@smartcert.ie in privacy.html and terms.html)
- ~~Move marked.js before chat.js~~ in chat.html (was loading after, causing markdown fallback to plain text)
- ~~Remove `console.log("Firebase initialized successfully")`~~ from script.js

### Notes
- Only launching the Certi plan (first plan). Benji and Roger are "Coming Soon" — no work needed on those.
- Landing page claims "fastest growing platform" — may want to soften for launch.
- In-memory rate limit (`rateLimitMap` in functions/index.js) resets on cold start — not robust but acceptable for launch.
