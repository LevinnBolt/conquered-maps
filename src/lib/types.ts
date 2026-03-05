export interface Chapter {
  chapterNumber: number;
  title: string;
  questions: Question[];
  timeLimit: number;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface RoomMember {
  id: string;
  user_id: string;
  room_id: string;
  color: string;
  joined_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface UserProgress {
  id: string;
  user_id: string;
  room_id: string;
  chapter_number: number;
  status: "locked" | "available" | "conquered" | "contested";
  score: number;
  completion_time: number | null;
  points: number;
  completed_at: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  color: string;
  totalPoints: number;
  territoriesConquered: number;
}

export interface PowerUp {
  id: string;
  user_id: string;
  power_up_type: "fifty_fifty" | "time_freeze" | "double_points";
  quantity: number;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_key: string;
  earned_at: string;
}

export interface StreakData {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  total_xp: number;
  level: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  message_type: string;
  created_at: string;
}

export const USER_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

export const BADGE_DEFINITIONS: Record<string, { name: string; icon: string; description: string; color: string }> = {
  first_blood: { name: "First Blood", icon: "⚔️", description: "Conquer your first territory", color: "#ef4444" },
  speed_demon: { name: "Speed Demon", icon: "⚡", description: "Complete a quiz in under 30 seconds", color: "#f59e0b" },
  perfect_score: { name: "Perfect Score", icon: "💎", description: "Get 5/5 on any quiz", color: "#8b5cf6" },
  streak_3: { name: "On Fire", icon: "🔥", description: "3-day login streak", color: "#ef4444" },
  streak_7: { name: "Unstoppable", icon: "💪", description: "7-day login streak", color: "#f59e0b" },
  streak_30: { name: "Legend", icon: "👑", description: "30-day login streak", color: "#10b981" },
  conqueror_3: { name: "Conqueror", icon: "🏰", description: "Conquer 3 territories", color: "#3b82f6" },
  conqueror_7: { name: "Dominator", icon: "🌍", description: "Conquer all 7 territories", color: "#10b981" },
  first_to_conquer: { name: "Pioneer", icon: "🚀", description: "Be the first to conquer a territory in a room", color: "#06b6d4" },
  power_user: { name: "Power Player", icon: "🎮", description: "Use 5 power-ups", color: "#ec4899" },
  level_5: { name: "Rising Star", icon: "⭐", description: "Reach level 5", color: "#f59e0b" },
  level_10: { name: "Elite", icon: "🏆", description: "Reach level 10", color: "#8b5cf6" },
};

export const POWER_UP_DETAILS: Record<string, { name: string; icon: string; description: string; color: string }> = {
  fifty_fifty: { name: "50/50", icon: "✂️", description: "Remove 2 wrong answers", color: "#3b82f6" },
  time_freeze: { name: "Time Freeze", icon: "❄️", description: "Pause timer for 15 seconds", color: "#06b6d4" },
  double_points: { name: "Double Points", icon: "✨", description: "2x points for this quiz", color: "#f59e0b" },
};

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function levelFromXp(totalXp: number): { level: number; currentXp: number; nextLevelXp: number } {
  let level = 1;
  let xpNeeded = xpForLevel(1);
  let xpAccum = 0;
  
  while (xpAccum + xpNeeded <= totalXp) {
    xpAccum += xpNeeded;
    level++;
    xpNeeded = xpForLevel(level);
  }
  
  return {
    level,
    currentXp: totalXp - xpAccum,
    nextLevelXp: xpNeeded,
  };
}
