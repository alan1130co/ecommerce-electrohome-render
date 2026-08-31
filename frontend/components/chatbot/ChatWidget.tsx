"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  success: boolean;
  response: string;
  session_id: string;
  needs_agent: boolean;
  redirect_url?: string;
}

const SESSION_STORAGE_KEY = "electrohome-chat-session-id";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cargar/crear sesión y su historial solo al abrir por primera vez.
  useEffect(() => {
    if (!open || sessionId) return;

    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    setSessionId(id);

    fetch(`/chatbot/historial/${id}/`)
      .then((res) => (res.ok ? res.json() : { history: [] }))
      .then((data: { history?: { role: string; content: string }[] }) => {
        if (data.history?.length) {
          setMessages(data.history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
        } else {
          setMessages([
            {
              role: "assistant",
              content: "¡Hola! Soy Electro, el asistente virtual de ElectroHome 😊 ¿En qué te puedo ayudar?",
            },
          ]);
        }
      })
      .catch(() => {
        setMessages([
          { role: "assistant", content: "¡Hola! Soy Electro 😊 ¿En qué te puedo ayudar?" },
        ]);
      });
  }, [open, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !sessionId || sending) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/chatbot/api/message/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      const data: ChatResponse = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.response }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Tuve un problema técnico momentáneo. Intenta de nuevo." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between rounded-t-lg bg-blue-700 px-4 py-3 text-white">
            <span className="font-semibold">Electro — Asistente ElectroHome</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar chat">
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  m.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
                // El backend a veces embebe HTML (ej. botón de WhatsApp) en la
                // respuesta del bot — no en los mensajes del usuario.
                {...(m.role === "assistant"
                  ? { dangerouslySetInnerHTML: { __html: m.content } }
                  : { children: m.content })}
              />
            ))}
            {sending && <div className="text-xs text-gray-400">Electro está escribiendo...</div>}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir chat"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-2xl text-white shadow-lg hover:bg-blue-800"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
