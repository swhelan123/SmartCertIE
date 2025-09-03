let selectedTopic = "";

/*******************************************************
 * FIREBASE v9 SETUP (MODULAR)
 *******************************************************/
// 1) Import Firebase SDK from CDN (using latest stable version)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { doc, getDoc, setDoc, serverTimestamp, addDoc, collection, query, orderBy, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// 2) Your Firebase configuration - Replace with YOUR_GEMINI_API_KEY placeholder in config.js if needed
const firebaseConfig = {
  apiKey: "AIzaSyDe5pXEGR015hQbXvoSGyJc955hgXO8tio",
  authDomain: "smartcert-f1965.firebaseapp.com",
  projectId: "smartcert-f1965",
  storageBucket: "smartcert-f1965.firebasestorage.app",
  messagingSenderId: "1075815326636",
  appId: "1:1075815326636:web:ffd63ed204d2832e295009",
  measurementId: "G-6CJR44Z4MK",
};

// 3) Initialize Firebase with improved error handling
let app;
let analytics;
try {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// 4) Get Auth & Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

/*******************************************************
 * REDIRECT IF LOGGED IN ALREADY
 *******************************************************/
// In script.js
if ((window.location.pathname === "/" || window.location.pathname.endsWith("index.html")) && !window.location.search.includes("showLanding")) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // If logged in, redirect to chat.html
      window.location.href = "chat.html";
    }
  });
}

/*******************************************************
 * DARK MODE ICON (SUN/MOON)
 *******************************************************/
const body = document.body;
const modeIcon = document.getElementById("modeIcon");

if (modeIcon) {
  // On page load, see if theme is 'dark'
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    modeIcon.src = "assets/img/light.png"; // show sun
  } else {
    modeIcon.src = "assets/img/dark.png"; // show moon
  }

  // When icon is clicked
  modeIcon.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    modeIcon.src = isDark ? "assets/img/light.png" : "assets/img/dark.png";
  });
}

/*******************************************************
 * AUTH STATE & UI TOGGLING
 *******************************************************/
// Elements for top-right container
const loginBtn = document.getElementById("loginBtn");
const profilePic = document.getElementById("profilePic");
const accountLink = document.getElementById("accountLink");

// Listen for Firebase auth changes (logged in/out)
onAuthStateChanged(auth, async (user) => {
  // Ensure the chat UI elements exist
  if (!chatContainer || !chatInput || !sendBtn || !chatMessages) return;

  if (user) {
    loginBtn.classList.add("hidden");
    profilePic.classList.remove("hidden");
    accountLink.setAttribute("href", "account.html");

    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const subscriptionStatus = userData.subscriptionStatus || "not-subscribed";

      // Set global userAvatarUrl using the user's profile photo or fallback
      window.userAvatarUrl = userData.photoURL || "assets/img/pfp.avif";
      if (userData.photoURL) {
        profilePic.src = userData.photoURL;
      }

      if (subscriptionStatus === "active") {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        const subscribeBtn = document.getElementById("subscribeBtn");
        if (subscribeBtn) subscribeBtn.classList.add("hidden");
      } else {
        chatInput.disabled = true;
        sendBtn.disabled = true;
        chatMessages.innerHTML = `
          <div class="chat-message message-bot">
            Click subscribe to use SmartCert chat.
          </div>`;
        let subscribeBtn = document.getElementById("subscribeBtn");
        if (!subscribeBtn) {
          subscribeBtn = document.createElement("button");
          subscribeBtn.id = "subscribeBtn";
          subscribeBtn.className = "login-button";
          subscribeBtn.textContent = "Subscribe";
          document.getElementById("topRightContainer").appendChild(subscribeBtn);
        } else {
          subscribeBtn.classList.remove("hidden");
        }
      }
    } else {
      window.location.href = "setup.html";
    }
  } else {
    window.userAvatarUrl = "assets/img/pfp.avif";
    chatInput.disabled = true;
    sendBtn.disabled = true;
    chatMessages.innerHTML = `
      <div class="chat-message message-bot">
        You must be logged in to use the chat.
        <a class="click-link" href="login.html">Log in here</a>.
      </div>`;
    loginBtn.classList.remove("hidden");
    const subscribeBtn = document.getElementById("subscribeBtn");
    if (subscribeBtn) subscribeBtn.classList.add("hidden");
  }
});

