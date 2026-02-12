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

export const USER_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];
