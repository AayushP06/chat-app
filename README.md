# 💬 SocketChat — Real-Time Chat App

A full-stack real-time chat application built with **Python (Flask + Socket.IO)** on the backend and **React (Vite)** on the frontend, with a WhatsApp-inspired dark UI.

---

## 🚀 Features

- ⚡ Real-time messaging via WebSockets
- 👥 Multi-user support with join/leave notifications
- 🔄 Page reload doesn't trigger false "left" notifications (5s grace period)
- 📜 Chat history (last 50 messages) loaded on join
- 🌐 LAN-accessible — works without internet on the same Wi-Fi
- 💬 WhatsApp-style UI (dark mode, bubble tails, double ticks, online count)

---

## 🗂️ Project Structure

```
chat app/
├── app.py                  # Flask + Socket.IO backend
├── requirements.txt        # Python dependencies
├── Procfile                # Start command for Railway/Render
├── .gitignore
└── client/                 # React (Vite) frontend
    ├── vite.config.js      # Dev server + proxy to Flask
    ├── vercel.json         # Vercel deployment config
    ├── .env.development    # Dev env (no URL needed, proxy handles it)
    ├── .env.production     # Production env (set VITE_BACKEND_URL here)
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── ChatApp.jsx     # Main UI component
        ├── useSocket.js    # All Socket.IO logic (custom hook)
        └── Chat.css        # WhatsApp-style styling
```

---

## ⚙️ Local Development

### 1. Backend (Python)

```bash
python -m venv venv
.\venv\Scripts\Activate.ps1        # Windows PowerShell

pip install -r requirements.txt

python app.py
# → http://localhost:5000
```

### 2. Frontend (React)

```bash
cd client
npm install
npm run dev
# → http://localhost:3000
```

---

## 🚢 Deployment (Split)

> Frontend → **Vercel** | Backend → **Railway** (or Render/Fly.io)

### Step 1 — Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub Repo**
2. Select this repo, Railway auto-detects Python via `Procfile`
3. After deploy, copy your backend URL (e.g. `https://your-app.railway.app`)

### Step 2 — Set Production Frontend URL

Edit `client/.env.production`:
```
VITE_BACKEND_URL=https://your-app.railway.app
```
> ⚠️ This file is gitignored — set it as a **Vercel Environment Variable** instead (see Step 3).

### Step 3 — Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **New Project → Import Git Repo**
2. Set **Root Directory** to `client`
3. Add an **Environment Variable**:
   - Key: `VITE_BACKEND_URL`
   - Value: your Railway backend URL
4. Deploy — Vercel uses `vercel.json` for config automatically

### Step 4 — Add CORS Origin to Backend

In `app.py`, update CORS to allow your Vercel frontend:
```python
socketio = SocketIO(app, cors_allowed_origins="https://your-app.vercel.app", async_mode="threading")
```

---

## 📡 How Frontend & Backend Connect

```
React (Vercel)
     │
     │  socket.io → VITE_BACKEND_URL (Railway)
     ▼
Flask-SocketIO (Railway)
```

| React emits (`useSocket.js`) | Flask handles (`app.py`) | Flask broadcasts back |
|---|---|---|
| `join` | `on_join()` | `history`, `user_event`, `online_count` |
| `send_message` | `on_send_message()` | `new_message` (to all) |
| *(disconnect)* | `on_disconnect()` | `user_event`, `online_count` |

---

## ⚖️ Tradeoffs

| Decision | Chosen | Alternative |
|---|---|---|
| Transport | WebSockets (low latency, full duplex) | HTTP polling (simple but slow) |
| Async mode | Threading | Eventlet / Gevent |
| Message storage | In-memory (fast, zero setup) | Database (persistent but more setup) |
| Frontend | React + Vite (component-based) | Plain HTML/JS (simpler) |
| Deployment | Split (Vercel + Railway) | Single server (simpler, but no WS on Vercel) |

---

## 🛠️ Tech Stack

- **Backend**: Python · Flask · Flask-SocketIO
- **Frontend**: React · Vite · socket.io-client
- **Protocol**: WebSocket (via Socket.IO)
- **Hosting**: Vercel (frontend) + Railway (backend)
