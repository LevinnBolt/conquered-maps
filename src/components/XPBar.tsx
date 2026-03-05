import { motion } from "framer-motion";
import { levelFromXp } from "@/lib/types";

interface Props {
  totalXp: number;
  compact?: boolean;
}

export default function XPBar({ totalXp, compact }: Props) {
  const { level, currentXp, nextLevelXp } = levelFromXp(totalXp);
  const percent = Math.min((currentXp / nextLevelXp) * 100, 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-xp/20 flex items-center justify-center">
          <span className="text-[10px] font-display font-bold text-xp">{level}</span>
        </div>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-xp to-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{currentXp}/{nextLevelXp}</span>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-xp/20 flex items-center justify-center glow-xp">
            <span className="font-display font-bold text-xp">{level}</span>
          </div>
          <div>
            <p className="font-display text-sm font-semibold">Level {level}</p>
            <p className="text-xs text-muted-foreground">{totalXp} total XP</p>
          </div>
        </div>
        <span className="text-sm font-mono text-muted-foreground">{currentXp}/{nextLevelXp} XP</span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-xp to-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
