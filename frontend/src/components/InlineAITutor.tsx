// frontend/src/components/InlineAITutor.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, Send, X, Trash2, ChevronDown, ChevronUp, Lightbulb, Code2, Cpu } from "lucide-react";
import { streamContextualMessage } from "@/lib/ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// ─── Types ────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface InlineAITutorProps {
  /** Whether the tutor panel is open */
  open: boolean;
  /** Callback to toggle the panel */
  onToggle: () => void;
  /** Context type: "playground" or "system_design" */
  contextType: "playground" | "system_design";
  /** Current code in the editor (playground) */
  code?: string;
  /** Current language (playground) */
  language?: string;
  /** Current system design state (system_design) */
  systemDesignState?: Record<string, unknown>;
  /** Optional className for positioning */
  className?: string;
}

// ─── Quick actions per context ────────────────────────────────────────────
const PLAYGROUND_ACTIONS = [
  { icon: "🐛", label: "Debug", prompt: "Debug my code and explain any errors" },
  { icon: "💡", label: "Explain", prompt: "Explain what this code does step by step" },
  { icon: "🚀", label: "Optimize", prompt: "Suggest optimizations for my code" },
  { icon: "📝", label: "Complexity", prompt: "What is the time and space complexity?" },
];

const SYSDESIGN_ACTIONS = [
  { icon: "🔍", label: "Analyze", prompt: "Analyze my system design and identify potential issues" },
  { icon: "📈", label: "Scale", prompt: "How can I scale this design to handle 10x traffic?" },
  { icon: "🔌", label: "Bottleneck", prompt: "Where are the bottlenecks in my architecture?" },
  { icon: "💰", label: "Cost", prompt: "How can I reduce the cost of this architecture?" },
];

// ─── Component ────────────────────────────────────────────────────────────
const InlineAITutor: React.FC<InlineAITutorProps> = ({
  open,
  onToggle,
  contextType,
  code,
  language,
  systemDesignState,
  className = "",
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<number | null>(null);
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const quickActions = contextType === "playground" ? PLAYGROUND_ACTIONS : SYSDESIGN_ACTIONS;

  const handleSend = useCallback(async (messageText?: string) => {
    const trimmed = (messageText || input).trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: `${Date.now()}-u`, role: "user", text: trimmed };
    const assistantMsgId = `${Date.now()}-a`;
    const placeholderMsg: Message = { id: assistantMsgId, role: "assistant", text: "" };

    setMessages(prev => [...prev, userMsg, placeholderMsg]);
    setInput("");
    setLoading(true);

    try {
      await streamContextualMessage(
        trimmed,
        (tokenText: string) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsgId ? { ...m, text: m.text + tokenText } : m
            )
          );
        },
        (fullText: string, conversationId: number | null) => {
          if (fullText) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMsgId ? { ...m, text: fullText } : m
              )
            );
          }
          if (conversationId && !convId) {
            setConvId(conversationId);
          }
          setLoading(false);
        },
        {
          context_type: contextType,
          code: code,
          language: language,
          system_design_state: systemDesignState,
        },
        { conversation_id: convId }
      );
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, text: "There was an error contacting the AI. Try again later." }
            : m
        )
      );
      console.error("Inline tutor stream error:", err);
      setLoading(false);
    }
  }, [input, loading, contextType, code, language, systemDesignState, convId]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConvId(null);
  };

  if (!open) return null;

  const isPlayground = contextType === "playground";

  return (
    <div className={`iat-panel ${minimized ? "iat-minimized" : ""} ${className}`}>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="iat-header" onClick={() => minimized && setMinimized(false)}>
        <div className="iat-header-left">
          <div className="iat-icon-glow">
            <Sparkles size={14} />
          </div>
          <span className="iat-title">AI Tutor</span>
          <span className="iat-context-badge">
            {isPlayground ? (
              <><Code2 size={10} /> Code</>
            ) : (
              <><Cpu size={10} /> Design</>
            )}
          </span>
        </div>
        <div className="iat-header-actions">
          {messages.length > 0 && !minimized && (
            <button className="iat-header-btn" onClick={clearChat} title="Clear chat">
              <Trash2 size={12} />
            </button>
          )}
          <button className="iat-header-btn" onClick={() => setMinimized(prev => !prev)} title={minimized ? "Expand" : "Minimize"}>
            {minimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button className="iat-header-btn" onClick={onToggle} title="Close AI Tutor">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Body (hidden when minimized) ────────────────── */}
      {!minimized && (
        <div className="iat-body">
          {/* Messages scroll area */}
          <div className="iat-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="iat-welcome">
                <div className="iat-welcome-icon">
                  <Sparkles size={22} />
                </div>
                <div className="iat-welcome-title">
                  {isPlayground ? "Code Assistant" : "Design Advisor"}
                </div>
                <div className="iat-welcome-desc">
                  {isPlayground
                    ? "I can see your code! Ask me to debug, explain, optimize, or help you learn."
                    : "I can see your architecture! Ask about bottlenecks, scaling, or design patterns."
                  }
                </div>

                {/* Quick actions */}
                <div className="iat-quick-actions">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      className="iat-quick-btn"
                      onClick={() => handleSend(action.prompt)}
                      disabled={loading}
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`iat-msg ${m.role}`}>
                <div className="iat-msg-label">
                  {m.role === "user" ? "You" : (
                    <><Sparkles size={10} /> Tutor</>
                  )}
                </div>
                <div className="iat-msg-content">
                  {m.role === "user" ? (
                    <span>{m.text}</span>
                  ) : m.text ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="iat-typing">
                      <span className="iat-typing-dot" />
                      <span className="iat-typing-dot" />
                      <span className="iat-typing-dot" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.text && (
              <div className="iat-thinking">Thinking...</div>
            )}
          </div>

          {/* Quick actions row when conversation is active */}
          {messages.length > 0 && (
            <div className="iat-quick-row">
              {quickActions.slice(0, 3).map((action, i) => (
                <button
                  key={i}
                  className="iat-quick-chip"
                  onClick={() => handleSend(action.prompt)}
                  disabled={loading}
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="iat-input-area">
            <input
              ref={inputRef}
              className="iat-input"
              placeholder={isPlayground ? "Ask about your code..." : "Ask about your design..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
            <button
              className="iat-send-btn"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineAITutor;
