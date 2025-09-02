/**************************************
 * chat.js — typed-out fully formatted HTML
 **************************************/

// Import configuration
import { geminiConfig, appConfig } from './config.js';

// Conversation history storage
let conversationHistory = [];

// Load conversation history from localStorage on page load
function loadConversationHistory() {
  try {
    const saved = localStorage.getItem('smartcert_conversation_history');
    if (saved) {
      conversationHistory = JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load conversation history:', error);
    conversationHistory = [];
  }
}

// Save conversation history to localStorage
function saveConversationHistory() {
  try {
    // Keep only the last maxHistoryMessages to prevent localStorage bloat
    const trimmed = conversationHistory.slice(-appConfig.maxHistoryMessages);
    localStorage.setItem('smartcert_conversation_history', JSON.stringify(trimmed));
    conversationHistory = trimmed;
  } catch (error) {
    console.warn('Failed to save conversation history:', error);
  }
}

// Add message to conversation history
function addToHistory(role, content) {
  conversationHistory.push({ role, content });
  saveConversationHistory();
}

// Clear conversation history
function clearConversationHistory() {
  conversationHistory = [];
  localStorage.removeItem('smartcert_conversation_history');
}

// Initialize conversation history on page load
loadConversationHistory();

// --- Example topic context data ---
const topicData = {
  "The Scientific Method": "Context: Review key steps of the scientific method, including hypothesis formulation, experimentation, and analysis.",
   "The Characteristics of Life": "Context: Cover cellular organization, metabolism, growth, reproduction, and homeostasis in living organisms.",
   "Nutrition": "Context: Focus on the role of nutrients, digestion, absorption, and the importance of a balanced diet.",
   "General Principles of Ecology": "Context: Emphasize ecosystems, energy flow, nutrient cycling, and population dynamics.",
   "A Study of an Ecosystem": "Context: Consider real-life case studies of ecosystems, interactions among species, and environmental factors.",
   "Cell Structure": "Context: Dive into the details of organelles, membrane structures, and the differences between prokaryotic and eukaryotic cells.",
   "Cell Metabolism": "Context: Review key metabolic pathways, enzyme activity, and energy production within cells.",
   "Cell Continuity": "Context: Explore cell cycle regulation, mitosis, meiosis, and mechanisms that ensure continuity of life.",
   "Cell Diversity": "Context: Understand the variety of cell types and their specialized functions within an organism.",
   "Genetics": "Context: Cover DNA structure, replication, gene expression, and basic genetic inheritance patterns.",
   "Diversity of Organisms": "Context: Examine the classification, evolution, and diversity of life forms on Earth.",
   "Organisation and the Vascular Structures": "Context: Focus on how organisms are organized, including tissue types and the role of vascular systems.",
   "Transport and Nutrition": "Context: Explain mechanisms for nutrient and gas transport in organisms.",
   "Breathing System and Excretion": "Context: Detail the processes of respiration and excretion, and how organisms maintain internal balance.",
   "Responses to Stimuli": "Context: Review the ways organisms detect and respond to environmental changes.",
   "Reproduction and Growth": "Context: Discuss sexual and asexual reproduction, developmental biology, and growth processes."
};

// Query the Google Gemini AI
async function queryGeminiApi(question) {
  // Check if API key is configured
  if (!geminiConfig.apiKey || geminiConfig.apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return "Please configure your Google Gemini API key in the config.js file. You can get one from https://makersuite.google.com/app/apikey";
  }

  // Build system prompt with topic context
  let systemPrompt = appConfig.systemPrompt;
  if (window.selectedTopic && topicData[window.selectedTopic]) {
    systemPrompt += "\n\n" + topicData[window.selectedTopic];
  }

  // Add conversation context if available
  let contextPrompt = systemPrompt;
  if (conversationHistory.length > 0) {
    contextPrompt += "\n\nPrevious conversation context:";
    // Include recent conversation history for context
    const recentHistory = conversationHistory.slice(-appConfig.maxHistoryMessages);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        contextPrompt += `\nStudent: ${msg.content}`;
      } else if (msg.role === 'assistant') {
        contextPrompt += `\nCerti: ${msg.content.substring(0, 200)}...`; // Truncate long responses
      }
    });
    contextPrompt += "\n\nPlease continue the conversation naturally, building on the previous context.";
  }

  // Combine context and current question for Gemini
  const fullPrompt = `${contextPrompt}\n\nCurrent Student Question: ${question}\n\nPlease provide a helpful, clear, and encouraging response:`;

  // Gemini API payload format
  const payload = {
    contents: [
      {
        parts: [
          {
            text: fullPrompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: appConfig.temperature,
      maxOutputTokens: appConfig.maxTokens,
      topP: 0.8,
      topK: 10
    }
  };

  try {
    const response = await fetch(`${geminiConfig.apiUrl}?key=${geminiConfig.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API returned status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const answer = data.candidates[0].content.parts[0].text;
      
      // Add both question and answer to conversation history
      addToHistory('user', question);
      addToHistory('assistant', answer);
      
      return answer;
    } else {
      console.warn("Unexpected Gemini API response format:", data);
      return "I'm having trouble processing your question right now. Please try again.";
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    if (error.message.includes("API_KEY_INVALID")) {
      return "Invalid API key. Please check your Gemini API key configuration.";
    } else if (error.message.includes("QUOTA_EXCEEDED")) {
      return "API quota exceeded. Please check your Gemini API usage limits.";
    } else {
      return "I'm experiencing technical difficulties. Please try again in a moment.";
    }
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
      const li = document.createElement("li");
      li.textContent = answer;
      savedResponses.appendChild(li);
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
