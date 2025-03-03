let selectedTopic = "";

/*******************************************************
 * FIREBASE v9 SETUP (MODULAR)
 *******************************************************/
// 1) Import only what you need from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
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
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";

// 2) Your Firebase configuration (replace with your real config)
const firebaseConfig = {
  apiKey: "AIzaSyDe5pXEGR015hQbXvoSGyJc955hgXO8tio",
  authDomain: "smartcert-f1965.firebaseapp.com",
  projectId: "smartcert-f1965",
  storageBucket: "smartcert-f1965.appspot.com",
  messagingSenderId: "1075815326636",
  appId: "1:1075815326636:web:ffd63ed204d2832e295009",
  measurementId: "G-6CJR44Z4MK",
};

// 3) Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 4) Get Auth & Firestore instances
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

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
    // Hide the login/signup button and show profile pic/account link
    loginBtn.classList.add("hidden");
    profilePic.classList.remove("hidden");
    accountLink.setAttribute("href", "account.html");

    // Retrieve the user's Firestore document
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Default to "not-subscribed" if subscriptionStatus is missing
      const subscriptionStatus = userData.subscriptionStatus || "not-subscribed";

      if (subscriptionStatus === "active") {
        // User is subscribed: enable chat
        chatInput.disabled = false;
        sendBtn.disabled = false;
        //edited out trying to fix the dissapearing message problem
        //chatMessages.innerHTML = ""; // Optionally, add a welcome message

        // Hide the subscribe button if it exists
        const subscribeBtn = document.getElementById("subscribeBtn");
        if (subscribeBtn) subscribeBtn.classList.add("hidden");
      } else {
        // User is logged in but not subscribed: disable chat and show subscribe prompt
        chatInput.disabled = true;
        sendBtn.disabled = true;
        chatMessages.innerHTML = `
          <div class="chat-message message-bot">
            Click subscribe to use SmartCert chat.
          </div>`;

        // Create or show the subscribe button in the top-right container
        let subscribeBtn = document.getElementById("subscribeBtn");
        if (!subscribeBtn) {
          subscribeBtn = document.createElement("button");
          subscribeBtn.id = "subscribeBtn";
          subscribeBtn.className = "login-button"; // Reuse existing styling or change as needed
          subscribeBtn.textContent = "Subscribe";
          document.getElementById("topRightContainer").appendChild(subscribeBtn);
        } else {
          subscribeBtn.classList.remove("hidden");
        }
      }
    } else {
      // If no Firestore document exists for this user, redirect to setup
      window.location.href = "setup.html";
    }
  } else {
    // User is not logged in: disable chat and show login/signup message
    chatInput.disabled = true;
    sendBtn.disabled = true;
    chatMessages.innerHTML = `
      <div class="chat-message message-bot">
        You must be logged in to use the chat.
        <a class="click-link" href="login.html">Log in here</a>.
      </div>`;

    loginBtn.classList.remove("hidden");

    // Hide the subscribe button if it exists
    const subscribeBtn = document.getElementById("subscribeBtn");
    if (subscribeBtn) subscribeBtn.classList.add("hidden");
  }
});

//Event listener for pfp -> account
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

