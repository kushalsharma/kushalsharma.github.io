---
layout: post
title: Mume Gateway API Documentation
date: '2025-11-29'
cover_image: /content/images/hello_world.jpg
---

# 🚀 Mume Gateway API Documentation

> **Your unified gateway to the world's most powerful AI models**

Mume Gateway provides a single, elegant API to access AI from OpenAI, Anthropic, Google, Mistral, and more — all through the familiar OpenAI SDK interface you already know and love.

---

## 📑 Table of Contents

- [🎯 Getting Started](#-getting-started)
- [💬 Chat Completions](#-chat-completions)
- [⚡ Responses API](#-responses-api)
- [🌊 Streaming](#-streaming)
- [🔧 Function Calling / Tools](#-function-calling--tools)
- [🌐 Web Search](#-web-search)
- [🤖 Available Models](#-available-models)
- [⚠️ Error Handling](#️-error-handling)
- [🔑 Generating an API Key](#-generating-an-api-key)
- [💡 Support](#-support)

---

## 🎯 Getting Started

### Installation

Get up and running in seconds with your preferred language:

#### Python

```bash
pip install openai
```

#### JavaScript/Node.js

```bash
npm install openai
```

---

### Configuration

Point the OpenAI SDK to Mume Gateway by setting the base URL to `https://mume.ai/api/v1`. That's it!

#### cURL

```bash
# Set your API key as an environment variable
export MUME_API_KEY="your-api-key"

# All requests should use the base URL: https://mume.ai/api/v1
```

#### Python

```python
import openai

# Synchronous client
client = openai.OpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)

# Asynchronous client
async_client = openai.AsyncOpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)
```

#### JavaScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'your-api-key',
    baseURL: 'https://mume.ai/api/v1',
});
```

---

## 💬 Chat Completions

The Chat Completions API is the standard endpoint for conversational AI interactions. It supports multi-turn conversations, system prompts, and all the features you'd expect.

### Basic Request

#### cURL

```bash
curl https://mume.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MUME_API_KEY" \
  -d '{
    "model": "openai/gpt-4.1-mini",
    "messages": [
      {"role": "user", "content": "2+2="}
    ]
  }'
```

#### Python

```python
import openai

client = openai.OpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)

response = client.chat.completions.create(
    model="openai/gpt-4.1-mini",
    messages=[{"role": "user", "content": "2+2="}],
)

print(response.choices[0].message.content)
```

#### JavaScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'your-api-key',
    baseURL: 'https://mume.ai/api/v1',
});

const response = await client.chat.completions.create({
    model: 'openai/gpt-4.1-mini',
    messages: [{ role: 'user', content: '2+2=' }],
});

console.log(response.choices[0].message.content);
```

---

### Streaming Chat Completions

Get responses token-by-token for a real-time experience:

#### cURL

```bash
curl https://mume.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MUME_API_KEY" \
  -d '{
    "model": "openai/gpt-4.1-mini",
    "messages": [
      {"role": "user", "content": "Write a poem about the moon."}
    ],
    "stream": true
  }'
```

#### Python

```python
import openai

client = openai.OpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)

response = client.chat.completions.create(
    model="openai/gpt-4.1-mini",
    messages=[{"role": "user", "content": "Write a poem about the moon."}],
    stream=True,
)

for chunk in response:
    content = getattr(chunk.choices[0].delta, "content", None)
    if content is not None:
        print(content, end="", flush=True)
```

#### JavaScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'your-api-key',
    baseURL: 'https://mume.ai/api/v1',
});

const stream = await client.chat.completions.create({
    model: 'openai/gpt-4.1-mini',
    messages: [{ role: 'user', content: 'Write a poem about the moon.' }],
    stream: true,
});

for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
        process.stdout.write(content);
    }
}
```

---

### Async Streaming (Python)

For high-performance async applications:

```python
import openai
import asyncio

async_client = openai.AsyncOpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)

async def main():
    async with async_client.chat.completions.stream(
        model="openai/gpt-4.1-mini",
        messages=[{"role": "user", "content": "Write a poem about the moon."}],
    ) as stream:
        async for chunk in stream:
            if chunk.type == "content.delta":
                print(chunk.delta, end="", flush=True)

asyncio.run(main())
```

---

## ⚡ Responses API

The Responses API offers a streamlined interface for single-turn interactions — perfect for quick queries and simple use cases.

### Basic Request

#### cURL

```bash
curl https://mume.ai/api/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MUME_API_KEY" \
  -d '{
    "model": "openai/gpt-4.1-nano",
    "input": [
      {"type": "message", "content": "Write a poem about the moon.", "role": "user"}
    ]
  }'
