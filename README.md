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
├── .gitignore
└── client/                 # React (Vite) frontend
    ├── vite.config.js      # Dev server + proxy to Flask
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── ChatApp.jsx     # Main UI component
        ├── useSocket.js    # All Socket.IO logic (custom hook)
        └── Chat.css        # WhatsApp-style styling
```

---

## ⚙️ Setup & Running

### 1. Backend (Python)

```bash
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1        # Windows PowerShell
# source venv/bin/activate         # macOS/Linux

# Install dependencies
python -m pip install flask flask-socketio

# Start the backend
python app.py
```
Backend runs at → `http://localhost:5000`

### 2. Frontend (React)

```bash
cd client
npm install
npm run dev
```
Frontend runs at → `http://localhost:3000`

### 3. Open in Browser

Go to **http://localhost:3000** and enter a username.  
Open in **multiple tabs or devices** to test real-time messaging.

---

## 📡 How Frontend & Backend Connect

```
React (port 3000)
     │
     │  /socket.io/* → proxied by Vite
     ▼
Flask-SocketIO (port 5000)
```

| React emits (`useSocket.js`) | Flask handles (`app.py`) | Flask broadcasts back |
|---|---|---|
| `join` | `on_join()` | `history`, `user_event`, `online_count` |
| `send_message` | `on_send_message()` | `new_message` (to all) |
| *(disconnect)* | `on_disconnect()` | `user_event`, `online_count` |

---

## 🌐 Access from Other Devices (Same Wi-Fi)

Other devices on the same network can access the app at:
```
http://<your-local-ip>:3000
```
Find your IP with `ipconfig` (Windows) or `ifconfig` (macOS/Linux).

---

## ⚖️ Tradeoffs

| Decision | Chosen | Alternative |
|---|---|---|
| Transport | WebSockets (low latency, full duplex) | HTTP polling (simple but slow) |
| Async mode | Threading | Eventlet (deprecated) / Gevent |
| Message storage | In-memory (fast, zero setup) | Database (persistent but more setup) |
| Frontend | React + Vite (component-based) | Plain HTML/JS (simpler) |

---

## 🛠️ Tech Stack

- **Backend**: Python · Flask · Flask-SocketIO
- **Frontend**: React · Vite · socket.io-client
- **Protocol**: WebSocket (via Socket.IO)