if (sidebarLinks && chatSection && notebookSection) {
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
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
      }

      // 3) Remove 'active' from all sidebar links
      sidebarLinks.forEach((lnk) => {
        lnk.classList.remove("active");
      });

      // 4) Add 'active' to the clicked link
      link.classList.add("active");
    });
  });

  // MAKE CHAT ACTIVE BY DEFAULT:
  // (1) Show chat, hide notebook
  chatSection.classList.remove("hidden");
  notebookSection.classList.add("hidden");

  // (2) Add "active" to the chat link
  const chatLink = document.querySelector(".sidebar-nav a[data-section='chatSection']");
  if (chatLink) {
    chatLink.classList.add("active");
  }
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
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailVal = document.getElementById("emailInput")?.value.trim();
    const passVal = document.getElementById("passwordInput")?.value.trim();
    if (!emailVal || !passVal) {
      alert("Please enter email and password");
      return;
    }

    try {
      // Attempt to sign in with Firebase
      await signInWithEmailAndPassword(auth, emailVal, passVal);
      alert("Logged in successfully!");
      window.location.href = "chat.html"; // go back to home
    } catch (err) {
      alert("Login error: " + err.message);
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
        window.location.href = "login.html";
      }, 2000);
    } else {
      accountInfo.textContent = "Welcome to your account page! (Firebase user: " + user.email + ")";
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        alert("Logged out!");
        window.location.href = "chat.html";
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
      alert("Please fill in all fields.");
      return;
    }
    if (passVal !== confirmVal) {
      alert("Passwords do not match.");
      return;
    }

    try {
      // Create user with Firebase
      await createUserWithEmailAndPassword(auth, emailVal, passVal);
      alert("Account created successfully!");
      window.location.href = "setup.html";
    } catch (err) {
      alert("Sign-up error: " + err.message);
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
      alert("You must be logged in to complete setup.");
      window.location.href = "login.html";
      return;
    }

    try {
      // 2) Gather form inputs
      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const phoneNumber = document.getElementById("phoneNumber").value.trim();
      const file = document.getElementById("profilePicInput").files[0];

      // Basic validation
      if (!firstName || !lastName || !phoneNumber) {
        alert("Please fill in all required fields.");
        return;
      }

      // 3) Upload profile picture to Firebase Storage (if provided)
      let photoURL = "";
      if (file) {
        const storage = getStorage(app);
        // Path: profilePics/{uid}/{filename}
        const storageRef = ref(storage, `profilePics/${user.uid}/${file.name}`);
        // Upload file
        await uploadBytes(storageRef, file);
        // Get download URL
        photoURL = await getDownloadURL(storageRef);
      }

      // 4) Save user profile data to Firestore
      // We'll merge so we don't overwrite if doc already exists
      await setDoc(
        doc(db, "users", user.uid),
        {
          email: user.email,
          firstName,
          lastName,
          phone: phoneNumber,
          photoURL,
          updatedAt: serverTimestamp(),

          //new fields for stripe integration
          subscriptionStatus: "not-subscribed",
          firebaseUserId: user.uid,
        },
        { merge: true },
      );

      // 5) Redirect to main page
      alert("Profile setup complete!");
      window.location.href = "chat.html";
    } catch (err) {
      console.error("Setup error:", err);
      alert("Error completing setup: " + err.message);
    }
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
        alert("Google account created successfully!");
        window.location.href = "setup.html";
      } else {
        // Existing user => go to home (or skip if you want them to do setup anyway)
        window.location.href = "chat.html";
      }
    } catch (err) {
      console.error("Google sign-up error:", err);
      alert("Google sign-up error: " + err.message);
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

    // Ensure user is logged in
    const user = auth.currentUser;
    if (!user) {
      alert("Not logged in.");
      return;
    }

    try {
      // Gather new values from the form
      const newFirstName = document.getElementById("updateFirstName").value.trim();
      const newLastName = document.getElementById("updateLastName").value.trim();
      const newPhone = document.getElementById("updatePhone").value.trim();
      const file = document.getElementById("newProfilePic").files[0];

      // (Optional) basic validation
      if (!newFirstName || !newLastName || !newPhone) {
        alert("Please fill in all fields before saving.");
        return;
      }

      // If user chose a new profile pic, upload it to Firebase Storage
      let newPhotoURL = accountProfilePic.src; // fallback to existing pic
      if (file) {
        const storage = getStorage(app);
        const storageRef = ref(storage, `profilePics/${user.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        newPhotoURL = await getDownloadURL(storageRef);
      }

      // Merge new data into Firestore doc
      await setDoc(
        doc(db, "users", user.uid),
        {
          firstName: newFirstName,
          lastName: newLastName,
          phone: newPhone,
          photoURL: newPhotoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // Update UI in real-time
      accountInfo.textContent = `Hello, ${newFirstName} ${newLastName}!`;
      accountPhone.textContent = newPhone;
      accountProfilePic.src = newPhotoURL;

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Update profile error:", err);
      alert("Error updating profile: " + err.message);
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
      alert("Please enter your email address.");
      return;
    }

    try {
      // 2) Use Firebase to send the password reset email
      await sendPasswordResetEmail(auth, resetEmailVal);
      alert(`Password reset email sent to: ${resetEmailVal}`);

      // Optionally, redirect them to login or show a success message
      window.location.href = "login.html";
    } catch (err) {
      console.error("Password reset error:", err);
      alert("Error sending reset email: " + err.message);
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
    alert("Invalid or missing reset code in URL.");
    // optionally redirect them somewhere
  }

  // 2) Add event listener to the form
  newPassForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    // Basic checks
    if (!newPassword || !confirmPassword) {
      alert("Please fill out both fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      // 3) Confirm the password reset using Firebase
      await confirmPasswordReset(auth, oobCode, newPassword);
      alert("Your password has been reset successfully!");

      // Optionally redirect to login or auto-login
      window.location.href = "login.html";
    } catch (error) {
      console.error("confirmPasswordReset error:", error);
      alert("Error resetting password: " + error.message);
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
              alert("You must be logged in to subscribe.");
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
                alert("An error occurred while creating the checkout session.");
              }
            } catch (err) {
              console.error("Error creating checkout session:", err);
              alert("An error occurred while processing your subscription.");
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
