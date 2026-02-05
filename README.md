# AI Chat Support - Spur Take-Home Assignment

An AI-powered customer support chatbot for e-commerce websites, built with React frontend and Node.js/TypeScript backend using OpenAI's GPT-4o-mini.

## 🎯 Project Overview

This project implements a live chat widget where an AI agent answers customer questions using OpenAI's API. It includes session management, conversation persistence, and a modern chat interface.

## ✨ Features

### Core Functionality

- ✅ Real-time chat interface with AI support agent
- ✅ Session-based conversation history
- ✅ Persistent chat sessions (localStorage + MongoDB)
- ✅ Chat history sidebar with multiple session management
- ✅ Auto-scroll to latest messages
- ✅ "Agent is typing..." indicator
- ✅ Input validation and error handling
- ✅ Responsive design with Tailwind CSS

### Technical Features

- ✅ TypeScript throughout (backend & frontend)
- ✅ Express-validator for request validation
- ✅ MongoDB for message persistence
- ✅ OpenAI GPT-4o-mini integration
- ✅ Error handling and graceful failures
- ✅ Input sanitization and validation

## 🛠 Tech Stack

### Backend

- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose for data storage
- **OpenAI API** (GPT-4o-mini) for AI responses
- **express-validator** for input validation
- **CORS** for cross-origin requests
- **dotenv** for environment configuration

### Frontend

- **React** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **ESLint** for code linting

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB database (local or cloud like MongoDB Atlas)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/rpsinghcodes/ai-chat-support.git
cd ai-chat-support
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=3003
MONGODB_URL=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
```

**Environment Variables Explained:**

- `PORT`: Backend server port (default: 3003)
- `MONGODB_URL`: MongoDB connection string
  - Local: `mongodb://localhost:27017/ai_chat_support`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/ai_chat_support`
- `OPENAI_API_KEY`: Your OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

**Important:** Never commit `.env` files to version control. They are already included in `.gitignore`.

### Step 3: Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3003
```

**Frontend Environment Variables:**

- `VITE_API_URL`: Backend API URL
  - **Local development:** `http://localhost:3003`
  - **Production:** Update to your deployed backend URL (e.g., `https://your-backend-url.com`)

**Important Notes:**

- Vite requires the `VITE_` prefix for environment variables to be exposed to the client-side code
- After changing `.env` file, restart the Vite dev server for changes to take effect
- Never commit `.env` files to version control

### Step 4: Database Setup

The database schema is automatically created when you first run the application. No migrations needed - Mongoose will create the collections on first use.

**Database Schema:**

- **Messages Collection:**
  - `sessionId` (String, required)
  - `message` (String, required) - User message
  - `reply` (String, required) - AI response
  - `createdAt` (Date, auto-generated)

## 🎮 Running the Application

### Development Mode

1. **Start the Backend:**

   ```bash
   cd backend
   npm run dev
   ```

   Server runs on `http://localhost:3003`

2. **Start the Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

   App available at `http://localhost:5173`

3. Open `http://localhost:5173` in your browser to start chatting!

### Production Build

**Backend:**

```bash
cd backend
npm run build
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
npm run preview
```

## 🌐 Live Demo

- **Frontend:** [Deployed URL - Update with your deployment]
- **Backend API:** [Deployed URL - Update with your deployment]

## 📡 API Endpoints

### POST `/chat/message`

Send a user message and receive an AI response.

**Request Body:**

```json
{
	"sessionId": "string (optional, auto-generated if not provided)",
	"message": "string (required, 1-5000 characters)"
}
```

**Response:**

```json
{
	"reply": "string",
	"sessionId": "string"
}
```

**Validation:**

- `sessionId`: Required, string, 1-200 characters
- `message`: Required, string, 1-5000 characters

**Error Responses:**

- `400`: Validation failed
- `500`: Internal server error

### POST `/chat/history`

Retrieve chat history for a session.

**Request Body:**

```json
{
	"sessionId": "string (required)"
}
```

**Response:**

```json
{
	"data": [
		{
			"sender": "user",
			"text": "string"
		},
		{
			"sender": "ai",
			"text": "string"
		}
	]
}
```

## 🏗 Architecture Overview

### Backend Structure

