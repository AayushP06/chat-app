from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from datetime import datetime, timezone
import threading

app = Flask(__name__)
app.config["SECRET_KEY"] = "chatapp-secret-2026"
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")


connected_users = {}    
message_history = []      
pending_disconnects = {}  
MAX_HISTORY = 50
RECONNECT_GRACE = 5.0    


def now_str():
    return datetime.now(timezone.utc).strftime("%H:%M")




@app.route("/")
def index():
    return render_template("index.html")




@socketio.on("connect")
def on_connect():
    """Client connected — we wait for them to send a 'join' event with a username."""
    pass


@socketio.on("join")
def on_join(data):
    """Client sends {username} after choosing a name."""
    username = (data.get("username") or "Anonymous").strip()[:24]
    sid = request.sid
    connected_users[sid] = username

    
    if username in pending_disconnects:
       
        pending_disconnects.pop(username).cancel()
        
        emit("history", {"messages": message_history})
        socketio.emit("online_count", {"count": len(connected_users)})
        return


    emit("history", {"messages": message_history})

    event_msg = {
        "type": "event",
        "text": f"{username} joined the chat",
        "timestamp": now_str(),
    }
    _store(event_msg)
    emit("user_event", event_msg, broadcast=True)
    socketio.emit("online_count", {"count": len(connected_users)})


@socketio.on("send_message")
def on_send_message(data):
    """Client sends {text}."""
    sid = request.sid
    username = connected_users.get(sid, "Anonymous")
    text = (data.get("text") or "").strip()

    if not text:
        return

    msg = {
        "type": "message",
        "username": username,
        "text": text,
        "timestamp": now_str(),
        "self_sid": sid,
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
        event_msg = {
            "type": "event",
            "text": f"{username} left the chat",
            "timestamp": now_str(),
        }
        _store(event_msg)
        socketio.emit("user_event", event_msg)

    timer = threading.Timer(RECONNECT_GRACE, broadcast_leave)
    pending_disconnects[username] = timer
    timer.start()




def _store(msg):
    message_history.append(msg)
    if len(message_history) > MAX_HISTORY:
        message_history.pop(0)




if __name__ == "__main__":
    print("🚀  Chat server running → http://localhost:5000")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
