import { motion } from "framer-motion";
import { BADGE_DEFINITIONS } from "@/lib/types";

interface Props {
  badgeKey: string;
  onClose: () => void;
}

export default function AchievementToast({ badgeKey, onClose }: Props) {
  const badge = BADGE_DEFINITIONS[badgeKey];
  if (!badge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.9 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-card border-2 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-4"
      style={{ borderColor: badge.color }}
      onClick={onClose}
    >
      <div className="text-4xl animate-bounce">{badge.icon}</div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-display">Achievement Unlocked!</p>
        <p className="font-display font-bold text-lg" style={{ color: badge.color }}>{badge.name}</p>
        <p className="text-xs text-muted-foreground">{badge.description}</p>
      </div>
    </motion.div>
  );
}
