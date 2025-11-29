// frontend/src/components/AITutorDrawer.tsx
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Send, Sparkles } from "lucide-react";
import { askAI } from "@/lib/ai";

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

const AITutorDrawer: React.FC<AITutorDrawerProps> = ({ open, onOpenChange }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm your AI tutor. I can help you understand concepts, debug code, or plan your learning. What would you like to learn today?",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const addMessage = (msg: Message) => setMessages((p) => [...p, msg]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `${Date.now()}-u`,
      role: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);
    setInput("");
    setLoading(true);

    try {
      // askAI is typed to return Promise<string>, so result is string
      const result = await askAI(trimmed);

      // Defensive fallback: ensure replyText is a string
      const replyText = typeof result === "string" ? result : String(result ?? "Sorry, no response.");

      const assistantMsg: Message = {
        id: `${Date.now()}-a`,
        role: "assistant",
        text: replyText,
        createdAt: new Date().toISOString(),
      };
      addMessage(assistantMsg);
    } catch (err) {
      addMessage({
        id: `${Date.now()}-e`,
        role: "assistant",
        text: "There was an error contacting the AI. Try again later.",
        createdAt: new Date().toISOString(),
      });
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-[420px] max-w-full">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles size={16} />
            AI Tutor
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* cast ref as any because ScrollArea may not forward HTMLDivElement type */}
          <ScrollArea className="px-4 py-2 h-full" ref={scrollRef as any}>
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">
                  Ask me a question about concepts, code, or study plans.
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-md p-3 max-w-[85%] ${
                    m.role === "user" ? "ml-auto bg-yellow-100 text-black" : "mr-auto bg-slate-100 text-slate-900"
                  }`}
                >
                  <div className="text-xs text-muted-foreground mb-1">{m.role === "user" ? "You" : "Tutor"}</div>
                  <div className="text-sm whitespace-pre-wrap">{m.text}</div>
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
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={loading || input.trim() === ""} aria-label="Send to AI">
              <Send size={16} />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center px-4 pb-4">
            AI Tutor is here to help with concepts, code, and learning strategies.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AITutorDrawer;
