// ============================================================
// ASTA AI - FRONTEND
// Complete corrected script.js
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const API_URL = "https://asta-ai-assistant.onrender.com";


// ============================================================
// DOM ELEMENTS
// IMPORTANT:
// These are initialized only after the HTML has loaded.
// ============================================================

let messageInput = null;
let chatContainer = null;
let welcomeScreen = null;


// ============================================================
// INITIALIZE DOM
// ============================================================

function initializeAsta() {

    messageInput =
        document.getElementById("message");

    chatContainer =
        document.getElementById("chat-box");

    welcomeScreen =
        document.getElementById("welcomeScreen");


    console.log("Asta frontend initialized.");

    console.log(
        "Message input:",
        messageInput
    );

    console.log(
        "Chat container:",
        chatContainer
    );

    console.log(
        "Welcome screen:",
        welcomeScreen
    );


    if (!messageInput) {

        console.error(
            "Asta error: #message element not found."
        );

    }


    if (!chatContainer) {

        console.error(
            "Asta error: #chat-box element not found."
        );

    }


    if (!welcomeScreen) {

        console.warn(
            "Asta warning: #welcomeScreen element not found."
        );

    }


    // Input auto resize

    if (messageInput) {

        messageInput.addEventListener(
            "input",
            handleInputResize
        );

    }


    // Check backend

    checkHealth();
}


// ============================================================
// INPUT AUTO RESIZE
// ============================================================

