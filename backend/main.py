from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests
import sqlite3
import json
import os


# ============================================================
# CONFIGURATION
# ============================================================

DATABASE = "backend/memory.db"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash"

MAX_RECENT_MESSAGES = 12
MAX_MEMORIES = 50


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="Asta AI",
    description="Asta - Personal AI Assistant",
    version="2.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ASTA PERSONALITY
# ============================================================

ASTA_SYSTEM_PROMPT = """
You are Asta, a personal AI assistant.

Your name is Asta.

You are intelligent, friendly, helpful, natural and conversational.

Never claim to be Qwen, Alibaba Cloud, or another AI assistant unless
the user specifically asks about the underlying model.

Your main areas of expertise include:

- Programming
- Java
- Python
- Data Science
- SQL
- Machine Learning
- DSA
- Projects
- Research
- Mathematics
- Learning
- Career development

Use saved user memories when they are relevant.

Do not mention the memory system unless the user asks about it.

When explaining programming:

1. Explain the logic first.
2. Give the solution.
3. Explain important parts of the code.
4. Give time and space complexity when useful.

For simple questions, be concise.

For detailed questions, provide detailed explanations.

Be honest when you do not know something.

Do not unnecessarily repeat the user's question.

The user is interacting with their personal assistant named Asta.
"""


# ============================================================
# REQUEST MODELS
# ============================================================

class ChatRequest(BaseModel):
    message: str


class MemoryRequest(BaseModel):
    memory: str


# ============================================================
# DATABASE
# ============================================================

def get_connection():
    return sqlite3.connect(DATABASE)


def init_database():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            memory TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


# ============================================================
# SAVE CONVERSATION
# ============================================================

def save_message(role, message):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO conversations (role, message)
        VALUES (?, ?)
        """,
        (role, message)
    )

    connection.commit()
    connection.close()


# ============================================================
# GET RECENT CONVERSATION
# ============================================================

def get_recent_messages(limit=MAX_RECENT_MESSAGES):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT role, message
        FROM conversations
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,)
    )

    rows = cursor.fetchall()

    connection.close()

    return list(reversed(rows))


# ============================================================
# LONG-TERM MEMORY
# ============================================================

def save_memory(memory):

    memory = memory.strip()

    if not memory:
        return

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT OR IGNORE INTO memories (memory)
        VALUES (?)
        """,
        (memory,)
    )

    connection.commit()
    connection.close()


def get_memories():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT id, memory, created_at
        FROM memories
        ORDER BY id DESC
        LIMIT ?
        """,
        (MAX_MEMORIES,)
    )

    rows = cursor.fetchall()

    connection.close()

    return rows


# ============================================================
# GEMINI API
# ============================================================

def call_gemini(prompt):

    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY is not configured")

    url = (
        f"https://generativelanguage.googleapis.com/"
        f"v1beta/models/{GEMINI_MODEL}:generateContent"
    )

    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }

    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=180
    )

    response.raise_for_status()

    data = response.json()

    try:

        return (
            data["candidates"][0]
            ["content"]["parts"][0]["text"]
            .strip()
        )

    except (KeyError, IndexError):

        print("Gemini response:", data)

        return "I couldn't generate a response."


# ============================================================
# AUTOMATIC MEMORY EXTRACTION
# ============================================================

def extract_memory(user_message):

    if not GEMINI_API_KEY:
        return

    prompt = f"""
You are a long-term memory extraction system.

Analyze this user message.

Save only useful, non-sensitive facts that may help a personal
AI assistant understand the user in future conversations.

Examples:

- Name
- College
- Education
- Programming skills
- Career goals
- Projects
- Long-term learning goals
- Non-sensitive preferences

Do NOT save:

- Normal questions
- Greetings
- Temporary requests
- One-time tasks
- General knowledge
- Passwords
- Financial information
- Health information
- Highly personal or sensitive information

Return ONLY valid JSON.

If useful information exists:

{{
    "remember": true,
    "memory": "short factual statement"
}}

Otherwise:

{{
    "remember": false,
    "memory": ""
}}

USER MESSAGE:

