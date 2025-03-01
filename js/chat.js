

/**************************************
 * chat.js — Using AIMLAPI's OpenAI-compatible endpoint
 **************************************/

// 1) The function to query the AIML API with OpenAI-compatible parameters
async function queryAimlApi(question) {
  // Endpoint for AIMLAPI's chat completions (check docs if different)
  const apiUrl = "https://api.aimlapi.com/v1/chat/completions";

  // Insert your AIMLAPI key here
  const apiKey = "22c47683998944ef8ee37f799a1b679e";

  // We can provide a "system" role to set context. Adjust as desired.
  const systemPrompt = "You are an expert Biology tutor for 18-19 year old 5th and 6th ";

  // Construct the chat history with system & user messages
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: question,
    },
  ];

  // The body for the POST request
  const payload = {
    model: "mistralai/Mistral-7B-Instruct-v0.2", // Example model from aimlapi
    messages: messages,
    temperature: 0.7,
    max_tokens: 256,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`, // AIMLAPI typically uses Bearer tokens
      },
      body: JSON.stringify(payload),
    });

    // Check if the response is valid
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    // Parse JSON data from the API
    const data = await response.json();

    /**
     * Based on the OpenAI-like spec, we expect:
     * data.choices[0].message.content
     */
    if (
      data.choices &&
      data.choices.length > 0 &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      return data.choices[0].message.content;
    } else {
      return "Sorry, I didn’t understand that.";
    }
  } catch (error) {
    console.error("aimlapi error:", error);
    return "Error connecting to AIMLAPI.";
  }
}

// 2) Grab DOM elements from your chat interface
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const savedResponses = document.getElementById("savedResponses");

// 3) Setup the event listener for the "Send" button
if (sendBtn && chatInput && chatMessages) {
  sendBtn.addEventListener("click", async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    // Display the user's message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-message message-user";
    userMsg.textContent = question;
    chatMessages.appendChild(userMsg);

    // Clear the input and scroll to bottom
    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Insert a temporary bot message
    const botMsg = document.createElement("div");
    botMsg.className = "chat-message message-bot";
    botMsg.textContent = "Thinking...";
    chatMessages.appendChild(botMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Call AIMLAPI with the user’s question
    const answer = await queryAimlApi(question);
    botMsg.textContent = answer;

    // Add a "Save to Notebook" button to the bot message
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

    // Ensure the chat stays scrolled to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // Optionally, allow pressing Enter to send the message
  if (chatInput) {
    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendBtn.click();
      }
    });
  }
}

