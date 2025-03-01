// chat.js (hypothetical example)

// 1) The function to query the AI model on aimlapi.com
async function queryAimlApi(question) {
  // Suppose aimlapi.com provides you with a model-specific endpoint & API key
  const apiUrl = "https://aimlapi.com/v3/deepseek"; // EXAMPLE: adjust to real path
  const apiKey = "6f38c7556ee5413694304b0be2c3fa33"; // from your aimlapi.com account

  // The request payload can vary depending on the model's requirements
  const payload = {
    prompt: question,
    // ... any other parameters from aimlapi docs
  };

  try {
    // 2) Make a POST request
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`, // If aimlapi uses Bearer tokens
      },
      body: JSON.stringify(payload),
    });

    // 3) Process the response
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    // 4) Return text from the result – structure depends on the API
    // Example: if the JSON has { answer: "...the AI's text..." }
    return data.answer || "Sorry, I didn't understand that.";
  } catch (error) {
    console.error("aimlapi error:", error);
    return "Error connecting to aimlapi.";
  }
}

// 5) Use the function in your chat event
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const savedResponses = document.getElementById("savedResponses");

if (sendBtn && chatInput && chatMessages) {
  sendBtn.addEventListener("click", async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    // Display user's message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-message message-user";
    userMsg.textContent = question;
    chatMessages.appendChild(userMsg);

    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Placeholder for AI response
    const botMsg = document.createElement("div");
    botMsg.className = "chat-message message-bot";
    botMsg.textContent = "Thinking...";
    chatMessages.appendChild(botMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Query aimlapi with the user’s question
    const answer = await queryAimlApi(question);
    botMsg.textContent = answer;

    // Optionally add a button to save the response
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save to Notebook";
    saveBtn.style.marginLeft = "10px";
    saveBtn.style.padding = "2px 6px";
    saveBtn.style.fontSize = "0.8rem";
    saveBtn.style.cursor = "pointer";
    saveBtn.style.borderRadius = "6px";
    saveBtn.style.border = "none";
    saveBtn.style.backgroundColor = "var(--primary-color)";
    saveBtn.style.color = "#fff";

    saveBtn.addEventListener("click", () => {
      const li = document.createElement("li");
      li.textContent = botMsg.textContent;
      savedResponses.appendChild(li);
      alert("Response saved to notebook!");
    });
    botMsg.appendChild(saveBtn);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  if (chatInput) {
    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent default form submission, if any.
        sendBtn.click();
      }
    });
  }
  
}