{user_message}
"""

    try:

        url = (
            f"https://generativelanguage.googleapis.com/"
            f"v1beta/models/{GEMINI_MODEL}:generateContent"
        )

        response = requests.post(
            url,
            headers={
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json"
            },
            json={
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            },
            timeout=120
        )

        response.raise_for_status()

        data = response.json()

        raw_result = (
            data["candidates"][0]
            ["content"]["parts"][0]["text"]
        )

        result = json.loads(raw_result)

        if result.get("remember") is True:

            memory = result.get("memory", "").strip()

            if memory:
                save_memory(memory)

    except Exception as error:

        print("Memory extraction skipped:", error)


# ============================================================
# BUILD ASTA PROMPT
# ============================================================

def build_prompt():

    memories = get_memories()

    recent_messages = get_recent_messages()

    prompt = ASTA_SYSTEM_PROMPT + "\n\n"

    if memories:

        prompt += "IMPORTANT USER INFORMATION:\n"

        for _, memory, _ in reversed(memories):

            prompt += f"- {memory}\n"

        prompt += "\n"

    prompt += "RECENT CONVERSATION:\n"

    for role, message in recent_messages:

        prompt += f"{role.upper()}: {message}\n"

    prompt += "\nASTA:"

    return prompt


# ============================================================
# INITIALIZE DATABASE
# ============================================================

init_database()


# ============================================================
# FRONTEND
# ============================================================

@app.get("/", include_in_schema=False)
def home():

    return FileResponse(
        "frontend/index.html"
    )


@app.get("/style.css", include_in_schema=False)
def style():

    return FileResponse(
        "frontend/style.css",
        media_type="text/css"
    )


@app.get("/script.js", include_in_schema=False)
def script():

    return FileResponse(
        "frontend/script.js",
        media_type="application/javascript"
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "api": "online",
        "gemini_configured": bool(GEMINI_API_KEY),
        "model": GEMINI_MODEL
    }


# ============================================================
# CHAT
# ============================================================

@app.post("/chat")
def chat(request: ChatRequest):

    message = request.message.strip()

    if not message:

        return {
            "response": "Please enter a message."
        }

    # Save user message

    save_message(
        "user",
        message
    )

    # Extract long-term memory

    extract_memory(message)

    try:

        # Build complete prompt

        prompt = build_prompt()

        # Ask Gemini

        assistant_response = call_gemini(prompt)

    except requests.exceptions.ConnectionError:

        assistant_response = (
            "❌ I cannot connect to the Gemini API."
        )

    except requests.exceptions.Timeout:

        assistant_response = (
            "⏳ Gemini took too long to respond. "
            "Please try again."
        )

    except requests.exceptions.HTTPError as error:

        print("Gemini HTTP error:", error)

        assistant_response = (
            "❌ Gemini API error. "
            "Please check your API key and API limits."
        )

    except Exception as error:

        print("Chat error:", error)

        assistant_response = (
            "❌ Something went wrong while generating "
            "the response."
        )

    # Save assistant response

    save_message(
        "assistant",
        assistant_response
    )

    return {
        "response": assistant_response
    }


# ============================================================
# VIEW CONVERSATION HISTORY
# ============================================================

@app.get("/memory")
def view_memory():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT id, role, message, created_at
        FROM conversations
        ORDER BY id
        """
    )

    rows = cursor.fetchall()

    connection.close()

    return {
        "conversation_history": rows
    }


# ============================================================
# VIEW LONG-TERM MEMORY
# ============================================================

@app.get("/long-term-memory")
def view_long_term_memory():

    rows = get_memories()

    return {
        "long_term_memory": [
            {
                "id": row[0],
                "memory": row[1],
                "created_at": row[2]
            }
            for row in rows
        ]
    }


# ============================================================
# MANUALLY SAVE MEMORY
# ============================================================

@app.post("/remember")
def remember(request: MemoryRequest):

    save_memory(
        request.memory
    )

    return {
        "message": "Memory saved.",
        "memory": request.memory
    }


# ============================================================
# CLEAR CONVERSATION
# ============================================================

@app.post("/new-chat")
def new_chat():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM conversations"
    )

    connection.commit()
    connection.close()

    return {
        "message": "New conversation started."
    }


# ============================================================
# CLEAR LONG-TERM MEMORY
# ============================================================

@app.delete("/clear-memory")
def clear_memory():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM memories"
    )

    connection.commit()
    connection.close()

    return {
        "message": "Long-term memory cleared."
    }