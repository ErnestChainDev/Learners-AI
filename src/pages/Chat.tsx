import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useLocation } from "react-router-dom";
import {
  Send,
  User,
  Mic,
  Image as ImageIcon,
  X,
  Paperclip,
  Link as LinkIcon,
  MessageSquare,
  Plus,
  Sparkles,
} from "lucide-react";
import { storage } from "../utils/storage";
import { useChatContext } from "../context/chat-context";

/* ─── Types ────────────────────────────────────────────────────────────── */
type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatOut = { reply: string };
type ApiError = { detail?: string; message?: string };
type AttachmentItem = { id: string; file: File; kind: "image" | "file" };
type ChatRouteState = { openRecent?: boolean; forceNew?: boolean };

/* ─── Constants ─────────────────────────────────────────────────────────── */
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const CHAT_BASE = `${API_BASE}/chat`;

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg: "#FFFDF5",
  fg: "#1E293B",
  muted: "#F1F5F9",
  mutedFg: "#64748B",
  accent: "#8B5CF6",
  accentFg: "#FFFFFF",
  pink: "#F472B6",
  yellow: "#FBBF24",
  mint: "#34D399",
  border: "#E2E8F0",
  white: "#FFFFFF",
  shadow: "4px 4px 0px 0px #1E293B",
  shadowSm: "2px 2px 0px 0px #1E293B",
  shadowLg: "6px 6px 0px 0px #1E293B",
  shadowAccent: "4px 4px 0px 0px #8B5CF6",
  fontHead: '"Outfit", system-ui, sans-serif',
  fontBody: '"Plus Jakarta Sans", system-ui, sans-serif',
} as const;

/* ─── Google Fonts injection ─────────────────────────────────────────────── */
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getAuthHeaders(): HeadersInit {
  const token = storage.getToken();
  const user = storage.getUser();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (user?.id !== undefined && user?.id !== null) headers["X-User-ID"] = String(user.id);
  return headers;
}

async function safeJson<T = unknown>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as ApiError).detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function findLastEmptyChatIndex(history: ChatMessage[][]) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if ((history[i] ?? []).length === 0) return i;
  }
  return -1;
}

function getChatTitle(msgs: ChatMessage[], idx: number): string {
  const first = msgs.find((m) => m.role === "user");
  if (first) return first.content.slice(0, 32) + (first.content.length > 32 ? "…" : "");
  return `Chat ${idx + 1}`;
}

