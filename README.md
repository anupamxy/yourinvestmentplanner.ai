# InvestAI — AI-Powered Investment Advisor Platform

A full-stack investment advisory platform that combines a **4-agent AI pipeline**, real-time **WebSocket discussion rooms**, a **portfolio tracker**, and a personalized **Life Financial Advisor** — all in a professional dark-themed React UI backed by Django.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Environment Variables](#environment-variables)
- [AI Agent Pipeline](#ai-agent-pipeline)
- [Pages & Features](#pages--features)
- [API Reference](#api-reference)
- [WebSocket Protocol](#websocket-protocol)
- [Screenshots](#screenshots)

---

## Features

| Feature | Description |
|---|---|
| **AI Analysis** | 4-agent pipeline: Market Data → Analysis → Memory → LLM Report |
| **Life Advisor** | Personalized financial plan based on life profile (profession, family, goals) |
| **Portfolio Tracker** | CRUD investments with P&L, donut chart, monthly bar chart |
| **Discussion Rooms** | Real-time WebSocket chat rooms by investment category |
| **Node Canvas UI** | Drag-and-drop node editor for Life Profile & Preferences |
| **Research Sources** | Live DuckDuckGo web search with curated fallback sources |
| **Report History** | View, search, and Q&A on past AI-generated reports |
| **JWT Auth** | Secure access/refresh token flow, 24h access lifetime |
| **Dark Theme** | Professional dark UI with CSS design tokens |

---

## Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Django | 5.0.6 | Web framework |
| Django REST Framework | 3.15.2 | REST API |
| Simple JWT | 5.3.1 | JWT authentication |
| Django Channels | 4.1.0 | WebSocket (ASGI) |
| Daphne | 4.1.2 | ASGI server |
| ChromaDB | 0.5.3 | Vector memory store |
| Sentence Transformers | 3.0.1 | Embedding model |
| LangChain Groq | 1.1.2 | LLM integration |
| Celery + Redis | 5.4.0 | Async task queue |
| yFinance | 0.2.41 | Market data |
| DuckDuckGo Search | latest | Web research |
| SQLite / PostgreSQL | — | Database |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 8.0 | Build tool |
| Tailwind CSS | 3.4 | Styling |
| React Router | 7.x | Client routing |
| Zustand | 5.0 | State management |
| @xyflow/react | 12.x | Node canvas (ReactFlow) |
| Recharts | 3.x | Portfolio charts |
| Lucide React | latest | Icons |
| React Markdown | 10.x | Report rendering |
| Axios | 1.x | HTTP client |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│   Vite + Tailwind │ Zustand │ ReactFlow │ Recharts       │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (REST) + WebSocket
┌──────────────────────────▼──────────────────────────────┐
│                  Django Backend (ASGI)                   │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  REST APIs  │  │  Channels WS │  │  Celery Tasks  │  │
│  │  (DRF+JWT)  │  │  (Daphne)    │  │  (Redis queue) │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │           │
│  ┌──────▼──────────────────────────────────▼─────────┐  │
│  │              AI Agent Pipeline                     │  │
│  │  Market Data → Analysis → Memory → LLM (Groq)     │  │
│  └──────────────────────┬───────────────────────────┘  │
│                          │                              │
│  ┌───────────────────────▼──────────────────────────┐  │
│  │  Storage: SQLite │ ChromaDB (vectors) │ Redis     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
yourinvestmentplanner.ai/
├── backend/
│   ├── config/
│   │   ├── settings.py          # Django settings
│   │   ├── urls.py              # URL routing
│   │   └── asgi.py              # ASGI (HTTP + WebSocket)
│   └── apps/
│       ├── users/               # Custom user model + auth
│       ├── agents/              # Market data, analysis, memory agents
│       ├── memory/              # ChromaDB vector store
│       ├── reports/             # Report model + Q&A endpoint
│       ├── life_advisor/        # Life profile + Life LLM agent
│       ├── portfolio/           # Portfolio CRUD + summary API
│       └── discussions/         # Room model + WebSocket consumer
│
└── frontend/
    └── src/
        ├── api/                 # Axios API clients
        ├── components/
        │   ├── layout/          # Navbar, Layout
        │   ├── agents/          # AgentStatusCard, AgentPipeline
        │   ├── reports/         # ReportCard, ReportViewer, ReportQA
        │   ├── life_advisor/    # LifeAdvisorReport, ResearchSidebar
        │   ├── life_profile/    # Node canvas (ReactFlow) components
        │   └── preferences/     # PreferencesCanvas
        ├── hooks/               # useRoomSocket (WebSocket hook)
        ├── pages/               # All page components
        └── store/               # Zustand state stores
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Redis (for Celery task queue)
- [Groq API key](https://console.groq.com) — free tier available
- [Alpha Vantage API key](https://www.alphavantage.co/support/#api-key) — free tier available
- HuggingFace API key — for embedding model fallback

---

### Backend Setup

```bash
# 1. Navigate to backend
cd yourinvestmentplanner.ai/backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create environment file
cp .env.example .env            # then fill in your API keys

# 5. Run migrations
python manage.py migrate

# 6. Create superuser (optional)
python manage.py createsuperuser

# 7. Start the ASGI server (required for WebSocket support)
daphne -p 8000 config.asgi:application

# In a separate terminal — start Celery worker (for async agent tasks)
celery -A config worker -l info
```

> **Important:** Always use `daphne` (or `uvicorn`) instead of `python manage.py runserver`  
> for WebSocket chat rooms to work. The standard development server does not support WebSocket.

---

### Frontend Setup

```bash
# 1. Navigate to frontend
cd yourinvestmentplanner.ai/frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (defaults to SQLite)
# DATABASE_URL=postgres://user:pass@localhost:5432/investai

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# AI APIs
GROQ_API_KEY=gsk_your_groq_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
HUGGINGFACE_API_KEY=hf_your_key_here

# Redis (for Celery + Channel layers in production)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

## AI Agent Pipeline

When a user triggers **Run Analysis**, four agents execute sequentially via Celery:

```
1. Market Data Agent
   └── Fetches live quotes, sector data, news sentiment via Alpha Vantage & yFinance
       Output: tickers, prices, sentiment scores

2. Analysis Agent
   └── Scores tickers against user's risk profile, budget, and sectors
       Output: ranked top picks, portfolio allocation

3. Memory Agent
   └── Queries ChromaDB for past recommendations (semantic search)
       Output: relevant history context

4. LLM Agent (Groq — Llama 3 70B)
   └── Assembles context → generates full markdown investment report
       Output: personalized report saved to database
```

Progress streams to the frontend via **Server-Sent Events (SSE)** so users see each agent complete in real time.

---

## Pages & Features

### Dashboard `/dashboard`
- Live market ticker strip (NIFTY, SENSEX, BTC, S&P 500, Gold, USD/INR)
- Animated stat cards: total reports, portfolio budget, time horizon
- Recent reports list
- Investment profile sidebar with quick actions

### Run Analysis `/run`
- One-click 4-agent pipeline trigger
- Real-time agent progress cards with status indicators
- Profile summary pill (risk, budget, horizon, sectors)

### Report `/reports/:id`
- Full markdown report rendering
- AI-powered Q&A on the report via LangChain + Groq
- Confidence score, ticker tags, creation date

### Report History `/history`
- Searchable list of all generated reports
- Filter by date, sort by confidence score

### Preferences `/preferences`
- **ReactFlow node canvas**: drag-and-drop nodes for Risk, Budget, Sectors, Goal, Horizon
- Save preferences used to personalize AI analysis

### Life Profile `/life-profile`
- **ReactFlow node canvas**: Professional, Personal, Financial, Goal, Loan nodes
- Connect nodes to build a complete life financial profile
- Add multiple goals (retirement, home, education) and loans

### Life Advisor `/life-advisor`
- Runs a separate AI pipeline tailored to your life profile
- Two-column layout: full report (left) + research sources sidebar (right)
- Sources pulled from Reddit, Quora, Zerodha Varsity, Investopedia, and more

### Portfolio `/portfolio`
- Add/edit/delete investments (stocks, MF, ETF, crypto, FD, gold, PPF, bonds, real estate)
- Unrealised P&L tracking per holding
- **Donut chart** — asset type allocation
- **Bar chart** — monthly investment trend (last 12 months)
- INR large-number formatting (Cr / L notation)

### Community `/discussions`
- Browse discussion rooms by category (Stocks, Mutual Funds, Crypto, Tax, Goals, General)
- Create new rooms
- Real-time member count and message count

### Room `/discussions/:slug`
- Real-time WebSocket chat (JWT authenticated)
- Own messages (indigo, right) vs others (dark, left)
- Join/leave system notifications
- Online members sidebar
- Auto-scroll to latest message
- Enter to send, Shift+Enter for newline

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register/` | Register new user |
| POST | `/api/v1/auth/login/` | Get access + refresh tokens |
| POST | `/api/v1/auth/refresh/` | Refresh access token |
| GET | `/api/v1/auth/me/` | Get current user info |

### AI Agents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/agents/run/` | Start analysis pipeline |
| GET | `/api/v1/agents/stream/` | SSE stream for agent progress |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/reports/` | List all user reports |
| GET | `/api/v1/reports/:id/` | Get single report |
| POST | `/api/v1/reports/:id/qa/` | Ask question about report |

### Preferences
| Method | Endpoint | Description |
|---|---|---|
| GET/PUT | `/api/v1/preferences/` | Get or save investment preferences |

### Life Advisor
| Method | Endpoint | Description |
|---|---|---|
| GET/PUT | `/api/v1/life-advisor/profile/` | Life profile CRUD |
| POST | `/api/v1/life-advisor/run/` | Start life advisor pipeline |
| GET | `/api/v1/life-advisor/stream/` | SSE stream for progress |

### Portfolio
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/v1/portfolio/` | List or add investment entries |
| GET/PUT/DELETE | `/api/v1/portfolio/:id/` | Manage single entry |
| GET | `/api/v1/portfolio/summary/` | Aggregate stats + chart data |

### Discussions
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/v1/discussions/rooms/` | List or create rooms |
| GET | `/api/v1/discussions/rooms/:slug/` | Get room detail |
| GET | `/api/v1/discussions/rooms/:slug/messages/` | Get last 50 messages |

---

## WebSocket Protocol

Connect to a discussion room:

```
ws://localhost:8000/ws/discussions/{room-slug}/?token={access_token}
```

**Incoming message format:**
```json
{
  "type": "chat_message",
  "message": {
    "id": 42,
    "username": "alice",
    "content": "What do you think about NIFTY midcap?",
    "created_at": "2026-04-05T10:30:00Z"
  }
}
```

**Send message:**
```json
{ "content": "Your message here (max 2000 chars)" }
```

**System events:** `chat_join` and `chat_leave` are broadcast when users connect or disconnect.

> The server uses `InMemoryChannelLayer` by default (no Redis needed for WebSocket).  
> For production horizontal scaling, switch to `channels_redis.core.RedisChannelLayer`.

---

## Production Deployment

```bash
# Backend — use gunicorn for HTTP, daphne for WebSocket, or uvicorn for both
uvicorn config.asgi:application --host 0.0.0.0 --port 8000 --workers 4

# Frontend — build static files
npm run build
# Serve dist/ with nginx or any static host (Vercel, Netlify, Cloudflare Pages)
```

**Recommended production stack:**
- Backend: Railway / Render / EC2 with Daphne
- Database: PostgreSQL (set `DATABASE_URL`)
- Redis: Upstash / Redis Cloud (for Celery + WebSocket channel layer)
- Frontend: Vercel / Netlify

---

## License

MIT — free to use, modify, and distribute.

---

<div align="center">
  Built with Django · React · Groq (Llama 3) · ChromaDB · Django Channels
</div>