```

#### Python

```python
import openai

client = openai.OpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)

response = client.responses.create(
    model="openai/gpt-4.1-nano",
    input=[
        {"type": "message", "content": "Write a poem about the moon.", "role": "user"}
    ],
)

print(response.output_text.strip())
```

#### JavaScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'your-api-key',
    baseURL: 'https://mume.ai/api/v1',
});

const response = await client.responses.create({
    model: 'openai/gpt-4.1-nano',
    input: [
        { type: 'message', content: 'Write a poem about the moon.', role: 'user' }
    ],
});

console.log(response.output_text.trim());
```

---

### Simple String Input

For the simplest use cases, just pass a string:

#### cURL

```bash
curl https://mume.ai/api/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MUME_API_KEY" \
  -d '{
    "model": "openai/gpt-4.1-mini",
    "input": "Write a poem about the moon."
  }'
```

#### Python

```python
import openai

client = openai.OpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)

response = client.responses.create(
    model="openai/gpt-4.1-mini",
    input="Write a poem about the moon.",
)

print(response.output_text)
```

#### JavaScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'your-api-key',
    baseURL: 'https://mume.ai/api/v1',
});

const response = await client.responses.create({
    model: 'openai/gpt-4.1-mini',
    input: 'Write a poem about the moon.',
});

console.log(response.output_text);
```

---

### Streaming Responses

#### cURL

```bash
curl https://mume.ai/api/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MUME_API_KEY" \
  -d '{
    "model": "openai/gpt-4.1-nano",
    "input": [
      {"type": "message", "content": "Write a poem about the moon.", "role": "user"}
    ],
    "stream": true
  }'
```

#### Python

```python
import openai

client = openai.OpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)

response = client.responses.create(
    model="openai/gpt-4.1-nano",
    input=[
        {"type": "message", "content": "Write a poem about the moon.", "role": "user"}
    ],
    stream=True,
)

for chunk in response:
    if chunk.type == "response.output_text.delta":
        print(chunk.delta, end="", flush=True)
```

#### JavaScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'your-api-key',
    baseURL: 'https://mume.ai/api/v1',
});

const stream = await client.responses.create({
    model: 'openai/gpt-4.1-nano',
    input: [
        { type: 'message', content: 'Write a poem about the moon.', role: 'user' }
    ],
    stream: true,
});

for await (const chunk of stream) {
    if (chunk.type === 'response.output_text.delta') {
        process.stdout.write(chunk.delta);
    }
}
```

---

### Async Streaming Responses (Python)

```python
import openai
import asyncio

async_client = openai.AsyncOpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)

async def main():
    async with async_client.responses.stream(
        model="openai/gpt-4.1-mini",
        input="Write a poem about the moon.",
    ) as stream:
        async for chunk in stream:
            if chunk.type == "response.output_text.delta":
                print(chunk.delta, end="", flush=True)

asyncio.run(main())
```

---

## 🔧 Function Calling / Tools

Extend AI capabilities by letting models call your custom functions. This powerful feature enables dynamic interactions with external systems, databases, APIs, and more.

### How It Works