/* ─── Keyframe styles injected once ────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('${FONT_LINK}');

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes popIn {
    0%   { opacity: 0; transform: scale(0.85) translateY(8px); }
    70%  { transform: scale(1.03) translateY(-2px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes blink {
    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
    40%            { transform: scale(1);   opacity: 1; }
  }

  @keyframes slideInLeft {
    from { transform: translateX(-100%); }
    to   { transform: translateX(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25%       { transform: rotate(6deg); }
    75%       { transform: rotate(-6deg); }
  }

  .chat-dot { animation: blink 1.4s infinite ease-in-out both; }
  .chat-dot:nth-child(2) { animation-delay: 0.2s; }
  .chat-dot:nth-child(3) { animation-delay: 0.4s; }

  .chat-msg-row { animation: popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }

  .chat-send-btn:not(:disabled):hover {
    transform: translate(-2px, -2px);
    box-shadow: ${T.shadowLg} !important;
  }
  .chat-send-btn:not(:disabled):active {
    transform: translate(2px, 2px);
    box-shadow: ${T.shadowSm} !important;
  }

  .chat-icon-btn:hover { background: ${T.muted}; }
  .chat-icon-btn:hover svg { animation: wiggle 0.4s ease; }

  .chat-composer-shell:focus-within {
    border-color: ${T.accent} !important;
    box-shadow: ${T.shadowAccent} !important;
  }

  .chat-sidebar-item:hover {
    background: ${T.muted};
    transform: translateX(3px);
  }
  .chat-sidebar-item.active {
    background: ${T.muted};
    border-left: 3px solid ${T.accent};
  }

  textarea:focus { outline: none; }
  textarea::placeholder { color: ${T.mutedFg}; }

  @media (prefers-reduced-motion: reduce) {
    .chat-msg-row, .chat-dot, .chat-send-btn, .chat-icon-btn svg {
      animation: none !important;
      transition: none !important;
    }
  }

  @media (max-width: 768px) {
    .chat-send-btn:not(:disabled):hover {
      transform: none;
      box-shadow: ${T.shadow} !important;
    }
  }
`;

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function Chat() {
  const location = useLocation();

  const {
    chatHistory,
    activeChatIndex,
    setActiveMessages,
    setChatHistory,
    setActiveChatIndex,
    newChat,
  } = useChatContext();

  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* touch-swipe state */
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const attachInputRef = useRef<HTMLInputElement | null>(null);
  const handledLocationKeyRef = useRef<string | null>(null);

  /* inject fonts & keyframes once */
  useEffect(() => {
    const id = "chat-geo-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = GLOBAL_STYLES;
    document.head.appendChild(el);
  }, []);

  /* prefill from localStorage */
  useEffect(() => {
    const saved = localStorage.getItem("ai_prefill");
    if (saved) {
      setInput(saved);
      localStorage.removeItem("ai_prefill");
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, []);

  const messages = useMemo<ChatMessage[]>(() => {
    return activeChatIndex !== null ? (chatHistory[activeChatIndex] ?? []) : [];
  }, [activeChatIndex, chatHistory]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, []);

  useEffect(() => {
    const currentKey = location.key || "default";
    if (handledLocationKeyRef.current === currentKey) return;
    handledLocationKeyRef.current = currentKey;
    const state = (location.state as ChatRouteState | null) ?? null;
    if (state?.openRecent) { setLoadingHistory(false); return; }
    if (chatHistory.length === 0) {
      setChatHistory([[]]); setActiveChatIndex(0); setLoadingHistory(false); return;
    }
    const emptyIndex = findLastEmptyChatIndex(chatHistory);
    if (emptyIndex !== -1) setActiveChatIndex(emptyIndex); else newChat();
    setLoadingHistory(false);
  }, [chatHistory, location.key, location.state, newChat, setActiveChatIndex, setChatHistory]);

  useEffect(() => { scrollToBottom(); }, [messages, sending, scrollToBottom]);
  useEffect(() => { resizeTextarea(); }, [input, resizeTextarea]);

  /* ── Touch swipe handlers ───────────────────────────────────────────── */
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current ?? 0));
    if (dx > 60 && dy < 60) setSidebarOpen(true);   // swipe right → open
    if (dx < -60 && dy < 60) setSidebarOpen(false);  // swipe left  → close
    touchStartX.current = null;
    touchStartY.current = null;
  }

  /* ── Attachment helpers ─────────────────────────────────────────────── */
  function addFiles(fileList: FileList | null, kind: "image" | "file") {
    if (!fileList || fileList.length === 0) return;
    const next = Array.from(fileList).map((file, i) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${i}`, file, kind,
    }));
    setAttachments((prev) => [...prev, ...next]);
  }

  function handleAttachPick(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) { e.target.value = ""; return; }
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const rest = Array.from(files).filter((f) => !f.type.startsWith("image/"));
    if (imgs.length > 0) { const dt = new DataTransfer(); imgs.forEach((f) => dt.items.add(f)); addFiles(dt.files, "image"); }
    if (rest.length > 0) { const dt = new DataTransfer(); rest.forEach((f) => dt.items.add(f)); addFiles(dt.files, "file"); }
    e.target.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }

  /* ── Send ───────────────────────────────────────────────────────────── */
  async function sendMessage() {
    const text = input.trim();
    if ((!text && attachments.length === 0) || sending) return;
    if (!API_BASE) { setError("VITE_API_BASE_URL is not set."); return; }

    const attachmentText = attachments.length > 0
      ? "\n\nAttachments:\n" + attachments.map((item) =>
          `- ${item.file.name} (${item.kind}, ${formatFileSize(item.file.size)})`).join("\n")
      : "";

    const finalText = `${text}${attachmentText}`.trim();
    const userMessage: ChatMessage = { role: "user", content: finalText };
    const optimisticMessages = [...messages, userMessage];

    setActiveMessages(optimisticMessages);
    setInput("");
    setAttachments([]);
    setSending(true);
    setError("");

    try {
      const res = await fetch(`${CHAT_BASE}/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: finalText }),
      });
      const data = await safeJson<ChatOut | ApiError>(res);
      if (!res.ok) throw new Error(getErrorMessage(data, "Failed to send message"));
      const reply = data && typeof data === "object" && "reply" in data && typeof data.reply === "string"
        ? data.reply : "Sorry, I couldn't generate a reply.";
      setActiveMessages([...optimisticMessages, { role: "assistant" as const, content: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send message";
      setActiveMessages([...optimisticMessages, { role: "assistant" as const, content: `Error: ${msg}` }]);
      setError(msg);
    } finally {
      setSending(false);
      requestAnimationFrame(() => { resizeTextarea(); textareaRef.current?.focus(); });
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); sendMessage(); }
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const showHero = !loadingHistory && messages.length === 0;
  const canSend = !sending && (input.trim().length > 0 || attachments.length > 0);

  /* ── Sub-renders ────────────────────────────────────────────────────── */

  const renderAttachments = () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 12px 0" }}>
      {attachments.map((item) => (
        <div key={item.id} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: T.muted, border: `2px solid ${T.border}`,
          borderRadius: 10, padding: "4px 8px",
          fontFamily: T.fontBody, fontSize: 12, color: T.fg,
        }}>
          <span style={{ color: T.accent, display: "flex" }}>
            {item.kind === "image" ? <ImageIcon size={12} strokeWidth={2.5} /> : <Paperclip size={12} strokeWidth={2.5} />}
          </span>
          <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.file.name}
          </span>
          <span style={{ color: T.mutedFg }}>{formatFileSize(item.file.size)}</span>
          <button
            type="button"
            onClick={() => removeAttachment(item.id)}
            aria-label="Remove"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: T.mutedFg, display: "flex", alignItems: "center" }}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  );

  const renderComposer = (mode: "hero" | "bottom") => (
    <form onSubmit={onSubmit} style={{
      width: "100%",
      maxWidth: mode === "hero" ? 720 : "100%",
      margin: mode === "hero" ? "0 auto" : undefined,
    }}>
      <div className="chat-composer-shell" style={{
        background: T.white,
        border: `2px solid ${T.border}`,
        borderRadius: 20,
        boxShadow: T.shadow,
        transition: "box-shadow 0.2s, border-color 0.2s",
        overflow: "hidden",
      }}>
        {attachments.length > 0 && renderAttachments()}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask me anything…"
          rows={1}
          disabled={sending}
          style={{
            width: "100%",
            padding: "14px 16px 4px",
            background: "transparent",
            border: "none",
            resize: "none",
            fontFamily: T.fontBody,
            fontSize: 15,
            color: T.fg,
            lineHeight: 1.6,
            minHeight: 44,
            maxHeight: 180,
          }}
        />

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px 10px",
        }}>
          {/* Left */}
          <button
            type="button"
            className="chat-icon-btn"
            aria-label="Attach"
            onClick={() => attachInputRef.current?.click()}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              border: `2px solid ${T.border}`,
              background: T.white, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: T.mutedFg, transition: "background 0.2s",
            }}
          >
            <LinkIcon size={16} strokeWidth={2.5} />
          </button>

          {/* Right */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="chat-icon-btn"
              aria-label="Voice"
              style={{
                width: 36, height: 36, borderRadius: "50%",
                border: `2px solid ${T.border}`,
                background: T.white, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: T.mutedFg, transition: "background 0.2s",
              }}
            >
              <Mic size={17} strokeWidth={2.5} />
            </button>

            <button
              type="submit"
              className="chat-send-btn"
              disabled={!canSend}
              aria-label="Send"
              style={{
                height: 36, paddingInline: 18,
                borderRadius: 999,
                background: canSend ? T.accent : T.muted,
                border: `2px solid ${canSend ? T.fg : T.border}`,
                boxShadow: canSend ? T.shadow : "none",
                color: canSend ? T.white : T.mutedFg,
                cursor: canSend ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: T.fontBody, fontWeight: 600, fontSize: 14,
                transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s, background 0.2s",
              }}
            >
              <Send size={15} strokeWidth={2.5} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          marginTop: 8, padding: "8px 14px",
          background: "#FEF2F2", border: `2px solid #FECACA`,
          borderRadius: 12, boxShadow: "2px 2px 0 #FCA5A5",
          fontFamily: T.fontBody, fontSize: 13, color: "#DC2626",
        }}>
          {error}
        </div>
      )}
    </form>
  );

  /* ── Mobile Sidebar ─────────────────────────────────────────────────── */
  const renderMobileSidebar = () => (
    <>
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(30,41,59,0.4)",
            zIndex: 40, animation: "fadeIn 0.2s ease",
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: 280,
        background: T.bg,
        borderRight: `2px solid ${T.border}`,
        boxShadow: sidebarOpen ? "8px 0 32px rgba(30,41,59,0.15)" : "none",
        zIndex: 50,
        display: "flex", flexDirection: "column",
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        overflowY: "auto",
      }}>
        {/* Sidebar header */}
        <div style={{
          padding: "20px 16px 12px",
          borderBottom: `2px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: T.accent, border: `2px solid ${T.fg}`,
              boxShadow: T.shadowSm,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={14} strokeWidth={2.5} color={T.white} />
            </div>
            <span style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: 16, color: T.fg }}>
              Chats
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.mutedFg, display: "flex" }}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* New chat */}
        <div style={{ padding: "12px 16px" }}>
          <button
            onClick={() => { newChat(); setSidebarOpen(false); }}
            style={{
              width: "100%", padding: "10px 16px",
              background: T.yellow, border: `2px solid ${T.fg}`,
              borderRadius: 12, boxShadow: T.shadowSm,
              fontFamily: T.fontBody, fontWeight: 600, fontSize: 14, color: T.fg,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              transition: "transform 0.15s",
            }}
          >
            <Plus size={16} strokeWidth={2.5} /> New Chat
          </button>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, padding: "0 8px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
          {chatHistory.map((msgs, idx) => (
            <button
              key={idx}
              className={`chat-sidebar-item ${idx === activeChatIndex ? "active" : ""}`}
              onClick={() => { setActiveChatIndex(idx); setSidebarOpen(false); }}
              style={{
                width: "100%", padding: "10px 12px",
                background: "none", border: "none", cursor: "pointer",
                borderRadius: 10, textAlign: "left",
                display: "flex", alignItems: "center", gap: 10,
                fontFamily: T.fontBody, fontSize: 13, color: T.fg,
                transition: "background 0.15s, transform 0.15s",
                borderLeft: idx === activeChatIndex ? `3px solid ${T.accent}` : "3px solid transparent",
              }}
            >
              <MessageSquare size={14} strokeWidth={2.5} color={T.mutedFg} />
              <span style={{
                flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontWeight: idx === activeChatIndex ? 600 : 400,
              }}>
                {getChatTitle(msgs, idx)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  /* ── Message bubble ─────────────────────────────────────────────────── */
  const renderMessage = (msg: ChatMessage, idx: number) => {
    const isUser = msg.role === "user";

    return (
      <div
        key={`${msg.role}-${idx}-${msg.content.slice(0, 20)}`}
        className="chat-msg-row"
        style={{
          display: "flex",
          flexDirection: isUser ? "row-reverse" : "row",
          alignItems: "flex-start",
          gap: 10,
          maxWidth: "100%",
          animationDelay: `${idx * 0.03}s`,
        }}
      >
        {/* Avatar icon */}
        <div style={{
          flexShrink: 0, width: 34, height: 34, borderRadius: "50%",
          background: isUser ? T.fg : T.accent,
          border: `2px solid ${T.fg}`,
          boxShadow: T.shadowSm,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginTop: 2,
        }}>
          {isUser
            ? <User size={15} strokeWidth={2.5} color={T.white} />
            : <Sparkles size={15} strokeWidth={2.5} color={T.white} />}
        </div>

        {/* Bubble */}
        <div style={{
          maxWidth: "min(75%, 680px)",
          background: isUser ? T.fg : T.white,
          border: `2px solid ${isUser ? T.fg : T.border}`,
          borderRadius: isUser
            ? "20px 4px 20px 20px"
            : "4px 20px 20px 20px",
          boxShadow: isUser ? T.shadowSm : `4px 4px 0 ${T.border}`,
          padding: "12px 16px",
          color: isUser ? T.white : T.fg,
          fontFamily: T.fontBody,
          fontSize: 15,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}>
          {msg.content}
        </div>
      </div>
    );
  };

  /* ── Root render ────────────────────────────────────────────────────── */
  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        minHeight: "100%", width: "100%",
        background: T.bg,
        fontFamily: T.fontBody,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <input
        ref={attachInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
        multiple
        style={{ display: "none" }}
        onChange={handleAttachPick}
      />

      {/* Mobile sidebar */}
      {renderMobileSidebar()}

      {/* ── HERO ── */}
      {showHero ? (
        <div style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "32px 20px 80px",
          position: "relative", overflow: "hidden",
        }}>
          {/* Decorative background shapes */}
          <div style={{
            position: "absolute", top: "8%", left: "5%",
            width: 120, height: 120, borderRadius: "50%",
            background: T.yellow, opacity: 0.35,
            border: `2px solid ${T.yellow}`,
          }} />
          <div style={{
            position: "absolute", bottom: "12%", right: "6%",
            width: 80, height: 80, borderRadius: "50%",
            background: T.mint, opacity: 0.3,
          }} />
          <div style={{
            position: "absolute", top: "18%", right: "10%",
            width: 50, height: 50,
            background: T.pink, opacity: 0.25,
            transform: "rotate(20deg)", borderRadius: 10,
          }} />
          <div style={{
            position: "absolute", bottom: "20%", left: "8%",
            width: 40, height: 40,
            background: T.accent, opacity: 0.2,
            transform: "rotate(-15deg)", borderRadius: 8,
          }} />

          {/* AI badge */}
          <div style={{
            marginBottom: 28,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: T.accent,
              border: `3px solid ${T.fg}`,
              boxShadow: T.shadowLg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={30} strokeWidth={2.5} color={T.white} />
            </div>

            <div style={{ textAlign: "center" }}>
              <h1 style={{
                fontFamily: T.fontHead,
                fontWeight: 800,
                fontSize: "clamp(28px, 5vw, 44px)",
                color: T.fg,
                margin: 0, lineHeight: 1.15, letterSpacing: "-0.5px",
              }}>
                Ask me anything,{" "}
                <span style={{
                  color: T.accent,
                  display: "inline-block",
                  borderBottom: `3px solid ${T.yellow}`,
                }}>
                  privately
                </span>
              </h1>
              <p style={{
                marginTop: 10, fontFamily: T.fontBody,
                fontSize: 16, color: T.mutedFg, fontWeight: 500,
              }}>
                Your personal AI — always ready, never judging.
              </p>
            </div>
          </div>

          {/* Composer */}
          {renderComposer("hero")}

          {/* Quick suggestions */}
          <div style={{
            marginTop: 20, display: "flex", flexWrap: "wrap",
            gap: 8, justifyContent: "center", maxWidth: 680,
          }}>
            {["Explain a concept", "Help me write", "Solve a problem", "Summarize this"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                style={{
                  padding: "7px 14px",
                  background: T.white, border: `2px solid ${T.border}`,
                  borderRadius: 999, boxShadow: T.shadowSm,
                  fontFamily: T.fontBody, fontSize: 13, color: T.mutedFg,
                  cursor: "pointer", fontWeight: 500,
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = T.accent;
                  (e.currentTarget as HTMLButtonElement).style.color = T.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                  (e.currentTarget as HTMLButtonElement).style.color = T.mutedFg;
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <p style={{
            marginTop: 32, fontFamily: T.fontBody,
            fontSize: 12, color: T.mutedFg, textAlign: "center",
          }}>
            Learner's AI is in beta and can make mistakes. Review responses carefully.
          </p>
        </div>
      ) : (
        /* ── CONVERSATION ── */
        <div style={{
          display: "flex", flexDirection: "column",
          height: "100vh", maxWidth: 860, margin: "0 auto",
          padding: "0 16px",
        }}>
          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "24px 0 16px",
            display: "flex", flexDirection: "column", gap: 18,
            scrollbarWidth: "thin",
            scrollbarColor: `${T.border} transparent`,
          }}>
            {loadingHistory ? (
              <div style={{
                textAlign: "center", padding: 40,
                fontFamily: T.fontBody, color: T.mutedFg, fontSize: 15,
              }}>
                Loading conversation…
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => renderMessage(msg, idx))}

                {/* Typing indicator */}
                {sending && (
                  <div className="chat-msg-row" style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: T.accent, border: `2px solid ${T.fg}`,
                      boxShadow: T.shadowSm, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Sparkles size={15} strokeWidth={2.5} color={T.white} />
                    </div>
                    <div style={{
                      background: T.white,
                      border: `2px solid ${T.border}`,
                      borderRadius: "4px 20px 20px 20px",
                      boxShadow: `4px 4px 0 ${T.border}`,
                      padding: "14px 20px",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="chat-dot" style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: T.accent, display: "inline-block",
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Sticky composer */}
          <div style={{
            paddingBottom: 20, paddingTop: 8,
            background: `linear-gradient(to bottom, transparent, ${T.bg} 30%)`,
          }}>
            {renderComposer("bottom")}
            <p style={{
              textAlign: "center", marginTop: 8,
              fontFamily: T.fontBody, fontSize: 11, color: T.mutedFg,
            }}>
              Learner's AI is in beta — review responses carefully.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}