if (profilePic) {
  profilePic.addEventListener("click", () => {
    window.location.href = "account.html";
  });
}

//Event listener for clicking login
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

/*******************************************************
 * SIDEBAR NAV ON chat.html (Single-Page Sections)
 *******************************************************/
const sidebarLinks = document.querySelectorAll(".sidebar-nav a[data-section]");
const chatSection = document.getElementById("chatSection");
const notebookSection = document.getElementById("notebookSection");

// --- Set default state: show chat and highlight its link ---
if (chatSection && notebookSection) {
  chatSection.classList.remove("hidden");
  notebookSection.classList.add("hidden");
}
const chatLink = document.querySelector(".sidebar-nav a[data-section='chatSection']");
if (chatLink) {
  chatLink.classList.add("active");
}

// --- Sidebar click event listeners ---
if (sidebarLinks && chatSection && notebookSection) {
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-section");

      // 1) Hide both sections
      chatSection.classList.add("hidden");
      notebookSection.classList.add("hidden");

      // 2) Show the chosen section
      if (target === "chatSection") {
        chatSection.classList.remove("hidden");
      }
      if (target === "notebookSection") {
        notebookSection.classList.remove("hidden");

        // === Load the user’s notebook ===
        const entries = await window.loadNotebookEntries();

        // Clear the <ul> before we append new items
        const savedResponses = document.getElementById("savedResponses");
        if (savedResponses) {
          savedResponses.innerHTML = "";

          // Populate the <ul> with each doc
          entries.forEach((entry) => {
            // Create the <li> with the AI text
            const li = document.createElement("li");
            li.textContent = entry.text;

            // Create a small "Delete" button
            const delBtn = document.createElement("button");
            delBtn.textContent = "Delete";
            Object.assign(delBtn.style, {
              marginLeft: "12px",
              color: "#fff",
              backgroundColor: "#e53e3e", // a less intense red
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              padding: "4px 8px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              transition: "background-color 0.2s",
            });

            // Add hover effects for the Delete button
            delBtn.addEventListener("mouseover", () => {
              delBtn.style.backgroundColor = "#c53030"; // darker red on hover
            });
            delBtn.addEventListener("mouseout", () => {
              delBtn.style.backgroundColor = "#e53e3e"; // revert
            });

            // On click => delete from Firestore and remove from DOM
            delBtn.addEventListener("click", async () => {
              const confirmed = await showCustomConfirm("Are you sure you want to delete this entry?");
              if (!confirmed) return;
              try {
                await deleteDoc(doc(db, "users", auth.currentUser.uid, "notebook", entry.id));
                li.remove();
              } catch (err) {
                console.error("Error deleting doc:", err);
                customAlert("Could not delete entry");
              }
            });

            li.appendChild(delBtn);
            savedResponses.appendChild(li);
          });
        }
      }

      // 3) Remove 'active' from all sidebar links
      sidebarLinks.forEach((lnk) => {
        lnk.classList.remove("active");
      });

      // 4) Add 'active' to the clicked link
      link.classList.add("active");
    });
  });
}

/*******************************************************
 * Dropdown topic menu
 *******************************************************/

// References to the DOM elements
const unitContainer = document.getElementById("unitContainer");
const chapterContainer = document.getElementById("chapterContainer");
const selectedTopicContainer = document.getElementById("selectedTopicContainer");
const selectedTopicLabel = document.getElementById("selectedTopicLabel");
const changeTopicBtn = document.getElementById("changeTopicBtn");

// Define chapters for each unit (A, B, C)
const chapters = {
  A: ["The Scientific Method", "The Characteristics of Life", "Nutrition", "General Principles of Ecology", "A Study of an Ecosystem"],
  B: ["Cell Structure", "Cell Metabolism", "Cell Continuity", "Cell Diversity", "Genetics"],
  C: ["Diversity of Organisms", "Organisation and the Vascular Structures", "Transport and Nutrition", "Breathing System and Excretion", "Responses to Stimuli", "Reproduction and Growth"],
};

