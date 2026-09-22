"use client";

import Image from "next/image";
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

const QUICK_REPLIES = [
  { icon: "🛍️", label: "Ver productos" },
  { icon: "📦", label: "Rastrear pedido" },
  { icon: "💳", label: "Métodos de pago" },
  { icon: "📞", label: "Contactar asesor" },
] as const;

function saludoInicial() {
  const hora = new Date().getHours();
  const momento = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  return `${momento}! 👋 Soy tu asistente virtual de ElectroHome. ¿En qué puedo ayudarte?`;
}

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
          setMessages([{ role: "assistant", content: saludoInicial() }]);
        }
      })
      .catch(() => {
        setMessages([{ role: "assistant", content: saludoInicial() }]);
      });
  }, [open, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const enviarMensaje = async (text: string) => {
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    enviarMensaje(input.trim());
  };

  return (
    <div className="fixed right-5 bottom-20 z-[2147483647] lg:bottom-5">
      {open && (
        <div className="chat-message mb-7.5 flex h-150 max-h-[calc(100vh-140px)] w-100 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3),0_0_1px_rgba(0,0,0,0.2)] dark:bg-slate-900">
          <div className="flex items-center justify-between bg-linear-to-br from-blue-600 to-blue-700 px-5 py-4.5 text-white">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <Image src="/img/chat2-bot.webp" alt="AJ-Bot" fill className="object-cover" />
              </div>
              <div>
                <div className="font-semibold">AJ-Bot</div>
                <div className="text-xs text-white/80">● En línea</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition duration-200 hover:rotate-90 hover:scale-110 hover:bg-white/25"
            >
              ✕
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-linear-to-b from-gray-50 to-white p-5 dark:from-slate-800 dark:to-slate-900"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-message max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${
                  m.role === "user"
                    ? "self-end rounded-br-md bg-linear-to-br from-blue-500 to-blue-600 text-white"
                    : "self-start rounded-bl-md border border-gray-200 bg-white text-gray-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                }`}
                // El backend a veces embebe HTML (ej. botón de WhatsApp) en la
                // respuesta del bot — no en los mensajes del usuario.
                {...(m.role === "assistant"
                  ? { dangerouslySetInnerHTML: { __html: m.content } }
                  : { children: m.content })}
              />
            ))}
            {sending && (
              <div className="chat-message flex max-w-[70px] items-center gap-1.5 self-start rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:border-slate-600 dark:bg-slate-700">
                <span className="chat-typing-dot h-2 w-2 rounded-full bg-gray-400 dark:bg-slate-500" />
                <span className="chat-typing-dot h-2 w-2 rounded-full bg-gray-400 [animation-delay:0.2s] dark:bg-slate-500" />
                <span className="chat-typing-dot h-2 w-2 rounded-full bg-gray-400 [animation-delay:0.4s] dark:bg-slate-500" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 bg-gray-50 px-5 pb-2.5 dark:bg-slate-800">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => enviarMensaje(q.label)}
                disabled={sending}
                className="rounded-full border-2 border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:border-blue-400 hover:text-blue-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-300"
              >
                {q.icon} {q.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex gap-2.5 bg-gray-50 p-4 dark:bg-slate-800">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-gray-800 shadow-[0_0_0_1px_rgba(59,130,246,0.03)] focus:border-blue-400 focus:outline-none dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)] transition hover:-translate-y-0.5 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-[0_4px_12px_rgba(16,185,129,0.4)] disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        className="chatbot-toggle-btn flex h-15 w-15 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-blue-700 text-[28px] text-white shadow-[0_8px_24px_rgba(37,99,235,0.4)]"
      >
        💬
      </button>
    </div>
  );
}
