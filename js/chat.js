/**************************************
 * chat.js — Using AIMLAPI's OpenAI-compatible endpoint
 **************************************/

// --- NEW: Define topic-specific context data ---
const topicData = {
  "The Scientific Method": "Context: Review key steps of the scientific method, including hypothesis formulation, experimentation, and analysis.",
  "The Characteristics of Life": "Context: Cover cellular organization, metabolism, growth, reproduction, and homeostasis in living organisms.",
  "Nutrition t": "Context: Focus on the role of nutrients, digestion, absorption, and the importance of a balanced diet.",
  "General Principles of Ecology": "Context: Emphasize ecosystems, energy flow, nutrient cycling, and population dynamics.",
  "A Study of an Ecosystem": "Context: Consider real-life case studies of ecosystems, interactions among species, and environmental factors.",
  "Cell Structure": "Context: Dive into the details of organelles, membrane structures, and the differences between prokaryotic and eukaryotic cells.",
  "Cell Metabolism": "Context: Review key metabolic pathways, enzyme activity, and energy production within cells.",
  "Cell Continuity": "Context: Explore cell cycle regulation, mitosis, meiosis, and mechanisms that ensure continuity of life.",
  "Cell Diversity": "Context: Understand the variety of cell types and their specialized functions within an organism.",
  "Genetics t": "Context: Cover DNA structure, replication, gene expression, and basic genetic inheritance patterns.",
  "Diversity of Organisms": "Context: Examine the classification, evolution, and diversity of life forms on Earth.",
  "Organisation and the Vascular Structures": "Context: Focus on how organisms are organized, including tissue types and the role of vascular systems.",
  "Transport and Nutrition": "Context: Explain mechanisms for nutrient and gas transport in organisms.",
  "Breathing System and Excretion": "Context: Detail the processes of respiration and excretion, and how organisms maintain internal balance.",
  "Responses to Stimuli": "Context: Review the ways organisms detect and respond to environmental changes.",
  "Reproduction and Growth": "Context: Discuss sexual and asexual reproduction, developmental biology, and growth processes.",
};



// 1) The function to query the AIML API with OpenAI-compatible parameters
async function queryAimlApi(question) {
  // Endpoint for AIMLAPI's chat completions (check docs if different)
  const apiUrl = "https://api.aimlapi.com/v1/chat/completions";

  // Insert your AIMLAPI key here
  const apiKey = "ec80265da47e451d9bcf1e90653853a4";

  // Base system prompt
  let systemPrompt = "You are leaving cert biology tutor";

  // --- NEW: Append topic context if a topic is selected ---
  if (window.selectedTopic && topicData[window.selectedTopic]) {
    systemPrompt += "\n\n" + topicData[window.selectedTopic];
  }

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

  console.log("Full prompt being sent to AIML API:", systemPrompt);
  console.log("Full messages payload:", messages);

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
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      return "Sorry, I didn’t understand that.";
    }
  } catch (error) {
    console.error("aimlapi error:", error);
    return "Daily credits are all gone!";
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

    // Call AIMLAPI with the user’s question. The system prompt now includes topic context if available.
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

  // Allow pressing Enter to send the message
  if (chatInput) {
    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendBtn.click();
      }
    });
  }
}
