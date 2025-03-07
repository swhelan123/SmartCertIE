/**************************************
 * chat.js — typed-out fully formatted HTML
 **************************************/

// --- Example topic context data ---
const topicData = {
  "The Scientific Method": "Context: Review key steps of the scientific method...",
  "The Characteristics of Life": "Context: Cover cellular organization, metabolism...",
  // etc. (unchanged)
};

// Query the AI
async function queryAimlApi(question) {
  const apiUrl = "https://api.aimlapi.com/v1/chat/completions";
  const apiKey = "6f38c7556ee5413694304b0be2c3fa33";

  let systemPrompt = "You are a friendly Leaving Certificate biology tutor named Certi...";
  if (window.selectedTopic && topicData[window.selectedTopic]) {
    systemPrompt += "\n" + topicData[window.selectedTopic];
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
const savedResponses = document.getElementById("savedResponses");

// Single event listener for "Send"
if (sendBtn && chatInput && chatMessages) {
  sendBtn.addEventListener("click", async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    // === 1) Create USER message row
    const userRow = document.createElement("div");
    userRow.classList.add("chat-message", "message-user", "chat-row");

    const userAvatar = document.createElement("img");
    userAvatar.classList.add("chat-avatar");


    userAvatar.src = "assets/img/pfp.avif";
    userAvatar.alt = "User Avatar";

    const userBubble = document.createElement("div");
    userBubble.classList.add("chat-bubble");
    userBubble.textContent = question;

    userRow.appendChild(userBubble);
    userRow.appendChild(userAvatar);
    chatMessages.appendChild(userRow);

    // Clear input
    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // === 2) Create BOT message row
    const botRow = document.createElement("div");
    botRow.classList.add("chat-message", "message-bot", "chat-row");

    const botAvatar = document.createElement("img");
    botAvatar.classList.add("chat-avatar");
    botAvatar.src = "assets/img/certi.png";
    botAvatar.alt = "Bot Avatar";

    const botBubble = document.createElement("div");
    botBubble.classList.add("chat-bubble");

    botRow.appendChild(botAvatar);
    botRow.appendChild(botBubble);
    chatMessages.appendChild(botRow);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    // === 3) Query the AI
    const answer = await queryAimlApi(question);

    // === 4) Type out the final *formatted* HTML
    await typeMarkdownAsHtml(answer, botBubble, 5);

    // === 5) Add a "Save to Notebook" button
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

    // Attach click handler
    saveBtn.addEventListener("click", () => {
      // 5A) Call our global function in script.js
      window.saveNotebookEntry(answer);

      // 5B) (Optional) Also add to the local <ul id="savedResponses">
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

