# chatApp | Real-Time Messaging Engine
A full-stack communication platform built to explore event-driven architecture and relational data modeling. This project was developed as part of a #100DaysOfCode sprint to bridge the gap between rapid agency delivery and deep-dive technical architecture.

## 🚀 The Tech Stack
Frontend: Next.js 14 (App Router), React, Tailwind CSS

Backend: Node.js, Express, TypeScript

Real-Time: Socket.IO (WebSockets)

Database: PostgreSQL (Hosted on Supabase)

ORM: Prisma

Testing: Vitest (Backend API logic)

Auth: JWT (JSON Web Tokens)

## 🛠 Features
Real-Time Bi-directional Communication: Low-latency messaging powered by Socket.IO.

Presence Tracking: Real-time online/offline status updates using socket events.

Relational Data Persistence: Robust PostgreSQL schema managed via Prisma for user profiles, chat history, and relationships.

Secure Authentication: Protected API routes and socket handshakes using JWT.

Responsive Architecture: Mobile-first UI built with Tailwind CSS and Next.js.

## 📂 Project Structure
backend/: Express entry point, Prisma schema, API routes, middleware, and Vitest suite.

frontend/: Next.js App Router, modular React components, and TypeScript interfaces.

README.md: Project documentation.

## 🚦 Getting Started
Prerequisites
Node.js (v18+)

PostgreSQL instance

1. Clone & Install

Bash
git clone https://github.com/dannykryan/chatApp.git
cd chatApp

# Install Backend

cd backend/src && npm install

# Install Frontend

cd ../../frontend && npm install

2. Environment Configuration
Create a .env file in backend/src/:

Code snippet

DATABASE_URL="postgresql://user:password@localhost:5432/yourdb"

JWT_SECRET="your_secure_random_string"

PORT=4000

3. Database Initialization

Bash
npx prisma migrate dev --name init

4. Run the Application

Backend: npm start (Runs on port 4000)

Frontend: npm run dev (Runs on port 3000)

## 📈 Future Roadmap

[ ] Message Persistence: Implement "Load More" pagination for historical chat data.

[ ] Media Support: Integration with Supabase image buckets for image sharing.

[ ] Ability to share more types of media securely.

[ ] Mobile front-end built with React Native.

## 🧪 Testing
Backend logic is validated using Vitest:

Bash
cd backend/src
npm run test