1. **Define your tools** — Describe the functions the model can call
2. **Make the initial request** — The model decides if it needs to call a function
3. **Execute the function** — Run your code with the provided arguments
4. **Return results** — Send the function output back to get the final response

### Complete Example

#### cURL

**Step 1: Initial request with tools defined**

```bash
curl https://mume.ai/api/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MUME_API_KEY" \
  -d '{
    "model": "openai/gpt-4.1-mini",
    "tools": [
      {
        "type": "function",
        "name": "get_horoscope",
        "description": "Get today'\''s horoscope for an astrological sign.",
        "parameters": {
          "type": "object",
          "properties": {
            "sign": {
              "type": "string",
              "description": "An astrological sign like Taurus or Aquarius"
            }
          },
          "required": ["sign"]
        }
      }
    ],
    "input": [
      {
        "type": "message",
        "role": "user",
        "content": "What is my horoscope? I am a Capricorn."
      }
    ]
  }'
```

**Step 2: Send function results back**

```bash
curl https://mume.ai/api/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MUME_API_KEY" \
  -d '{
    "model": "openai/gpt-4.1-mini",
    "input": [
      {
        "type": "message",
        "role": "user",
        "content": "What is my horoscope? I am a Capricorn."
      },
      {
        "type": "function_call",
        "id": "call_abc123",
        "callId": "call_abc123",
        "name": "get_horoscope",
        "arguments": "{\"sign\": \"Capricorn\"}"
      },
      {
        "type": "function_call_output",
        "callId": "call_abc123",
        "id": "call_abc123",
        "output": "{\"horoscope\": \"Capricorn: Next Tuesday you will befriend a baby otter.\"}"
      }
    ]
  }'
```

#### Python

```python
import openai
import json

client = openai.OpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)

# 1. Define callable tools
tools = [
    {
        "type": "function",
        "name": "get_horoscope",
        "description": "Get today's horoscope for an astrological sign.",
        "parameters": {
            "type": "object",
            "properties": {
                "sign": {
                    "type": "string",
                    "description": "An astrological sign like Taurus or Aquarius",
                },
            },
            "required": ["sign"],
        },
    },
]

# Your function implementation
def get_horoscope(sign):
    return f"{sign}: Next Tuesday you will befriend a baby otter."

# Create input list
input_list = [
    {
        "type": "message",
        "role": "user",
        "content": "What is my horoscope? I am a Capricorn.",
    }
]

# 2. Make initial request with tools
response = client.responses.create(
    model="openai/gpt-4.1-mini",
    tools=tools,
    input=input_list,
    stream=True,
)

final_tool_calls = {}

for chunk in response:
    if chunk.type == "response.output_text.delta":
        print(chunk.delta, end="", flush=True)
    if chunk.type == "response.completed":
        final_tool_calls = chunk.response.output

# 3. Process function calls and execute functions
for item in final_tool_calls:
    if item.type == "function_call":
        call_id = item.id or item.callId or item.call_id
        
        # Add the function call to input
        input_list.append({
            "type": "function_call",
            "id": call_id,
            "callId": call_id,
            "name": item.name,
            "arguments": item.arguments,
        })

        # Execute the function
        if item.name == "get_horoscope":
            args = json.loads(item.arguments)
            horoscope = get_horoscope(args["sign"])
            
            # 4. Add function result to input
            input_list.append({
                "type": "function_call_output",
                "callId": call_id,
                "id": call_id,
                "output": json.dumps({"horoscope": horoscope}),
            })

# 5. Get final response with function results
response = client.responses.create(
    model="openai/gpt-4.1-mini",
    input=input_list,
    stream=True,
)

for chunk in response:
    if chunk.type == "response.output_text.delta":
        print(chunk.delta, end="", flush=True)
```

#### JavaScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'your-api-key',
    baseURL: 'https://mume.ai/api/v1',
});

