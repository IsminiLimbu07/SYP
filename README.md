AshaSetu

**Bridging communities with health and hope** — a community health platform built for Nepal.

AshaSetu is a mobile application designed to connect people in Nepal through essential health services: blood donation coordination, medical fundraising, community events, and real-time communication — all in one place.

---

## 📱 Features

| Feature | Description |
|---|---|
| 🩸 **Blood Donation** | Request and coordinate blood donations within the community |
| 💰 **Medical Fundraising** | Create and manage medical fundraising campaigns (admin-approved) |
| 📅 **Community Events** | Volunteer-created events for health awareness and outreach |
| 💬 **Real-Time Chat** | Community chat rooms with REST-based polling |
| 🔔 **Push Notifications** | Instant alerts via Expo Push API |
| 💳 **Khalti Payments** | Integrated Nepali payment gateway for donations |
| 🔐 **JWT Authentication** | Secure token-based auth with role management |

---

## ScreenShots
<img width="480" height="1144" alt="1776264354146" src="https://github.com/user-attachments/assets/fa14e29c-a6d4-4343-9702-b13c36dbf87b" />

<img width="444" height="1536" alt="1776264354403" src="https://github.com/user-attachments/assets/a9483e83-0feb-4750-ad16-7fa017a1abcb" />

<img width="442" height="1536" alt="1776264359709" src="https://github.com/user-attachments/assets/f5e0d22d-c985-4eff-819a-c88e3fd1e3af" />

<img width="480" height="1440" alt="1776264357523" src="https://github.com/user-attachments/assets/ce53e255-e3fb-465a-8ea4-eff5c60dad22" />

<img width="480" height="1040" alt="1776264356114" src="https://github.com/user-attachments/assets/da35a997-e4c1-4b67-9bae-c4da6159b7d2" />

<img width="480" height="1040" alt="1776264356248" src="https://github.com/user-attachments/assets/b1808388-91e8-4635-a75b-82dd34e31aaa" />


## 🛠️ Tech Stack

### Frontend
- **React Native** (Expo) — cross-platform mobile app
- **Expo Push API** — push notification delivery
- **React Navigation** — screen and header management

### Backend
- **Node.js + Express** — REST API server
- **PostgreSQL** (Neon) — cloud-hosted relational database
- **Multer** — image upload handling
- **JWT** — authentication and authorization

### Infrastructure & Tools
- **Render** — backend deployment
- **Neon** — serverless PostgreSQL hosting
- **Khalti** — payment gateway (sandbox + production)
- **Ngrok** — local development tunneling

---

## 🏗️ Architecture

```
AshaSetu/
├── frontend/               # React Native / Expo app
│   ├── screens/            # App screens (Home, Chat, Events, etc.)
│   ├── navigation/         # AppNavigator and route config
│   └── services/           # API calls and utilities
│
├── backend/                # Node.js / Express REST API
│   ├── routes/             # API route definitions
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth, upload, error handling
│   └── db/                 # Database connection and queries
```

---

## 👥 Team


| **Ismini** | Backend Architecture & API Integration |
| **Niroj Bhandari** | Frontend Development |
| **Urgen Gurung** | Frontend Development |
| **Rhythm Thapa** | Frontend Development |

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- Expo CLI (`npm install -g expo-cli`)
- PostgreSQL database (or Neon account)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL=your_neon_postgres_url
JWT_SECRET=your_jwt_secret
KHALTI_SECRET_KEY=your_khalti_key
PORT=5000
```

Start the server:

```bash
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
```

Update `BASE_URL` in your API config to point to your backend (local or deployed):

```js
// services/api.js
export const BASE_URL = "https://your-backend.onrender.com";
```

Start the Expo app:

```bash
npx expo start
```

---

## 🗄️ Database

The database uses **PostgreSQL** hosted on **Neon**. Key tables include:

- `users` — user accounts with `is_admin` boolean role
- `blood_requests` — blood donation requests
- `fundraising_campaigns` — medical campaigns (admin-approved)
- `community_events` — events (volunteer-only creation)
- `volunteer_requests` — volunteer approval workflow
- `chat_rooms` / `messages` — community chat
- `expo_push_tokens` — push notification tokens

All timestamps use `TIMESTAMPTZ` and are stored in UTC, displayed in `Asia/Kathmandu`.

---

## 🔒 Roles & Permissions

| Role | Permissions |
|---|---|
| **User** | View content, donate blood, donate to campaigns |
| **Volunteer** | Create community events, access volunteer features |
| **Admin** | Approve campaigns, manage users and volunteers |

---

## 📦 Deployment

- **Backend** is deployed on [Render](https://render.com)
- **Database** is hosted on [Neon](https://neon.tech)
- **Frontend** is distributed via Expo Go / EAS Build

---

## 📄 License

This project was developed as a Second Year Project at **London Metropolitan University** via **Itahari International College**, Dharan, Nepal.

Made with ❤️ for the communities of Nepal