function handleInputResize() {

    if (!this) {
        return;
    }


    this.style.height = "auto";


    this.style.height =
        Math.min(
            this.scrollHeight,
            200
        ) + "px";
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(text) {

    if (text === null || text === undefined) {
        return "";
    }


    const div =
        document.createElement("div");


    div.textContent =
        String(text);


    return div.innerHTML;
}


// ============================================================
// FORMAT ASTA MESSAGE
// ============================================================

function formatMessage(text) {

    if (!text) {
        return "";
    }


    let safeText =
        escapeHtml(text);


    // --------------------------------------------------------
    // Code blocks
    // --------------------------------------------------------

    safeText =
        safeText.replace(
            /```([\s\S]*?)```/g,
            function(match, code) {

                return `
                    <pre class="code-block"><code>${code.trim()}</code></pre>
                `;

            }
        );


    // --------------------------------------------------------
    // Inline code
    // --------------------------------------------------------

    safeText =
        safeText.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


    // --------------------------------------------------------
    // Bold
    // --------------------------------------------------------

    safeText =
        safeText.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    // --------------------------------------------------------
    // Italic
    // --------------------------------------------------------

    safeText =
        safeText.replace(
            /\*(.*?)\*/g,
            "<em>$1</em>"
        );


    // --------------------------------------------------------
    // New lines
    // --------------------------------------------------------

    safeText =
        safeText.replace(
            /\n/g,
            "<br>"
        );


    return safeText;
}


// ============================================================
// ADD MESSAGE
// ============================================================

function addMessage(
    role,
    text
) {

    // Safety check

    if (!chatContainer) {

        chatContainer =
            document.getElementById("chat-box");

    }


    if (!chatContainer) {

        console.error(
            "Asta error: chat container not found."
        );

        return null;
    }


    // --------------------------------------------------------
    // Create unique ID
    // --------------------------------------------------------

    const messageId =
        "message-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8);


    // --------------------------------------------------------
    // Message wrapper
    // --------------------------------------------------------

    const messageDiv =
        document.createElement("div");


    messageDiv.className =
        `message ${role}-message`;


    messageDiv.id =
        messageId;


    // --------------------------------------------------------
    // Avatar
    // --------------------------------------------------------

    const avatar =
        document.createElement("div");


    avatar.className =
        "message-avatar";


    avatar.textContent =
        role === "user"
            ? "You"
            : "A";


    // --------------------------------------------------------
    // Content
    // --------------------------------------------------------

    const content =
        document.createElement("div");


    content.className =
        "message-content";


    // --------------------------------------------------------
    // Name
    // --------------------------------------------------------

    const name =
        document.createElement("div");


    name.className =
        "message-name";


    name.textContent =
        role === "user"
            ? "You"
            : "Asta";


    // --------------------------------------------------------
    // Text
    // --------------------------------------------------------

    const textElement =
        document.createElement("div");


    textElement.className =
        "message-text";


    textElement.innerHTML =
        formatMessage(text);


    // --------------------------------------------------------
    // Build message
    // --------------------------------------------------------

    content.appendChild(
        name
    );


    content.appendChild(
        textElement
    );


    messageDiv.appendChild(
        avatar
    );


    messageDiv.appendChild(
        content
    );


    chatContainer.appendChild(
        messageDiv
    );


    // Scroll

    scrollToBottom();


    return messageId;
}


// ============================================================
// REMOVE MESSAGE
// ============================================================

function removeMessage(
    messageId
) {

    if (!messageId) {
        return;
    }


    const message =
        document.getElementById(
            messageId
        );


    if (message) {

        message.remove();

    }
}


// ============================================================
// SCROLL TO BOTTOM
// ============================================================

function scrollToBottom() {

    if (!chatContainer) {

        chatContainer =
            document.getElementById("chat-box");

    }


    if (!chatContainer) {
        return;
    }


    chatContainer.scrollTop =
        chatContainer.scrollHeight;
}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    // Get DOM elements again if necessary

    if (!messageInput) {

        messageInput =
            document.getElementById("message");

    }


    if (!chatContainer) {

        chatContainer =
            document.getElementById("chat-box");

    }


    // Check input

    if (!messageInput) {

        console.error(
            "Asta error: message input not found."
        );

        return;
    }


    // Get message

    const message =
        messageInput.value.trim();


    // Ignore empty messages

    if (!message) {
        return;
    }


    console.log(
        "User message:",
        message
    );


    // --------------------------------------------------------
    // Add USER message FIRST
    // --------------------------------------------------------

    addMessage(
        "user",
        message
    );


    // --------------------------------------------------------
    // Hide welcome screen
    // --------------------------------------------------------

    if (!welcomeScreen) {

        welcomeScreen =
            document.getElementById(
                "welcomeScreen"
            );

    }


    if (welcomeScreen) {

        welcomeScreen.style.display =
            "none";

    }


    // --------------------------------------------------------
    // Clear input
    // --------------------------------------------------------

    messageInput.value =
        "";


    messageInput.style.height =
        "auto";


    // --------------------------------------------------------
    // Disable send button
    // --------------------------------------------------------

    const sendButton =
        document.getElementById(
            "send-button"
        );


    if (sendButton) {

        sendButton.disabled =
            true;

    }


    // --------------------------------------------------------
    // Thinking message
    // --------------------------------------------------------

    const thinkingId =
        addMessage(
            "assistant",
            "Asta is thinking..."
        );


    try {

        console.log(
            "Sending request to:",
            `${API_URL}/chat`
        );


        // ----------------------------------------------------
        // API request
        // ----------------------------------------------------

        const response =
            await fetch(
                `${API_URL}/chat`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message:
                                message
                        })
                }
            );


        console.log(
            "Server response status:",
            response.status
        );


        // ----------------------------------------------------
        // Check HTTP status
        // ----------------------------------------------------

        if (!response.ok) {

            let errorText = "";

            try {

                errorText =
                    await response.text();

            } catch (error) {

                errorText =
                    "Unknown server error.";

            }


            throw new Error(
                `Server error ${response.status}: ${errorText}`
            );

        }


        // ----------------------------------------------------
        // Read JSON
        // ----------------------------------------------------

        const data =
            await response.json();


        console.log(
            "Asta response:",
            data
        );


        // ----------------------------------------------------
        // Remove thinking
        // ----------------------------------------------------

        removeMessage(
            thinkingId
        );


        // ----------------------------------------------------
        // Show Asta response
        // ----------------------------------------------------

        addMessage(
            "assistant",
            data.response ||
                "I couldn't generate a response."
        );


    } catch (error) {

        console.error(
            "Chat error:",
            error
        );


        // Remove thinking message

        removeMessage(
            thinkingId
        );


        // Show error

        addMessage(
            "assistant",
            "I couldn't connect to Asta. Please check that the Asta server is online and try again."
        );

    }


    // Enable send button

    if (sendButton) {

        sendButton.disabled =
            false;

    }


    // Scroll

    scrollToBottom();
}


// ============================================================
// ENTER KEY
// ============================================================

function handleKey(event) {

    if (!event) {
        return true;
    }


    // Enter without Shift = Send

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();


        sendMessage();


        return false;
    }


    // Shift + Enter = New line

    return true;
}


// ============================================================
// SUGGESTION BUTTONS
// ============================================================

function useSuggestion(
    text
) {

    if (!messageInput) {

        messageInput =
            document.getElementById(
                "message"
            );

    }


    if (!messageInput) {
        return;
    }


    messageInput.value =
        text;


    messageInput.focus();


    messageInput.dispatchEvent(
        new Event(
            "input"
        )
    );
}


// ============================================================
// NEW CHAT
// ============================================================