// 1. Define callable tools
const tools = [
    {
        type: 'function',
        name: 'get_horoscope',
        description: "Get today's horoscope for an astrological sign.",
        parameters: {
            type: 'object',
            properties: {
                sign: {
                    type: 'string',
                    description: 'An astrological sign like Taurus or Aquarius',
                },
            },
            required: ['sign'],
        },
    },
];

// Your function implementation
function getHoroscope(sign) {
    return `${sign}: Next Tuesday you will befriend a baby otter.`;
}

// Create input list
const inputList = [
    {
        type: 'message',
        role: 'user',
        content: 'What is my horoscope? I am a Capricorn.',
    },
];

// 2. Make initial request with tools
const stream = await client.responses.create({
    model: 'openai/gpt-4.1-mini',
    tools: tools,
    input: inputList,
    stream: true,
});

let finalToolCalls = [];

for await (const chunk of stream) {
    if (chunk.type === 'response.output_text.delta') {
        process.stdout.write(chunk.delta);
    }
    if (chunk.type === 'response.completed') {
        finalToolCalls = chunk.response.output;
    }
}

// 3. Process function calls and execute functions
for (const item of finalToolCalls) {
    if (item.type === 'function_call') {
        const callId = item.id || item.callId || item.call_id;

        // Add the function call to input
        inputList.push({
            type: 'function_call',
            id: callId,
            callId: callId,
            name: item.name,
            arguments: item.arguments,
        });

        // Execute the function
        if (item.name === 'get_horoscope') {
            const args = JSON.parse(item.arguments);
            const horoscope = getHoroscope(args.sign);

            // 4. Add function result to input
            inputList.push({
                type: 'function_call_output',
                callId: callId,
                id: callId,
                output: JSON.stringify({ horoscope: horoscope }),
            });
        }
    }
}

// 5. Get final response with function results
const finalStream = await client.responses.create({
    model: 'openai/gpt-4.1-mini',
    input: inputList,
    stream: true,
});

for await (const chunk of finalStream) {
    if (chunk.type === 'response.output_text.delta') {
        process.stdout.write(chunk.delta);
    }
}
```

---

## 🌐 Web Search

Give your AI the power to search the web with the built-in `web_search` tool. Get real-time information, current events, and up-to-date data.

#### cURL

```bash
curl https://mume.ai/api/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MUME_API_KEY" \
  -d '{
    "model": "openai/gpt-4.1-mini",
    "tools": [{"type": "web_search"}],
    "input": "news story india today"
  }'
```

#### Python

```python
import openai

client = openai.OpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)

response = client.responses.create(
    model="openai/gpt-4.1-mini",
    tools=[{"type": "web_search"}],
    input="news story india today",
)

print(response.output_text)
```

#### JavaScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'your-api-key',
    baseURL: 'https://mume.ai/api/v1',
});

const response = await client.responses.create({
    model: 'openai/gpt-4.1-mini',
    tools: [{ type: 'web_search' }],
    input: 'news story india today',
});

console.log(response.output_text);
```

---

## 🤖 Available Models

Mume Gateway gives you access to models from the world's leading AI providers. Simply use the `provider/model` format when specifying models.

| Provider | Example Models |
|:---------|:---------------|
| **OpenAI** | `openai/gpt-4.1-mini`, `openai/gpt-4.1-nano`, `openai/gpt-5.1` |
| **Anthropic** | `anthropic/claude-opus-4.5` |
| **Google** | `google/gemini-3-pro-preview` |
| **Mistral** | `mistralai/voxtral-small-24b-2507` |
| **Moonshot** | `moonshotai/kimi-k2-thinking` |

