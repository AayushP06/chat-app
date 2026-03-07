import { useState, useRef, useEffect } from 'react'
import { useSocket } from './useSocket'
import './Chat.css'

// Helper: get initials for avatar
function initials(name) {
  return name ? name[0].toUpperCase() : '?'
}

export default function ChatApp() {
  const [username, setUsername]   = useState('')
  const [draft, setDraft]         = useState('')
  const [joined, setJoined]       = useState(false)
  const [inputName, setInputName] = useState('')
  const bottomRef = useRef(null)

  const { messages, onlineCount, connected, sendMessage } = useSocket(joined ? username : null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleJoin(e) {
    e.preventDefault()
    if (inputName.trim()) {
      setUsername(inputName.trim())
      setJoined(true)
    }
  }

  function handleSend(e) {
    e.preventDefault()
    if (draft.trim()) {
      sendMessage(draft.trim())
      setDraft('')
    }
  }

  // ── Username Screen ───────────────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="join-screen">
        <div className="join-card">
          <div className="join-icon">💬</div>
          <h1>SocketChat</h1>
          <p>Real-time chat · Python + React</p>
          <form onSubmit={handleJoin}>
            <input
              autoFocus
              maxLength={24}
              placeholder="Enter your name…"
              value={inputName}
              onChange={e => setInputName(e.target.value)}
            />
            <button type="submit">Continue →</button>
          </form>
        </div>
      </div>
    )
  }

  // ── Chat Screen ───────────────────────────────────────────────────────────
  return (
    <div className="chat-layout">

      {/* ── Left Sidebar ── */}
      <aside className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-avatar">{initials(username)}</div>
          <span className="sidebar-title">SocketChat</span>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <input placeholder="🔍  Search or start new chat" readOnly />
        </div>

        {/* Room entry */}
        <div className="room-entry">
          <div className="room-avatar">🌐</div>
          <div className="room-info">
            <div className="room-name">General</div>
            <div className="room-last">
              {messages.filter(m => m.type === 'message').slice(-1)[0]?.text || 'No messages yet'}
            </div>
          </div>
          <div className="room-badge">{onlineCount}</div>
        </div>

        {/* My profile footer */}
        <div className="sidebar-bottom">
          <div className="my-avatar">{initials(username)}</div>
          <div className="my-info">
            <div className="my-name">{username}</div>
            <div className="my-status">● Online</div>
          </div>
        </div>
      </aside>

      {/* ── Chat Area ── */}
      <main className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-avatar">🌐</div>
          <div className="chat-header-info">
            <div className="chat-header-name">General</div>
            <div className="chat-header-sub">{onlineCount} participant{onlineCount !== 1 ? 's' : ''} online</div>
          </div>
          <div className="header-icons">
            {/* Video icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            {/* Phone icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.35 2 2 0 0 1 3.57 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 15.92z"/>
            </svg>
            {/* More icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </div>
          <span className={`conn-badge ${connected ? 'ok' : 'err'}`}>
            {connected ? '● Connected' : '● Reconnecting'}
          </span>
        </header>

        {/* Messages */}
        <div className="msg-list">
          {messages.length === 0 && (
            <div className="empty-hint">🔒 Messages are end-to-end encrypted. Say hello!</div>
          )}

          {messages.map((msg) => {
            if (msg.type === 'event') {
              return (
                <div key={msg.id} className="msg-event">
                  {msg.text}
                </div>
              )
            }

            return (
              <div key={msg.id} className={`msg-row ${msg.isMine ? 'mine' : 'theirs'}`}>
                {!msg.isMine && (
                  <div className="msg-author">{msg.username}</div>
                )}
                <div className="bubble">
                  <div className="bubble-text">{msg.text}</div>
                  <div className="bubble-footer">
                    <span className="bubble-time">{msg.timestamp}</span>
                    {msg.isMine && <span className="tick sent">✓✓</span>}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <footer className="input-bar">
          <form onSubmit={handleSend}>
            {/* Emoji icon */}
            <span className="input-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </span>
            {/* Attachment icon */}
            <span className="input-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </span>

            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Type a message"
              maxLength={500}
            />

            {/* Send / Mic button */}
            {draft.trim() ? (
              <button type="submit" className="send-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            ) : (
              <button type="button" className="send-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            )}
          </form>
        </footer>
      </main>
    </div>
  )
}
