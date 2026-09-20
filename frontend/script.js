const API_URL = "http://127.0.0.1:8000";


/* ==================================================
   SEND MESSAGE
================================================== */

async function sendMessage() {

    const input = document.getElementById("message");

    const chatBox = document.getElementById("chat-box");

    const sendButton = document.getElementById("send-button");

    const message = input.value.trim();


    if (!message) {
        return;
    }


    const welcome = document.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }


    addMessage("user", message);


    input.value = "";

    autoResize(input);

    sendButton.disabled = true;


    const loading = addMessage(
        "assistant",
        "Thinking..."
    );


    try {

        const response = await fetch(
            `${API_URL}/chat`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message
                })
            }
        );


        if (!response.ok) {
            throw new Error("Server error");
        }


        const data = await response.json();


        loading.querySelector(
            ".message-content"
        ).textContent = data.response;


    } catch (error) {

        console.error(error);


        loading.querySelector(
            ".message-content"
        ).textContent =
            "❌ Could not connect to Asta. Make sure the backend and Ollama are running.";

    } finally {

        sendButton.disabled = false;

        input.focus();

        scrollToBottom();
    }
}


/* ==================================================
   ADD MESSAGE
================================================== */

function addMessage(type, text) {

    const chatBox =
        document.getElementById("chat-box");


    const message =
        document.createElement("div");


    message.className =
        `message ${type}`;


    message.innerHTML = `
        <div class="message-content">
            ${escapeHTML(text)}
        </div>
    `;


    chatBox.appendChild(message);


    scrollToBottom();


    return message;
}


/* ==================================================
   ESCAPE HTML
================================================== */

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent = text;


    return div.innerHTML;
}


/* ==================================================
   ENTER KEY
================================================== */

function handleKey(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();

    }
}


/* ==================================================
   TEXTAREA AUTO RESIZE
================================================== */

document.addEventListener(
    "input",
    function(event) {

        if (
            event.target.id === "message"
        ) {

            autoResize(event.target);

        }

    }
);


function autoResize(element) {

    element.style.height = "auto";

    element.style.height =
        Math.min(
            element.scrollHeight,
            150
        ) + "px";
}


/* ==================================================
   SCROLL
================================================== */

function scrollToBottom() {

    const chatBox =
        document.getElementById("chat-box");


    chatBox.scrollTop =
        chatBox.scrollHeight;
}


/* ==================================================
   SUGGESTIONS
================================================== */

function useSuggestion(text) {

    const input =
        document.getElementById("message");


    input.value = text;

    autoResize(input);

    input.focus();

    sendMessage();
}


/* ==================================================
   NEW CHAT
================================================== */

async function newChat() {

    try {

        await fetch(
            `${API_URL}/new-chat`,
            {
                method: "POST"
            }
        );

    } catch (error) {

        console.error(error);

    }


    const chatBox =
        document.getElementById("chat-box");


    chatBox.innerHTML = `

        <div class="welcome">

            <div class="asta-logo">
                A
            </div>

            <h1>
                How can I help you?
            </h1>

            <p>
                I'm Asta, your personal AI assistant.
            </p>

            <div class="suggestions">

                <button onclick="useSuggestion('Explain Python from basics')">
                    🐍 Explain Python from basics
                </button>

                <button onclick="useSuggestion('Help me learn DSA')">
                    💻 Help me learn DSA
                </button>

                <button onclick="useSuggestion('Give me a data science project idea')">
                    📊 Data science project
                </button>

                <button onclick="useSuggestion('What can you help me with?')">
                    ✨ What can you do?
                </button>

            </div>

        </div>
    `;
}


/* ==================================================
   SHOW MEMORY
================================================== */

async function showMemory() {

    const modal =
        document.getElementById("memory-modal");


    const list =
        document.getElementById("memory-list");


    modal.classList.remove("hidden");


    list.innerHTML = "Loading...";


    try {

        const response =
            await fetch(
                `${API_URL}/long-term-memory`
            );


        const data =
            await response.json();


        if (
            !data.long_term_memory ||
            data.long_term_memory.length === 0
        ) {

            list.innerHTML =
                "<p>No long-term memories yet.</p>";

            return;
        }


        list.innerHTML =
            data.long_term_memory
                .map(item => `
                    <div class="memory-item">
                        🧠 ${escapeHTML(item.memory)}
                    </div>
                `)
                .join("");


    } catch (error) {

        list.innerHTML =
            "❌ Could not load memory.";

    }
}


/* ==================================================
   CLOSE MEMORY
================================================== */

function closeMemory() {

    document
        .getElementById("memory-modal")
        .classList.add("hidden");
}


/* ==================================================
   CLEAR MEMORY
================================================== */

async function clearMemory() {

    const confirmed =
        confirm(
            "Clear all long-term memories?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await fetch(
            `${API_URL}/clear-memory`,
            {
                method: "DELETE"
            }
        );


        showMemory();


    } catch (error) {

        alert(
            "Could not clear memory."
        );

    }
}


/* ==================================================
   SYSTEM STATUS
================================================== */

async function checkHealth() {

    try {

        const response =
            await fetch(
                `${API_URL}/health`
            );


        const data =
            await response.json();


        if (data.ollama) {

            alert(
                `Asta is online!\n\nModel: ${data.model}\nOllama: Connected`
            );

        } else {

            alert(
                `Asta API is running, but Ollama is not connected.`
            );

        }


    } catch (error) {

        alert(
            "Asta backend is not reachable."
        );

    }
}