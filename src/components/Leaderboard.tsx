import { motion } from "framer-motion";
import { Trophy, Crown, Target } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/types";

interface Props {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

export default function Leaderboard({ entries, currentUserId }: Props) {
  const sorted = [...entries].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Trophy className="w-5 h-5 text-contested" />
        <h3 className="font-display font-semibold">Leaderboard</h3>
      </div>

      <div className="divide-y divide-border">
        {sorted.map((entry, i) => {
          const isMe = entry.user_id === currentUserId;
          return (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 ${isMe ? "bg-primary/10" : ""}`}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                {i === 0 ? (
                  <Crown className="w-5 h-5 mx-auto text-contested" />
                ) : (
                  <span className="font-mono text-sm text-muted-foreground">#{i + 1}</span>
                )}
              </div>

              {/* Color dot + name */}
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex-1 min-w-0">
                <span className={`text-sm truncate block ${isMe ? "font-semibold" : ""}`}>
                  {entry.username}
                  {isMe && " (you)"}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-sm shrink-0">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Target className="w-3.5 h-3.5" />
                  {entry.territoriesConquered}
                </span>
                <span className="font-mono font-bold text-xp w-12 text-right">
                  {entry.totalPoints}
                </span>
              </div>
            </motion.div>
          );
        })}

        {sorted.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No scores yet. Be the first to conquer!
          </div>
        )}
      </div>
    </div>
  );
}
