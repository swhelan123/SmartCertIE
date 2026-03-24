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

// Don't auto-clear on page load — sessions handle state now

// Expose functions for script.js session integration
window.setConversationHistory = function (messages) {
  conversationHistory = messages.slice();
};

window.clearConversationHistoryFn = function () {
  clearConversationHistory();
};

window.displaySessionMessages = function (messages) {
  const chatMsgs = document.getElementById("chatMessages");
  if (!chatMsgs) return;

  chatMsgs.innerHTML = "";

  messages.forEach((msg) => {
    if (msg.role === "user") {
      const userRow = document.createElement("div");
      userRow.classList.add("chat-message", "message-user", "overlay-row");
      const userBubbleContainer = document.createElement("div");
      userBubbleContainer.classList.add("bubble-container");
      const userAvatar = document.createElement("img");
      userAvatar.classList.add("chat-avatar");
      userAvatar.src = window.userAvatarUrl || "assets/img/pfp.avif";
      userAvatar.alt = "User Avatar";
      userAvatar.onerror = function () { this.src = "assets/img/pfp.avif"; };
      const userBubble = document.createElement("div");
      userBubble.classList.add("chat-bubble");
      userBubble.textContent = msg.content;
      userBubbleContainer.appendChild(userAvatar);
      userBubbleContainer.appendChild(userBubble);
      userRow.appendChild(userBubbleContainer);
      chatMsgs.appendChild(userRow);
    } else {
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
      if (typeof marked !== "undefined") {
        botBubble.innerHTML = marked.parse(msg.content);
      } else {
        botBubble.textContent = msg.content;
      }

      // Add "Save to Notebook" button
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
      // Find the matching user question (previous message)
      const msgIndex = messages.indexOf(msg);
      const prevMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
      const question = prevMsg && prevMsg.role === "user" ? prevMsg.content : "";
      saveBtn.addEventListener("click", () => {
        window.saveNotebookEntry(msg.content, question);
      });
      botBubble.appendChild(saveBtn);

      botBubbleContainer.appendChild(botAvatar);
      botBubbleContainer.appendChild(botBubble);
      botRow.appendChild(botBubbleContainer);
      chatMsgs.appendChild(botRow);
    }
  });

  chatMsgs.scrollTop = chatMsgs.scrollHeight;
};

// Stream Certi response via Cloud Function SSE
async function streamGeminiApi(question, botBubble) {
  try {
    const {getAuth} = await import(
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
    );
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return "You must be logged in to use the chat.";
    }
    const idToken = await user.getIdToken();

    const response = await fetch(ASK_CERTI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        question,
        topicId: window.currentTopicId || window.selectedTopic || "",
        conversationHistory: conversationHistory.slice(-MAX_HISTORY_MESSAGES),
      }),
    });

    if (!response.ok) {
      throw new Error(`Function returned status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = "";
    let buffer = "";

    botBubble.innerHTML = "";

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, {stream: true});
      const lines = buffer.split("\n");
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") break;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) {
            fullAnswer = "Something went wrong — please try again.";
            botBubble.innerHTML = marked.parse(fullAnswer);
            return fullAnswer;
          }
          if (parsed.text) {
            fullAnswer += parsed.text;
            botBubble.innerHTML = marked.parse(fullAnswer);
            const chatMsgs = document.getElementById("chatMessages");
            if (chatMsgs) chatMsgs.scrollTop = chatMsgs.scrollHeight;
          }
        } catch (e) {
          // skip malformed lines
        }
      }
    }

    const answer = fullAnswer || "Sorry, I didn't get a response.";
    addToHistory("user", question);
    addToHistory("assistant", answer);
    return answer;
  } catch (error) {
    console.error("askCerti error:", error);
    const errMsg = "Something went wrong — please try again.";
    botBubble.innerHTML = marked.parse(errMsg);
    return errMsg;
  }
}

// Grab DOM references
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// New Chat button functionality (was Clear History)
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    if (typeof window.startNewChat === "function") {
      window.startNewChat();
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

    // 4) Stream the AI response directly into the bubble
    const answer = await streamGeminiApi(question, botBubble);

    // 5) Add a "Save to Notebook" button
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

    // Save to chat session
    try {
      if (window.currentSessionId) {
        // Append to existing session
        window.currentSessionMessages.push(
          { role: "user", content: question },
          { role: "assistant", content: answer }
        );
        window.saveSessionMessages(window.currentSessionMessages);
      } else if (typeof window.createChatSession === "function") {
        // Create new session with first question as title
        await window.createChatSession(question);
        window.currentSessionMessages = [
          { role: "user", content: question },
          { role: "assistant", content: answer },
        ];
        window.saveSessionMessages(window.currentSessionMessages);
      }
    } catch (err) {
      console.error("Error saving to chat session:", err);
    }
  });

  // Press Enter to send
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendBtn.click();
    }
  });
}
