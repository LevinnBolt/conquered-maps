import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGameData } from "@/hooks/useGameData";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, Trophy, Target, Clock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import XPBar from "@/components/XPBar";
import StreakDisplay from "@/components/StreakDisplay";
import { BADGE_DEFINITIONS } from "@/lib/types";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { achievements, streak } = useGameData();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalQuizzes: 0, totalConquered: 0, totalPoints: 0, avgTime: 0, roomsJoined: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profRes, progressRes, memberRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("progress").select("*").eq("user_id", user.id),
        supabase.from("room_members").select("*").eq("user_id", user.id),
      ]);
      if (profRes.data) setProfile(profRes.data);
      if (progressRes.data) {
        const completed = progressRes.data.filter((p: any) => p.status === "conquered" || p.status === "contested");
        const conquered = progressRes.data.filter((p: any) => p.status === "conquered");
        const totalPoints = progressRes.data.reduce((acc: number, p: any) => acc + (p.points || 0), 0);
        const times = completed.filter((p: any) => p.completion_time).map((p: any) => p.completion_time);
        setStats({
          totalQuizzes: completed.length,
          totalConquered: conquered.length,
          totalPoints,
          avgTime: times.length ? Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length) : 0,
          roomsJoined: memberRes.data?.length || 0,
        });
      }
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-display font-semibold">Player Profile</h2>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center glow-primary">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{profile?.username || "Player"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <XPBar totalXp={streak?.total_xp || 0} />
        </motion.div>

        {/* Stats grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Trophy, label: "Total Points", value: stats.totalPoints, color: "text-contested" },
            { icon: Target, label: "Conquered", value: stats.totalConquered, color: "text-conquered" },
            { icon: Clock, label: "Avg Time", value: `${stats.avgTime}s`, color: "text-primary" },
            { icon: Flame, label: "Rooms Joined", value: stats.roomsJoined, color: "text-xp" },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
              <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
              <p className="font-display text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Streak */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StreakDisplay currentStreak={streak?.current_streak || 0} longestStreak={streak?.longest_streak || 0} />
        </motion.div>

        {/* Achievements */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-contested" /> Achievements
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(BADGE_DEFINITIONS).map(([key, badge]) => {
              const earned = achievements.some((a) => a.badge_key === key);
              return (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  className={`rounded-xl p-3 text-center border transition-all ${
                    earned ? "bg-secondary border-border" : "bg-secondary/30 border-border/30 opacity-40"
                  }`}
                >
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <p className="text-[10px] font-display font-semibold" style={{ color: earned ? badge.color : undefined }}>
                    {badge.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{badge.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