// Grab all unit buttons (A/B/C)
const unitButtons = document.querySelectorAll(".unit-button");

// For each unit button, when clicked:
unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // 1) Identify which unit was chosen (A/B/C)
    const unit = button.getAttribute("data-unit");

    // 2) Hide the unit container
    unitContainer.classList.add("hidden");

    // 3) Clear any existing chapter buttons
    chapterContainer.innerHTML = "";

    // 4) Create new buttons for each chapter in that unit
    if (chapters[unit]) {
      chapters[unit].forEach((chapter) => {
        const chapterBtn = document.createElement("button");
        chapterBtn.textContent = chapter;
        chapterBtn.classList.add("chapter-button");

        // Apply color styling based on the unit
        if (unit === "A") {
          chapterBtn.classList.add("unit-green");
        } else if (unit === "B") {
          chapterBtn.classList.add("unit-purple");
        } else if (unit === "C") {
          chapterBtn.classList.add("unit-red");
        }

        // When a chapter is selected:
        chapterBtn.addEventListener("click", () => {
          // Hide the chapter container
          chapterContainer.classList.add("hidden");
          // Display the selected chapter name
          selectedTopicLabel.textContent = chapter;
          //New - set global selected topicd variable
          selectedTopic = chapter;
          window.selectedTopic = chapter;
          // Show the container that holds the "Change Topic" button
          selectedTopicContainer.classList.remove("hidden");
        });

        chapterContainer.appendChild(chapterBtn);
      });
    }

    // 5) Show the chapter container with the newly created buttons
    chapterContainer.classList.remove("hidden");
  });
});

// Handle the "Change Topic" button (reset selection)
if (changeTopicBtn) {
  changeTopicBtn.addEventListener("click", () => {
    // Hide the selected topic container
    selectedTopicContainer.classList.add("hidden");
    // Clear the label
    selectedTopicLabel.textContent = "";
    // --- NEW: Clear the global selectedTopic variable ---
    selectedTopic = "";
    // Show the unit container again so user can pick a new unit
    unitContainer.classList.remove("hidden");
    // Clear and hide the chapter container
    chapterContainer.innerHTML = "";
    chapterContainer.classList.add("hidden");
  });
}

/*******************************************************
 * LOGIN PAGE (login.html) - Real Firebase Login
 *******************************************************/
const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailVal = document.getElementById("emailInput")?.value.trim();
    const passVal = document.getElementById("passwordInput")?.value.trim();

    if (!emailVal || !passVal) {
      errorMessage.textContent = "Please enter email and password.";
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, emailVal, passVal);
      window.location.href = "chat.html"; // Successful login, redirect user
    } catch (err) {
      errorMessage.textContent = "Invalid email or password. Please try again.";
    }
  });
}

/*******************************************************
 * ACCOUNT PAGE (account.html)
 *******************************************************/
const accountInfo = document.getElementById("accountInfo");
const logoutBtn = document.getElementById("logoutBtn");
// We'll check auth state to see if user is logged in
onAuthStateChanged(auth, (user) => {
  if (accountInfo && logoutBtn) {
    if (!user) {
      accountInfo.textContent = "You are not logged in. Redirecting to login...";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    } else {
      accountInfo.textContent = "Welcome to your account page! (Firebase user: " + user.email + ")";
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        customAlert("Logged out!");
        // window.location.href = "index.html";
      });
    }
  }
});

/*******************************************************
 * SIGN-UP LOGIC (signup.html)
 *******************************************************/
