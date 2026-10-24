"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the effect synchronous; effects must not return a Promise.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The request failed.");
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">Q</span><span>Qwen Chat</span></div>
        <button className="new-chat" onClick={() => { setMessages([]); setError(""); }}>＋ New chat</button>
        <div className="sidebar-note">Your personal AI workspace</div>
        <div className="sidebar-bottom"><span className="status-dot" /> Model endpoint configured on server</div>
      </aside>

      <section className="chat-area">
        <header className="topbar">
          <div><div className="eyebrow">AI ASSISTANT</div><h1>Chat</h1></div>
          <div className="model-pill"><span className="status-dot" /> Qwen · Ollama API</div>
        </header>

        <div className="conversation">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon">✳</div>
              <p className="eyebrow">WELCOME TO YOUR AI</p>
              <h2>What can I help<br />you with today?</h2>
              <p className="welcome-copy">Ask a question, explore an idea, or get help with a task.</p>
              <div className="suggestions">
                {["Explain a complex topic simply", "Help me write something", "Brainstorm a new project"].map((suggestion) => (
                  <button key={suggestion} onClick={() => setInput(suggestion)}>{suggestion}<span>↗</span></button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((message, index) => (
                <article className={`message ${message.role}`} key={index}>
                  <div className="avatar">{message.role === "user" ? "Y" : "Q"}</div>
                  <div className="message-body">
                    <div className="message-role">{message.role === "user" ? "You" : "Qwen"}</div>
                    <div className="message-content">{message.content}</div>
                  </div>
                </article>
              ))}
              {busy && <article className="message assistant"><div className="avatar">Q</div><div className="message-body"><div className="message-role">Qwen</div><div className="typing"><i /><i /><i /></div></div></article>}
              <div ref={bottomRef} />
            </div>
          )}
          {error && <div className="error-box" role="alert">{error}</div>}
        </div>

        <div className="composer-wrap">
          <form className="composer" onSubmit={sendMessage}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }}
              placeholder="Message Qwen..."
              rows={1}
              maxLength={12000}
              aria-label="Message"
            />
            <button className="send-button" type="submit" disabled={busy || !input.trim()} aria-label="Send message">{busy ? "…" : "↑"}</button>
          </form>
          <p className="disclaimer">AI can make mistakes. Check important information. Press Enter to send · Shift+Enter for a new line.</p>
        </div>
      </section>
    </main>
  );
}
