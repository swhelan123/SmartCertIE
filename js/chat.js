/**************************************
 * chat.js — typed-out fully formatted HTML
 **************************************/

const ASK_CERTI_URL =
  "https://us-central1-smartcert-f1965.cloudfunctions.net/askCerti";
const MAX_HISTORY_MESSAGES = 10;

// Conversation history storage
let conversationHistory = [];

// Save conversation history to localStorage
function saveConversationHistory() {
  try {
    const trimmed = conversationHistory.slice(-MAX_HISTORY_MESSAGES);
    localStorage.setItem(
        "smartcert_conversation_history", JSON.stringify(trimmed));
    conversationHistory = trimmed;
  } catch (error) {
    console.warn("Failed to save conversation history:", error);
  }
}

// Add message to conversation history
function addToHistory(role, content) {
  conversationHistory.push({role, content});
  saveConversationHistory();
}

// Clear conversation history
function clearConversationHistory() {
  conversationHistory = [];
  localStorage.removeItem("smartcert_conversation_history");
}

// Clear on page load
clearConversationHistory();

// Query Certi via Cloud Function
async function queryGeminiApi(question) {
  try {
    const response = await fetch(ASK_CERTI_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        question,
        topicId: window.currentTopicId || window.selectedTopic || "",
        conversationHistory: conversationHistory.slice(-MAX_HISTORY_MESSAGES),
      }),
    });

    if (!response.ok) {
      throw new Error(`Function returned status ${response.status}`);
    }

    const data = await response.json();
    const answer = data.answer || "Sorry, I didn't get a response.";
    addToHistory("user", question);
    addToHistory("assistant", answer);
    return answer;
  } catch (error) {
    console.error("askCerti error:", error);
    return "Something went wrong — please try again.";
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
const savedResponses = document.getElementById("savedResponses");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// Clear History button functionality
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear the conversation history? This will remove context from future responses.")) {
      clearConversationHistory();
      
      // Optionally clear the visible chat messages too
      if (confirm("Would you also like to clear the visible chat messages?")) {
        chatMessages.innerHTML = `
          <div class="chat-message message-bot overlay-row">
            <div class="bubble-container">
              <img class="chat-avatar" src="assets/img/certi.png" alt="Bot Avatar" />
              <div class="chat-bubble">
                Hi! I'm Certi, your friendly Leaving Certificate biology tutor. How can I help you today?
                <br><small style="opacity: 0.7; margin-top: 5px; display: block;">Conversation history cleared.</small>
              </div>
            </div>
          </div>
        `;
      }
    }
  });
}

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
    
    // Add error handling for avatar image loading
    userAvatar.onerror = function() {
      this.src = "assets/img/pfp.avif"; // Fallback to default avatar if user image fails to load
    };

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
    const answer = await queryGeminiApi(question);

    // 5) Replace "Thinking..." with typed-out answer
    botBubble.innerHTML = ""; // clear out "Thinking..."

    // === 6) Type out the final *formatted* HTML
    await typeMarkdownAsHtml(answer, botBubble, 5);

    // === 7) Add a "Save to Notebook" button
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save to Notebook";
    Object.assign(saveBtn.style, {
      marginLeft: "10px",
      padding: "2px 6px",
      fontSize: "0.8rem",
      cursor: "pointer",
      borderRadius: "6px",
      border: "none",
      backgroundColor: "var(--primary-color)",
      color: "#fff",
    });

    saveBtn.addEventListener("click", () => {
      window.saveNotebookEntry(answer, question);
    });

    botBubble.appendChild(saveBtn);

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