// If you have a signup page with <form id="signupForm">, plus
// <input id="emailInput">, <input id="passwordInput">, <input id="confirmPasswordInput">
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailVal = document.getElementById("emailInput")?.value.trim();
    const passVal = document.getElementById("passwordInput")?.value.trim();
    const confirmVal = document.getElementById("confirmPasswordInput")?.value.trim();

    if (!emailVal || !passVal || !confirmVal) {
      customAlert("Please fill in all fields.");
      return;
    }
    if (passVal !== confirmVal) {
      customAlert("Passwords do not match.");
      return;
    }

    try {
      // Create user with Firebase
      await createUserWithEmailAndPassword(auth, emailVal, passVal);
      customAlert("Account created successfully!");
      window.location.href = "setup.html";
    } catch (err) {
      customAlert("Sign-up error: " + err.message);
    }
  });
}

/*******************************************************
 * SETUP PAGE (setup.html) - Collect Name, Phone, Photo
 *******************************************************/
const setupForm = document.getElementById("setupForm");
if (setupForm) {
  setupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1) Ensure user is logged in
    const user = auth.currentUser;
    if (!user) {
      customAlert("You must be logged in!");
      return;
    }

    // 2) Gather form inputs
    const file = document.getElementById("profilePicInput").files[0];
    let photoURL = "";

    // 3) If user selected a file, upload to Storage
    if (file) {
      const storage = getStorage(app);
      // Save under /profilePics/{uid}/{filename}
      const storageRef = ref(storage, `profilePics/${user.uid}/${file.name}`);
      // Upload the file
      await uploadBytes(storageRef, file);
      // Get a download URL to store in Firestore
      photoURL = await getDownloadURL(storageRef);
    }

    // 4) Save user profile data to Firestore (including photoURL)
    await setDoc(
      doc(db, "users", user.uid),
      {
        photoURL,
        // plus any other fields: name, phone, etc.
      },
      { merge: true },
    );

    // 5) Redirect or show success
    customAlert("Profile setup complete!");
    window.location.href = "chat.html";
  });
}

// GOOGLE SIGN-UP
const googleSignupBtn = document.getElementById("googleSignupBtn");
if (googleSignupBtn) {
  googleSignupBtn.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 1) Check if there's a user doc in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // No doc => definitely new user => redirect to setup
        customAlert("Google account created successfully!");
        window.location.href = "setup.html";
      } else {
        // Existing user => go to home (or skip if you want them to do setup anyway)
        window.location.href = "chat.html";
      }
    } catch (err) {
      console.error("Google sign-up error:", err);
      customAlert("Google sign-up error");
    }
  });
}

/*******************************************************
 * ACCOUNT PAGE - Display & Update Profile
 *******************************************************/
const accountProfilePic = document.getElementById("accountProfilePic");
const accountEmail = document.getElementById("accountEmail");
const accountPhone = document.getElementById("accountPhone");
const updateAccountForm = document.getElementById("updateAccountForm");

onAuthStateChanged(auth, async (user) => {
  // If we're on account.html, we have updateAccountForm
  if (updateAccountForm) {
    if (!user) {
      // Not logged in → redirect to login
      if (accountInfo) {
        accountInfo.textContent = "You are not logged in. Redirecting to login...";
      }
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      // Logged in → fetch user doc from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // If doc exists, populate the page
      if (userSnap.exists()) {
        const data = userSnap.data();

        // 1) Display greeting in #accountInfo
        const displayName = (data.firstName || "") + " " + (data.lastName || "");
        accountInfo.textContent = `Hello, ${displayName.trim()}!`;

        // 2) Show email from Firestore if stored, else from auth
        accountEmail.textContent = data.email || user.email || "";
        // 3) Show phone
        accountPhone.textContent = data.phone || "";

        // 4) Show profile pic if we have a photoURL
        if (data.photoURL) {
          accountProfilePic.src = data.photoURL;
        }

        // 5) Also fill the update form with current data
        document.getElementById("updateFirstName").value = data.firstName || "";
        document.getElementById("updateLastName").value = data.lastName || "";
        document.getElementById("updatePhone").value = data.phone || "";
      } else {
        // If doc doesn't exist, show minimal info
        accountInfo.textContent = `Hello, ${user.email} (no profile data found).`;
        // Optionally direct them to setup.html
      }
    }
  }
});

