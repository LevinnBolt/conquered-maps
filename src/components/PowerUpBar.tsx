import { motion } from "framer-motion";
import { POWER_UP_DETAILS } from "@/lib/types";
import type { PowerUp } from "@/lib/types";

interface Props {
  powerUps: PowerUp[];
  onUsePowerUp: (type: string) => void;
  disabled?: boolean;
}

export default function PowerUpBar({ powerUps, onUsePowerUp, disabled }: Props) {
  return (
    <div className="flex gap-2">
      {Object.entries(POWER_UP_DETAILS).map(([key, details]) => {
        const pu = powerUps.find((p) => p.power_up_type === key);
        const qty = pu?.quantity || 0;
        return (
          <motion.button
            key={key}
            whileHover={qty > 0 && !disabled ? { scale: 1.1 } : {}}
            whileTap={qty > 0 && !disabled ? { scale: 0.9 } : {}}
            onClick={() => qty > 0 && !disabled && onUsePowerUp(key)}
            disabled={qty === 0 || disabled}
            className={`relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 border transition-all ${
              qty > 0 && !disabled
                ? "bg-secondary border-border hover:border-primary/50 cursor-pointer"
                : "bg-secondary/50 border-border/50 opacity-40 cursor-not-allowed"
            }`}
            title={`${details.name}: ${details.description}`}
          >
            <span className="text-xl">{details.icon}</span>
            <span className="text-[10px] font-display font-semibold" style={{ color: details.color }}>
              {details.name}
            </span>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {qty}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
