import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface Props {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakDisplay({ currentStreak, longestStreak }: Props) {
  const flames = Math.min(currentStreak, 7);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display text-sm font-semibold flex items-center gap-2">
          <Flame className="w-4 h-4 text-destructive" />
          Daily Streak
        </h4>
        <span className="text-xs text-muted-foreground">Best: {longestStreak} days</span>
      </div>

      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`flex-1 h-8 rounded-lg flex items-center justify-center text-lg ${
              i < flames ? "bg-destructive/20" : "bg-secondary"
            }`}
          >
            {i < flames ? "🔥" : "⬜"}
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <span className="font-display text-2xl font-bold text-destructive">{currentStreak}</span>
        <span className="text-sm text-muted-foreground ml-1">day{currentStreak !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}
