from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import threading
import os

app = Flask(__name__)
app.config["SECRET_KEY"] = "chatapp-secret-2026"

# SQLite locally by default — no setup needed.
# To use PostgreSQL in production, set DATABASE_URL env var.
db_url = os.environ.get("DATABASE_URL", "sqlite:///chat.db")
# SQLAlchemy requires 'postgresql://' not 'postgres://' (Render uses the old style)
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Render PostgreSQL requires SSL; pool_pre_ping handles dropped connections
if "postgresql" in db_url:
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "connect_args": {"sslmode": "require"},
    }

db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")


# ── MODEL ──────────────────────────────────────────────────────────────────────
class Message(db.Model):
    id        = db.Column(db.Integer, primary_key=True)
    type      = db.Column(db.String(10))          # 'message' or 'event'
    username  = db.Column(db.String(50))
    text      = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.String(5))           # stored as "HH:MM"

    def to_dict(self):
        return {
            "type":      self.type,
            "username":  self.username,
            "text":      self.text,
            "timestamp": self.timestamp,
        }


with app.app_context():
    db.create_all()


# ── IN-MEMORY STATE (unchanged) ─────────────────────────────────────────────
connected_users    = {}
pending_disconnects = {}
MAX_HISTORY        = 50
RECONNECT_GRACE    = 5.0


def now_str():
    return datetime.now(timezone.utc).strftime("%H:%M")


def _store(msg: dict):
    """Persist a message to DB, keeping only the last MAX_HISTORY rows."""
    entry = Message(
        type=msg.get("type"),
        username=msg.get("username"),
        text=msg["text"],
        timestamp=msg["timestamp"],
    )
    db.session.add(entry)
    db.session.commit()

    # Trim oldest rows beyond MAX_HISTORY
    total = Message.query.count()
    if total > MAX_HISTORY:
        oldest = Message.query.order_by(Message.id).limit(total - MAX_HISTORY).all()
        for row in oldest:
            db.session.delete(row)
        db.session.commit()


def _get_history():
    rows = Message.query.order_by(Message.id).all()
    return [r.to_dict() for r in rows]


# ── ROUTES ──────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/db-check")
def db_check():
    from flask import jsonify
    total = Message.query.count()
    last5 = [m.to_dict() for m in Message.query.order_by(Message.id.desc()).limit(5).all()]
    return jsonify({"total_messages": total, "last_5": last5})


# ── SOCKET EVENTS ────────────────────────────────────────────────────────────
@socketio.on("connect")
def on_connect():
    pass


@socketio.on("join")
def on_join(data):
    username = (data.get("username") or "Anonymous").strip()[:24]
    sid = request.sid
    connected_users[sid] = username

    if username in pending_disconnects:
        pending_disconnects.pop(username).cancel()
        emit("history", {"messages": _get_history()})
        socketio.emit("online_count", {"count": len(connected_users)})
        return

    emit("history", {"messages": _get_history()})

    event_msg = {"type": "event", "text": f"{username} joined the chat", "timestamp": now_str()}
    _store(event_msg)
    emit("user_event", event_msg, broadcast=True)
    socketio.emit("online_count", {"count": len(connected_users)})


@socketio.on("send_message")
def on_send_message(data):
    sid = request.sid
    username = connected_users.get(sid, "Anonymous")
    text = (data.get("text") or "").strip()
    if not text:
        return

    msg = {
        "type":      "message",
        "username":  username,
        "text":      text,
        "timestamp": now_str(),
        "self_sid":  sid,
    }
    _store({k: v for k, v in msg.items() if k != "self_sid"})
    emit("new_message", msg, broadcast=True)


@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid
    username = connected_users.pop(sid, None)
    if not username:
        return

    socketio.emit("online_count", {"count": len(connected_users)})

    def broadcast_leave():
        pending_disconnects.pop(username, None)
        event_msg = {"type": "event", "text": f"{username} left the chat", "timestamp": now_str()}
        _store(event_msg)
        socketio.emit("user_event", event_msg)

    timer = threading.Timer(RECONNECT_GRACE, broadcast_leave)
    pending_disconnects[username] = timer
    timer.start()


# ── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀  Chat server running → http://localhost:{port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=False)