async function newChat() {

    try {

        const response =
            await fetch(
                `${API_URL}/new-chat`,
                {
                    method: "POST"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to start new chat"
            );

        }


        // ----------------------------------------------------
        // Clear messages
        // ----------------------------------------------------

        if (!chatContainer) {

            chatContainer =
                document.getElementById(
                    "chat-box"
                );

        }


        if (chatContainer) {

            const messages =
                chatContainer.querySelectorAll(
                    ".message"
                );


            messages.forEach(
                message =>
                    message.remove()
            );

        }


        // ----------------------------------------------------
        // Show welcome
        // ----------------------------------------------------

        if (!welcomeScreen) {

            welcomeScreen =
                document.getElementById(
                    "welcomeScreen"
                );

        }


        if (welcomeScreen) {

            welcomeScreen.style.display =
                "";

        }


        // ----------------------------------------------------
        // Clear input
        // ----------------------------------------------------

        if (!messageInput) {

            messageInput =
                document.getElementById(
                    "message"
                );

        }


        if (messageInput) {

            messageInput.value =
                "";

            messageInput.style.height =
                "auto";

        }


        console.log(
            "New chat started."
        );


    } catch (error) {

        console.error(
            "New chat error:",
            error
        );


        alert(
            "Could not start a new chat."
        );

    }
}


// ============================================================
// SHOW MEMORY
// ============================================================

async function showMemory() {

    const modal =
        document.getElementById(
            "memory-modal"
        );


    const memoryList =
        document.getElementById(
            "memory-list"
        );


    if (!modal || !memoryList) {

        console.error(
            "Memory elements not found."
        );

        return;
    }


    // Show modal

    modal.classList.remove(
        "hidden"
    );


    modal.style.display =
        "flex";


    memoryList.innerHTML =
        "<p>Loading memories...</p>";


    try {

        const response =
            await fetch(
                `${API_URL}/long-term-memory`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load memories"
            );

        }


        const data =
            await response.json();


        const memories =
            data.long_term_memory ||
            [];


        // ----------------------------------------------------
        // No memories
        // ----------------------------------------------------

        if (
            memories.length === 0
        ) {

            memoryList.innerHTML =
                "<p>Asta has no saved memories yet.</p>";

            return;
        }


        // ----------------------------------------------------
        // Display memories
        // ----------------------------------------------------

        memoryList.innerHTML =
            "";


        memories.forEach(
            memory => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "memory-item";


                item.innerHTML = `
                    <div class="memory-text">
                        ${escapeHtml(
                            memory.memory
                        )}
                    </div>

                    <div class="memory-date">
                        ${escapeHtml(
                            memory.created_at || ""
                        )}
                    </div>
                `;


                memoryList.appendChild(
                    item
                );

            }
        );


    } catch (error) {

        console.error(
            "Memory error:",
            error
        );


        memoryList.innerHTML =
            "<p>Could not load memories.</p>";

    }
}


// ============================================================
// CLOSE MEMORY
// ============================================================

function closeMemory() {

    const modal =
        document.getElementById(
            "memory-modal"
        );


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    modal.style.display =
        "none";
}


// ============================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ============================================================

window.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById(
                "memory-modal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeMemory();

        }

    }
);


// ============================================================
// CLEAR MEMORY
// ============================================================

async function clearMemory() {

    const confirmed =
        confirm(
            "Are you sure you want to clear Asta's long-term memory?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/clear-memory`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to clear memory"
            );

        }


        await showMemory();


        alert(
            "Asta's long-term memory has been cleared."
        );


    } catch (error) {

        console.error(
            "Clear memory error:",
            error
        );


        alert(
            "Could not clear memory."
        );

    }
}


// ============================================================
// HEALTH CHECK
// ============================================================

async function checkHealth() {

    const statusElement =
        document.getElementById(
            "systemStatus"
        );


    try {

        const response =
            await fetch(
                `${API_URL}/health`
            );


        if (!response.ok) {

            throw new Error(
                "Health check failed"
            );

        }


        const data =
            await response.json();


        if (
            data.gemini_configured
        ) {

            if (statusElement) {

                statusElement.textContent =
                    "● Online";

            }


            return true;
        }


        if (statusElement) {

            statusElement.textContent =
                "● AI configuration incomplete";

        }


        return false;


    } catch (error) {

        console.error(
            "Health check error:",
            error
        );


        if (statusElement) {

            statusElement.textContent =
                "● Offline";

        }


        return false;
    }
}


// ============================================================
// SYSTEM STATUS
// ============================================================

async function showSystemStatus() {

    try {

        const response =
            await fetch(
                `${API_URL}/health`
            );


        if (!response.ok) {

            throw new Error(
                "Health check failed"
            );

        }


        const data =
            await response.json();


        let message = "";


        // API

        message +=
            data.api === "online"
                ? "API: 🟢 Online\n"
                : "API: 🔴 Offline\n";


        // Gemini

        message +=
            data.gemini_configured
                ? "Gemini: 🟢 Connected\n"
                : "Gemini: 🔴 Not configured\n";


        // Model

        message +=
            `Model: ${data.model}`;


        alert(
            message
        );


    } catch (error) {

        console.error(
            "System status error:",
            error
        );


        alert(
            "Unable to connect to Asta."
        );

    }
}


// ============================================================
// INITIALIZE AFTER HTML LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "Asta frontend loaded successfully."
        );


        initializeAsta();

    }
);