// Handle "Save Changes" form submission
if (updateAccountForm) {
  updateAccountForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      customAlert("Not logged in!");
      return;
    }

    try {
      // 1) Check if user selected a new file
      const file = document.getElementById("newProfilePic").files[0];
      let newPhotoURL = ""; // fallback or existing photo

      if (file) {
        // 2) Upload to Storage
        const storage = getStorage(app);
        const storageRef = ref(storage, `profilePics/${user.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        newPhotoURL = await getDownloadURL(storageRef);
      }

      // 3) Merge new photoURL into Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          photoURL: newPhotoURL,
          // plus any other updated fields
        },
        { merge: true },
      );

      // 4) Update the <img> on account page (if you want immediate UI update)
      accountProfilePic.src = newPhotoURL || "assets/img/pfp.avif";

      customAlert("Profile updated successfully!");
      window.location.href = "chat.html";
    } catch (err) {
      console.error("Update profile error:", err);
      customAlert("Error updating profile: " + err.message);
    }
  });
}

// Grab references to the chat elements
const chatContainer = document.getElementById("chatSection");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const chatMessages = document.getElementById("chatMessages");

// FORGOT PASSWORD PAGE
const forgotPassForm = document.getElementById("forgotPassForm");
if (forgotPassForm) {
  forgotPassForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1) Grab the email from the resetEmailInput field
    const resetEmailVal = document.getElementById("resetEmailInput")?.value.trim();
    if (!resetEmailVal) {
      customAlert("Please enter your email address.");
      return;
    }

    try {
      // 2) Use Firebase to send the password reset email
      await sendPasswordResetEmail(auth, resetEmailVal);
      customAlert(`Password reset email sent to: ${resetEmailVal}`);

      // Optionally, redirect them to login or show a success message
      window.location.href = "login.html";
    } catch (err) {
      console.error("Password reset error:", err);
      customAlert("Error sending reset email: " + err.message);
    }
  });
}

// On make_new_pass.html
const newPassForm = document.getElementById("newPassForm");
if (newPassForm) {
  // 1) Parse the 'oobCode' from the URL
  const queryParams = new URLSearchParams(window.location.search);
  const oobCode = queryParams.get("oobCode"); // e.g. ?oobCode=abc123

  if (!oobCode) {
    customAlert("Invalid or missing reset code in URL.");
    // optionally redirect them somewhere
  }

  // 2) Add event listener to the form
  newPassForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    // Basic checks
    if (!newPassword || !confirmPassword) {
      customAlert("Please fill out both fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      customAlert("Passwords do not match.");
      return;
    }

    try {
      // 3) Confirm the password reset using Firebase
      await confirmPasswordReset(auth, oobCode, newPassword);
      customAlert("Your password has been reset successfully!");

      // Optionally redirect to login or auto-login
      window.location.href = "login.html";
    } catch (error) {
      console.error("confirmPasswordReset error:", error);
      customAlert("Error resetting password: " + error.message);
    }
  });

  // 3) Optional: Toggle password visibility
  const toggleButtons = document.querySelectorAll(".toggle-pass-btn");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const targetInput = document.getElementById(targetId);
      if (targetInput.type === "password") {
        targetInput.type = "text";
        btn.textContent = "Hide";
      } else {
        targetInput.type = "password";
        btn.textContent = "Show";
      }
    });
  });
}

/*******************************************************
 * Subscribe button
 *******************************************************/

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const subscriptionStatus = userData.subscriptionStatus || "not-subscribed";

      if (subscriptionStatus !== "active") {
        // Only create/show button if not subscribed

        let subscribeBtn = document.getElementById("subscribeBtn");
        if (!subscribeBtn) {
          subscribeBtn = document.createElement("button");
          subscribeBtn.id = "subscribeBtn";
          subscribeBtn.className = "login-button"; // Use your desired styling class
          subscribeBtn.textContent = "Subscribe";
          document.getElementById("topRightContainer").appendChild(subscribeBtn);
        } else {
          subscribeBtn.classList.remove("hidden");
        }

        // Only attach the event listener once
        if (!subscribeBtn.dataset.listenerAttached) {
          subscribeBtn.addEventListener("click", async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
              customAlert("You must be logged in to subscribe.");
              return;
            }

            try {
              const endpointURL = "https://createcheckoutsession-63mubklboq-uc.a.run.app";
              const response = await fetch(endpointURL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ firebaseUserId: currentUser.uid }),
              });

              const data = await response.json();

              if (data.url) {
                window.location.href = data.url;
              } else {
                console.error("No checkout URL returned:", data);
                customAlert("An error occurred while creating the checkout session.");
              }
            } catch (err) {
              console.error("Error creating checkout session:", err);
              customAlert("An error occurred while processing your subscription.");
            }
          });
          subscribeBtn.dataset.listenerAttached = "true";
        }
      } else {
        // If user is subscribed, ensure the subscribe button is hidden
        const subscribeBtn = document.getElementById("subscribeBtn");
        if (subscribeBtn) subscribeBtn.classList.add("hidden");
      }
    }
  }
});

/*******************************************************
 * Subscribe button for pricing page
 *******************************************************/

// Grab the “Get full access” button from pricing.html
const subscribeCertiBtn = document.getElementById("subscribeCertiBtn");

onAuthStateChanged(auth, async (user) => {
  // If the button doesn’t exist on this page, do nothing
  if (!subscribeCertiBtn) return;

  // Remove any existing click listeners so we don't attach multiple
  // (optional, only needed if user might sign in/out while on the page)
  const newBtn = subscribeCertiBtn.cloneNode(true);
  subscribeCertiBtn.parentNode.replaceChild(newBtn, subscribeCertiBtn);

  // Reassign the new reference
  const finalBtn = document.getElementById("subscribeCertiBtn");

  if (!user) {
    // 1) Not logged in => Clicking button sends them to login
    finalBtn.textContent = "Get full access";
    finalBtn.disabled = false;
    finalBtn.addEventListener("click", () => {
      customAlert("You must be logged in to subscribe.");
      window.location.href = "login.html";
    });
  } else {
    // 2) User is logged in => Check their subscription status
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        // If no user doc, direct them to setup or handle accordingly
        finalBtn.textContent = "Complete Setup";
        finalBtn.disabled = false;
        finalBtn.addEventListener("click", () => {
          window.location.href = "setup.html";
        });
        return;
      }

      const userData = userSnap.data();
      const subscriptionStatus = userData.subscriptionStatus || "not-subscribed";

      if (subscriptionStatus === "active") {
        // 3) Already subscribed => Show “Current Plan” + disable
        finalBtn.textContent = "Current Plan";
        finalBtn.disabled = true;
        finalBtn.classList.add("current-plan");
      } else {
        // 4) Not subscribed => Attach your Stripe checkout logic
        finalBtn.textContent = "Get full access";
        finalBtn.disabled = false;

        finalBtn.addEventListener("click", async () => {
          try {
            const endpointURL = "https://createcheckoutsession-63mubklboq-uc.a.run.app";
            const response = await fetch(endpointURL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ firebaseUserId: user.uid }),
            });

            const data = await response.json();
            if (data.url) {
              window.location.href = data.url; // Stripe checkout
            } else {
              console.error("No checkout URL returned:", data);
              customAlert("An error occurred while creating the checkout session.");
            }
          } catch (err) {
            console.error("Error creating checkout session:", err);
            customAlert("An error occurred while processing your subscription.");
          }
        });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      customAlert("An error occurred while checking your subscription status.");
    }
  }
});

/*******************************************************
 * DYNAMIC ROUTING FROM LANDING
 *******************************************************/
const log = getAuth();
const navChatLink = document.getElementById("navChatLink");
if (navChatLink) {
  navChatLink.addEventListener("click", (e) => {
    e.preventDefault();
    const user = log.currentUser;
    if (user) {
      // If logged in, go straight to chat
      window.location.href = "chat.html";
    } else {
      // If not logged in, go to login page
      window.location.href = "login.html";
    }
  });
}

/*******************************************************
 * NOTEBOOK
 *******************************************************/

// We'll define a global function so we can call it from chat.js
window.saveNotebookEntry = async function (answer, question) {
  const user = auth.currentUser;
  if (!user) {
    customAlert("Please log in to save to your notebook!");
    return;
  }

  try {
    // Create a new doc in /users/{uid}/notebook
    await addDoc(collection(db, "users", user.uid, "notebook"), {
      text: answer,
      question: question || "", // Store the question as well
      topic: window.selectedTopic || "",
      createdAt: serverTimestamp(),
    });

    customAlert("Response saved to notebook!");
  } catch (err) {
    console.error("Error saving notebook entry:", err);
    customAlert("Couldn't save to notebook: " + err.message);
  }
};

window.loadNotebookEntries = async function () {
  const user = auth.currentUser;
  if (!user) return [];

  const qRef = query(collection(db, "users", user.uid, "notebook"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(qRef);

  const entries = [];
  snapshot.forEach((docSnap) => {
    // Grab docSnap.id plus the actual data
    entries.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });
  return entries;
};

/**************************************
 * custom alerts
 **************************************/

function customAlert(message) {
  // Create the overlay and modal elements
  const overlay = document.createElement("div");
  overlay.className = "custom-alert-overlay";

  const modalBox = document.createElement("div");
  modalBox.className = "custom-alert-box";

  const msgParagraph = document.createElement("p");
  msgParagraph.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "custom-alert-button";
  closeBtn.textContent = "OK";

  // Append elements together
  modalBox.appendChild(msgParagraph);
  modalBox.appendChild(closeBtn);
  overlay.appendChild(modalBox);

  // Append overlay to the body (or a designated container)
  document.body.appendChild(overlay);

  // Close the modal when button is clicked
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
}

/**************************************
 * custom confirms
 **************************************/

window.showCustomConfirm = function (message) {
  return new Promise((resolve) => {
    // 1) Create overlay
    const overlay = document.createElement("div");
    overlay.classList.add("custom-confirm-overlay");

    // 2) Create the modal
    const modal = document.createElement("div");
    modal.classList.add("custom-confirm-modal");

    // 3) The text
    const msg = document.createElement("p");
    msg.textContent = message;

    // 4) Buttons container
    const btnContainer = document.createElement("div");
    btnContainer.classList.add("custom-confirm-buttons");

    // 5) "Yes" button
    const yesBtn = document.createElement("button");
    yesBtn.textContent = "Yes";

    yesBtn.addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(true); // user confirmed
    });

    // 6) "No" button
    const noBtn = document.createElement("button");
    noBtn.textContent = "No";
    noBtn.classList.add("custom-confirm-no");

    noBtn.addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(false); // user canceled
    });

    // 7) Assemble
    btnContainer.appendChild(yesBtn);
    btnContainer.appendChild(noBtn);
    modal.appendChild(msg);
    modal.appendChild(btnContainer);
    overlay.appendChild(modal);

    // 8) Append overlay to body
    document.body.appendChild(overlay);
  });
};

// script.js (simplified snippet)
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", () => {
      // Toggle the "show" class on the nav-links
      navLinks.classList.toggle("show");
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtnChat = document.getElementById("hamburgerBtnChat");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  if (hamburgerBtnChat && sidebar && sidebarOverlay) {
    hamburgerBtnChat.addEventListener("click", () => {
      // Toggle the 'show' class on the sidebar
      sidebar.classList.toggle("show");
      sidebarOverlay.classList.toggle("show");
      // Also toggle the overlay
      if (sidebar.classList.contains("show")) {
        sidebarOverlay.classList.add("show");
      } else {
        sidebarOverlay.classList.remove("show");
      }
    });

    // Clicking the overlay also closes the sidebar
    sidebarOverlay.addEventListener("click", () => {
      sidebar.classList.remove("show");
      sidebarOverlay.classList.remove("show");
    });

    // Also auto-close the sidebar if a link is clicked
    const sidebarLinks = sidebar.querySelectorAll("a");
    sidebarLinks.forEach((link) => {
      link.addEventListener("click", () => {
        sidebar.classList.remove("show");
        sidebarOverlay.classList.remove("show");
      });
    });
  }
});
