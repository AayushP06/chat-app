

import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

export function useSocket(username) {
  const socketRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const mySocketId = useRef(null)

  useEffect(() => {
    if (!username) return


    const socket = io('/', {
      transports: ['websocket'],  // skip long-polling, go straight to WS
    })
    socketRef.current = socket

    // ── 2. SYSTEM EVENTS ───────────────────────────────────────────────────
    socket.on('connect', () => {
      setConnected(true)
      mySocketId.current = socket.id

      // ── EMIT: 'join' → triggers on_join() on the backend
      socket.emit('join', { username })
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    // ── 3. INCOMING EVENTS FROM BACKEND ────────────────────────────────────

    // 'history' → sent only to THIS client when they join (backfill)
    socket.on('history', ({ messages: hist }) => {
      setMessages(hist.map(normalise))
    })

    // 'new_message' → broadcast from server when anyone sends a message
    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, normalise(msg, socket.id)])
    })

    // 'user_event' → join/leave notifications, broadcast to all
    socket.on('user_event', (msg) => {
      setMessages((prev) => [...prev, normalise(msg)])
    })

    // 'online_count' → updated whenever someone joins or leaves
    socket.on('online_count', ({ count }) => {
      setOnlineCount(count)
    })

    return () => socket.disconnect()
  }, [username])

  // ── 4. SEND MESSAGE: emit 'send_message' → triggers on_send_message() ──
  const sendMessage = useCallback((text) => {
    socketRef.current?.emit('send_message', { text })
  }, [])

  return { messages, onlineCount, connected, sendMessage }
}

// Attach an isMine flag so we can style our own bubbles differently
function normalise(msg, myId) {
  return {
    ...msg,
    isMine: myId && msg.self_sid === myId,
    id: Math.random().toString(36).slice(2),
  }
}
