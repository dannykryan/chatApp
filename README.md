# chatApp | Real-Time Messaging Engine

A full-stack real-time messaging platform with presence tracking, friend relationships, room-based chat, and JWT authentication. Built with Next.js, Node.js, Socket.IO, Prisma and Supabase.

Currently building on X for #100DaysOfCode: [@dannykryan](https://x.com/dannykryan)

<img width="1916" height="905" alt="image" src="https://github.com/user-attachments/assets/235120cd-b121-4a9d-8532-67953bac1497" />


## 🚀 The Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | Next.js 15 (App Router), React, Tailwind CSS v4 |
| Backend   | Node.js, Express, TypeScript                    |
| Real-Time | Socket.IO (WebSockets)                          |
| Database  | PostgreSQL (Hosted on Supabase)                 |
| ORM       | Prisma                                          |
| Storage   | Supabase Storage (avatars & room images)        |
| Testing   | Vitest (Backend API logic)                      |
| Auth      | JWT (JSON Web Tokens), bcrypt                   |

## 🛠 Features

**Real-Time Communication**

- Low-latency bi-directional messaging powered by Socket.IO
- Live presence tracking — online/offline status updates across all connected clients
- Live message updates and unread message counters for each room
- Get instant alerts with notification sounds

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

### 5. Log in as Cyclops

Log in with the username 'cyclops' and the password 'password123' to browse Cylops' saved chat rooms and direct messages and talk to the other X-Men!

## 🧪 Testing

Backend logic is validated using Vitest:

```bash
cd backend/src
npm run test
```

## 📈 Future Roadmap

- [ ] Load more / pagination for message history
- [ ] Media sharing
- [ ] Message reactions and replies
- [ ] Room creation and management UI
- [ ] Friend request notifications
- [ ] Mobile front-end built with React Native
