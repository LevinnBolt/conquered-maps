import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoomMember } from "@/lib/types";

interface Props {
  roomId: string;
  members: RoomMember[];
  isOpen: boolean;
  onToggle: () => void;
}

interface ChatMsg {
  id: string;
  user_id: string;
  message: string;
  message_type: string;
  created_at: string;
}

export default function RoomChat({ roomId, members, isOpen, onToggle }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data as ChatMsg[]);
    };
    loadMessages();

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMsg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    await supabase.from("chat_messages").insert({
      room_id: roomId,
      user_id: user.id,
      message: input.trim(),
      message_type: "text",
    });
    setInput("");
  };

  const getMember = (userId: string) => members.find((m) => m.user_id === userId);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <MessageCircle className="w-5 h-5 text-primary-foreground" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed bottom-4 left-4 w-[320px] h-[450px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <h4 className="font-display text-sm font-semibold">Squad Chat</h4>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => {
          const member = getMember(msg.user_id);
          const isMe = msg.user_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%]">
                {!isMe && (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: member?.color || "#666" }} />
                    <span className="text-[10px] text-muted-foreground">{member?.profile?.username || "Unknown"}</span>
                  </div>
                )}
                <div className={`rounded-xl px-3 py-1.5 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-secondary border-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <Button onClick={sendMessage} size="icon" className="rounded-lg h-9 w-9 shrink-0" disabled={!input.trim()}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
