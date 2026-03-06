// frontend/src/components/AITutorDrawer.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Send, Sparkles, Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { sendMessageToAI } from "@/lib/ai";
import { getAccessToken } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function chatFetch(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as Record<string, string> || {}) };
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE}${url}`, { ...options, headers, credentials: "include" });
}

interface AITutorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

interface ConversationSummary {
  id: number;
  topic: string | null;
  preview: string;
  message_count: number;
  created_at: string | null;
}

const AITutorDrawer: React.FC<AITutorDrawerProps> = ({ open, onOpenChange }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [sheetHeight, setSheetHeight] = useState<string>("100%");

  // Load conversations when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      loadConversations();
    }
  }, [open]);

  // Set initial sidebar state when drawer opens (closed→open transition only)
  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      // Drawer just opened
      setSidebarOpen(!isMobile);
    }
    prevOpen.current = open;
  }, [open, isMobile]);

  // Track visual viewport height to handle mobile keyboard
  useEffect(() => {
    if (!isMobile || !open) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      setSheetHeight(`${vv.height}px`);
    };
    // Set initial
    onResize();
    vv.addEventListener("resize", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      setSheetHeight("100%");
    };
  }, [isMobile, open]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const res = await chatFetch("/ai/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  const loadConversation = useCallback(async (convId: number) => {
    try {
      const res = await chatFetch(`/ai/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        const msgs: Message[] = (data.messages || []).map((m: any) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant",
          text: m.content,
          createdAt: m.created_at,
        }));
        setMessages(msgs);
        setActiveConvId(convId);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }, []);

  const deleteConversation = useCallback(async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await chatFetch(`/ai/conversations/${convId}`, { method: "DELETE" });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== convId));
        if (activeConvId === convId) {
          setMessages([]);
          setActiveConvId(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }, [activeConvId]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveConvId(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `${Date.now()}-u`,
      role: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await sendMessageToAI(trimmed, { conversation_id: activeConvId });

      // Update active conversation ID (first message auto-creates a conversation)
      if (result.conversation_id && !activeConvId) {
        setActiveConvId(result.conversation_id);
      }

      const assistantMsg: Message = {
        id: `${Date.now()}-a`,
        role: "assistant",
        text: result.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Refresh conversation list
      loadConversations();
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-e`,
        role: "assistant",
        text: "There was an error contacting the AI. Try again later.",
        createdAt: new Date().toISOString(),
      }]);
      console.error("askAI error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const showWelcome = messages.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0" style={{ width: sidebarOpen ? 580 : 420, maxWidth: "95vw", transition: "width 0.2s ease", height: isMobile ? sheetHeight : undefined, top: "auto", bottom: 0 }}>
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setSidebarOpen(prev => !prev)}
              title={sidebarOpen ? "Hide history" : "Show history"}
            >
              {isMobile
                ? (sidebarOpen ? <X size={14} /> : <Menu size={14} />)
                : (sidebarOpen ? <X size={14} /> : <Menu size={14} />)
              }
            </Button>
            <Sparkles size={16} />
            AI Tutor
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex min-h-0">
          {/* Conversation Sidebar */}
          {sidebarOpen && (
            <>
              {/* Mobile: backdrop overlay */}
              {isMobile && (
                <div
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                    zIndex: 40,
                  }}
                />
              )}
              <div
                className="border-r flex flex-col bg-muted/30"
                style={isMobile ? {
                  position: "fixed", top: 0, left: 0, bottom: 0,
                  width: "80%", maxWidth: 280, zIndex: 50,
                  background: "hsl(var(--card))",
                  boxShadow: "4px 0 20px rgba(0,0,0,0.3)",
                } : {
                  width: 180, minWidth: 180,
                }}
              >
                <div className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs h-8"
                    onClick={startNewChat}
                  >
                    <Plus size={12} />
                    New Chat
                  </Button>
                </div>

                <ScrollArea className="flex-1 px-1">
                  {loadingConvs && conversations.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
                  )}
                  {!loadingConvs && conversations.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4 px-2">
                      No conversations yet. Start chatting!
                    </div>
                  )}
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`group flex items-start gap-2 px-2 py-2 rounded-md cursor-pointer text-xs transition-colors mb-0.5 ${activeConvId === conv.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-muted-foreground"
                        }`}
                    >
                      <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium leading-tight">
                          {conv.preview || conv.topic || "New conversation"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-between">
                          <span>{formatDate(conv.created_at)}</span>
                          <span>{conv.message_count} msgs</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => deleteConversation(conv.id, e)}
                      >
                        <Trash2 size={10} />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="px-4 py-2 h-full" ref={scrollRef as any}>
              <div className="space-y-3">
                {showWelcome && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles size={20} className="text-primary" />
                    </div>
                    <div className="text-sm font-medium">AI Tutor</div>
                    <div className="text-xs text-muted-foreground text-center max-w-[280px]">
                      I can help you understand concepts, debug code, or plan your learning. What would you like to learn today?
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-md p-3 max-w-[85%] ${m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                      }`}
                  >
                    <div className="text-xs text-muted-foreground mb-1">{m.role === "user" ? "You" : "Tutor"}</div>
                    <div className="text-sm">
                      {m.role === "user" ? (
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && <p className="text-xs text-muted-foreground mt-2 text-center">Thinking...</p>}
              </div>
            </ScrollArea>

            <div className="p-4 border-t flex items-center gap-2">
              <Input
                ref={inputRef as any}
                placeholder="Ask the AI tutor..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={(e) => {
                  if (isMobile) {
                    // Prevent the browser from scrolling the entire page
                    setTimeout(() => {
                      e.target.scrollIntoView({ block: "nearest", behavior: "smooth" });
                    }, 300);
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={loading || input.trim() === ""} aria-label="Send to AI">
                <Send size={16} />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center px-4 pb-3">
              AI Tutor is here to help with concepts, code, and learning strategies.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AITutorDrawer;
