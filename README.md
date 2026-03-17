# chatApp | Real-Time Messaging Engine

A full-stack communication platform built to explore event-driven architecture and relational data modeling. This project was developed as part of a #100DaysOfCode sprint to bridge the gap between rapid agency delivery and deep-dive technical architecture.

## 🚀 The Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript |
| Real-Time | Socket.IO (WebSockets) |
| Database | PostgreSQL (Hosted on Supabase) |
| ORM | Prisma |
| Storage | Supabase Storage (avatars & room images) |
| Testing | Vitest (Backend API logic) |
| Auth | JWT (JSON Web Tokens), bcrypt |

## 🛠 Features

**Real-Time Communication**
- Low-latency bi-directional messaging powered by Socket.IO
- Live presence tracking — online/offline status updates across all connected clients

**Rooms & Messaging**
- Public boards visible to all users
- Private group rooms with membership control
- Direct messaging between users

**Dashboard**
- Discord-inspired four-column layout
- Room sidebar with avatars, tooltips and active state
- Room panel showing members, roles and online status
- DM list with presence indicators
- User panel with account controls

**Users & Relationships**
- JWT-secured authentication
- Passwords hashed with bcrypt before storage — no plaintext credentials in the database
- Friend requests — send, accept and decline
- User profiles with avatars (fallback to initial monogram)
- Role-based room membership (member / admin)

**Data & Storage**
- Robust PostgreSQL schema managed via Prisma
- Supabase Storage for images and attachments
- Fully seeded development database with realistic X-Men themed data

```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL instance or Supabase project

### 1. Clone & Install

```bash
git clone https://github.com/dannykryan/chatApp.git
cd chatApp

# Install backend
cd backend/src && npm install

# Install frontend
cd ../../frontend && npm install
```

### 2. Environment Configuration

Create a `.env` file in `backend/src/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/yourdb"
SUPABASE_URL="your_supabase_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_KEY="your_supabase_service_key"
DIRECT_URL="postgresql://user:password@localhost:5432/yourdb"
JWT_SECRET="your_secure_random_string"
```

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### 3. Database Initialization

```bash
cd backend/src
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run the Application

```bash
# Backend (port 4000)
cd backend/src && npm start

# Frontend (port 3000)
cd frontend && npm run dev
```

## 🧪 Testing

Backend logic is validated using Vitest:

```bash
cd backend/src
npm run test
```

## 📈 Future Roadmap

- [ ] Message input with send functionality
- [ ] Load more / pagination for message history
- [ ] Media sharing via Supabase Storage
- [ ] Message reactions and replies
- [ ] Room creation and management UI
- [ ] Friend request notifications
- [ ] Mobile front-end built with React Native