> 📖 **Explore the full catalog:** [Mume AI Model Catalog](https://mume.ai/chat_models)

---

## ⚠️ Error Handling

Build robust applications with proper error handling:

#### Python

```python
import openai

client = openai.OpenAI(
    api_key="your-api-key",
    base_url="https://mume.ai/api/v1",
)

try:
    response = client.chat.completions.create(
        model="openai/gpt-4.1-mini",
        messages=[{"role": "user", "content": "Hello!"}],
    )
    print(response.choices[0].message.content)
except openai.APIConnectionError as e:
    print(f"Connection error: {e}")
except openai.RateLimitError as e:
    print(f"Rate limit exceeded: {e}")
except openai.APIStatusError as e:
    print(f"API error: {e.status_code} - {e.message}")
```

#### JavaScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'your-api-key',
    baseURL: 'https://mume.ai/api/v1',
});

try {
    const response = await client.chat.completions.create({
        model: 'openai/gpt-4.1-mini',
        messages: [{ role: 'user', content: 'Hello!' }],
    });
    console.log(response.choices[0].message.content);
} catch (error) {
    if (error instanceof OpenAI.APIConnectionError) {
        console.error('Connection error:', error.message);
    } else if (error instanceof OpenAI.RateLimitError) {
        console.error('Rate limit exceeded:', error.message);
    } else if (error instanceof OpenAI.APIError) {
        console.error(`API error: ${error.status} - ${error.message}`);
    } else {
        throw error;
    }
}
```

---

## 🔑 Generating an API Key

To use Mume Gateway, you'll need an API key. Here's how to get one:

### Steps to Generate Your API Key

| Step | Action |
|:----:|:-------|
| **1** | Navigate to [https://mume.ai/api](https://mume.ai/api) |
| **2** | Sign in to your Mume account (or create one) |
| **3** | Click the **"Generate API Key"** button |
| **4** | Copy your key immediately and store it securely |

> ⚠️ **Important Security Notes**
> 
> - 🚫 Never share your API key publicly or commit it to version control
> - 🚫 Never expose your API key in client-side code
> - ✅ Store your API key in environment variables or a secure secrets manager
> - 🔄 If you suspect your key has been compromised, revoke it immediately and generate a new one

---

### Setting Up Your Environment Variable

#### Linux/macOS

```bash
export MUME_API_KEY="your-api-key-here"
```

To make it permanent, add to your shell configuration:

```bash
echo 'export MUME_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

#### Windows (Command Prompt)

```cmd
set MUME_API_KEY=your-api-key-here
```

To make it permanent:

```cmd
setx MUME_API_KEY "your-api-key-here"
```

#### Windows (PowerShell)

```powershell
$env:MUME_API_KEY = "your-api-key-here"
```

To make it permanent:

```powershell
[System.Environment]::SetEnvironmentVariable('MUME_API_KEY', 'your-api-key-here', 'User')
```

#### Using a .env File

Create a `.env` file in your project root:

```env
MUME_API_KEY=your-api-key-here
```

**Load it in Python** (using `python-dotenv`):

```python
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("MUME_API_KEY")
```

**Load it in JavaScript** (using `dotenv`):

```javascript
import 'dotenv/config';
const apiKey = process.env.MUME_API_KEY;
```

> 💡 **Pro tip:** Add `.env` to your `.gitignore` to prevent accidentally committing your API key!

---

### Using the Environment Variable

#### Python

```python
import os
import openai

client = openai.OpenAI(
    api_key=os.environ.get("MUME_API_KEY"),
    base_url="https://mume.ai/api/v1",
)
```

#### JavaScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: process.env.MUME_API_KEY,
    baseURL: 'https://mume.ai/api/v1',
});
```

#### cURL

```bash
curl https://mume.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MUME_API_KEY" \
  -d '{
    "model": "openai/gpt-4.1-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## 💡 Support

| Resource | Link |
|:---------|:-----|
| 📚 **Model Catalog** | [https://mume.ai/chat_models](https://mume.ai/chat_models) |
| 🔗 **API Base URL** | `https://mume.ai/api/v1` |
| 🔑 **Get API Key** | [https://mume.ai/api](https://mume.ai/api) |

---

<div align="center">

**Built with ❤️ by the Mume team**

*One API. Every model. Unlimited possibilities.*

</div>