```
backend/
├── connection/
│   └── db.connect.ts          # MongoDB connection
├── controller/
│   └── message.controller.ts  # Request handlers
├── middleware/
│   ├── error.middleware.ts     # Global error handler
│   └── validation.middleware.ts # Validation middleware
├── model/
│   └── message.schema.ts       # Mongoose schema
├── routes/
│   └── message.route.ts        # API routes
├── service/
│   └── chatgpt.service.ts      # OpenAI integration
├── validators/
│   └── message.validator.ts    # Request validators
├── server.ts                   # Express app setup
└── tsconfig.json               # TypeScript config
```

### Design Decisions

1. **Separation of Concerns:**

   - Controllers handle HTTP logic
   - Services handle business logic (LLM calls)
   - Validators handle input validation
   - Models handle data persistence

2. **Type Safety:**

   - Full TypeScript implementation
   - Interfaces for all data structures
   - Type-safe API responses

3. **Error Handling:**

   - Centralized error middleware
   - Graceful LLM API failure handling
   - User-friendly error messages

4. **Session Management:**

   - UUID-based session IDs (crypto.randomUUID)
   - Session metadata stored in localStorage
   - Messages persisted in MongoDB

5. **LLM Integration:**
   - Encapsulated in service layer
   - Easy to swap providers
   - Conversation history included for context

### Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   └── Chat.tsx            # Main chat component
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── index.html
└── vite.config.ts
```

## 🤖 LLM Integration Details

### Provider

- **OpenAI GPT-4o-mini**
- Model: `gpt-4o-mini`
- Temperature: `0.7` (balanced creativity/consistency)

### Prompting Strategy

The system prompt includes:

- **Identity**: Professional customer support agent
- **Role**: E-commerce support specialist
- **Communication Guidelines**: Warm, empathetic, professional tone
- **Store Knowledge**:
  - Shipping policies (free shipping over $50, standard/express options)
  - Return & refund policy (30-day returns)
  - Support hours (Mon-Fri 9 AM - 6 PM EST)
  - Payment methods, loyalty program, etc.

### Context Management

- System prompt sets the agent's persona and knowledge
- Last 10 messages included in conversation history
- Messages sent chronologically for proper context
- History transformed to OpenAI's message format

### Error Handling

- API timeouts handled gracefully
- Invalid API keys return user-friendly errors
- Rate limits handled with retry logic (can be enhanced)
- Network failures show appropriate error messages

### Cost Control

- Temperature set to 0.7 for balanced responses
- Max message length: 5000 characters (validated)
- Conversation history limited to last 10 messages
- Can add `max_tokens` parameter if needed

## 🧪 Testing the Application

### Manual Testing Checklist

1. **Basic Chat Flow:**

   - Send a message → Should receive AI response
   - Check message persistence → Reload page, history should load
   - Test multiple sessions → Create new chat, switch between chats

2. **Error Cases:**

   - Empty message → Should show validation error
   - Very long message → Should be validated (max 5000 chars)
   - Invalid sessionId → Should handle gracefully
   - Network failure → Should show error message

3. **FAQ Testing:**
   - Ask about shipping policy → Should reference store info
   - Ask about returns → Should mention 30-day policy
   - Ask about support hours → Should provide correct hours

## 📝 Trade-offs & Future Improvements

### Current Trade-offs

1. **Database**: Using MongoDB instead of PostgreSQL

   - ✅ Faster to set up, flexible schema
   - ⚠️ Could use PostgreSQL for better relational queries

2. **Frontend**: React instead of Svelte

   - ✅ More familiar, larger ecosystem
   - ⚠️ Svelte might be lighter/faster

3. **No Redis Cache**:

   - ⚠️ Could cache frequent responses
   - ✅ Simpler architecture for MVP

4. **No Rate Limiting**:
   - ⚠️ Could add per-session rate limits
   - ✅ Simpler for demo purposes

### If I Had More Time...

1. **Enhanced Features:**

   - [ ] Rate limiting per session/IP
   - [ ] Message search functionality
   - [ ] Export chat history

2. **Code Quality:**

   - [ ] Integration tests for API endpoints
   - [ ] E2E tests (Playwright/Cypress)
   - [ ] API documentation (Swagger/OpenAPI)

3. **Architecture:**

   - [ ] WebSocket support for real-time updates
   - [ ] Message queue for handling high traffic
   - [ ] Database indexing optimization
   - [ ] Connection pooling

4. **UX Improvements:**

   - [ ] Markdown support in messages
   - [ ] Image previews
   - [ ] Voice input/output
   - [ ] Dark/light theme toggle

## 🐛 Known Issues

- None currently - all core functionality working as expected

---
