/**************************************
 * chat.js — typed-out fully formatted HTML
 **************************************/

// Import Firestore functions and db instance from script.js
// Note: script.js must export 'db', and firebase/firestore functions like 'doc' and 'getDoc'
// For this to work, script.js should have: export const db = getFirestore(app);
// And you might need to adjust the import path if script.js is not in the same directory or if it's not a module.
// Assuming script.js exports db and firebase functions are available globally or via script.js
import { db } from './script.js'; // Make sure script.js exports db
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";


// Query the AI
async function queryAimlApi(question) {
  const apiUrl = "https://api.aimlapi.com/v1/chat/completions";
  const apiKey = "6f38c7556ee5413694304b0be2c3fa33"; // Consider moving API keys to a more secure location

  let systemPrompt = "You are a friendly Leaving Certificate biology tutor named Certi...";

  // Fetch context from Firestore if a topicId is selected
  if (window.currentTopicId) {
    try {
      const topicDocRef = doc(db, "biology_context", window.currentTopicId);
      const topicSnap = await getDoc(topicDocRef);

      if (topicSnap.exists()) {
        const firestoreContext = topicSnap.data().context; // Using 'context' field
        if (firestoreContext) {
          systemPrompt += "\nContext: " + firestoreContext;
        }
      } else {
        console.log("No context document found for topicId:", window.currentTopicId);
      }
    } catch (error) {
      console.error("Error fetching topic context from Firestore:", error);
      // Decide if you want to inform the user or proceed without context
    }
  }

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ];

  const payload = {
    model: "mistralai/Mistral-7B-Instruct-v0.2",
    messages: messages,
    temperature: 0.7,
    max_tokens: 512,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    } else {
      return "Sorry, I didn't understand that.";
    }
  } catch (error) {
    console.error("oh no! aimlapi error:", error);
    return "Daily credits are all gone!";
  }
}

/**
 * Recursively types out the sourceNode's DOM structure into targetNode,
 * preserving all formatting (bold, lists, code, etc.) as they appear.
 */
async function typeHtml(sourceNode, targetNode, speed = 20) {
  for (const child of sourceNode.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent;
      for (let i = 0; i < text.length; i++) {
        targetNode.append(text.charAt(i));
        await new Promise((r) => setTimeout(r, speed));
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const newEl = document.createElement(child.tagName);
      for (const attr of child.attributes) {
        newEl.setAttribute(attr.name, attr.value);
      }
      targetNode.appendChild(newEl);
      await typeHtml(child, newEl, speed);
    }
  }
}

// Helper to create a typed effect of the final rendered HTML
async function typeMarkdownAsHtml(markdownString, container, speed = 20) {
  const htmlString = marked.parse(markdownString);
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;

  container.innerHTML = ""; // clear
  await typeHtml(tempDiv, container, speed);
}

// Grab DOM references
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

// Single event listener for "Send"
if (sendBtn && chatInput && chatMessages) {
  sendBtn.addEventListener("click", async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    // === 1) Create USER message row using overlay-row structure
    const userRow = document.createElement("div");
    userRow.classList.add("chat-message", "message-user", "overlay-row");

    const userBubbleContainer = document.createElement("div");
    userBubbleContainer.classList.add("bubble-container");

    const userAvatar = document.createElement("img");
    userAvatar.classList.add("chat-avatar");
    // Use the global profile image URL (fallback if not set)
    userAvatar.src = window.userAvatarUrl || "assets/img/pfp.avif";
    userAvatar.alt = "User Avatar";

    const userBubble = document.createElement("div");
    userBubble.classList.add("chat-bubble");
    userBubble.textContent = question;

    userBubbleContainer.appendChild(userAvatar);
    userBubbleContainer.appendChild(userBubble);
    userRow.appendChild(userBubbleContainer);
    chatMessages.appendChild(userRow);

    // Clear input
    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 2) Create the BOT message row
    const botRow = document.createElement("div");
    botRow.classList.add("chat-message", "message-bot", "overlay-row");

    const botBubbleContainer = document.createElement("div");
    botBubbleContainer.classList.add("bubble-container");

    const botAvatar = document.createElement("img");
    botAvatar.classList.add("chat-avatar");
    botAvatar.src = "assets/img/certi.png";
    botAvatar.alt = "Bot Avatar";

    const botBubble = document.createElement("div");
    botBubble.classList.add("chat-bubble");

    // 3) Set placeholder text so user sees "Thinking..."
    botBubble.textContent = "Thinking...";

    botBubbleContainer.appendChild(botAvatar);
    botBubbleContainer.appendChild(botBubble);
    botRow.appendChild(botBubbleContainer);
    chatMessages.appendChild(botRow);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 4) Query the AI
    const answer = await queryAimlApi(question);

    // 5) Replace "Thinking..." with typed-out answer
    botBubble.innerHTML = ""; // clear out "Thinking..."

    // === 6) Type out the final *formatted* HTML
    await typeMarkdownAsHtml(answer, botBubble, 5);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // Press Enter to send
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendBtn.click();
    }
  });
}
