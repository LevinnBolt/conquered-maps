import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { PowerUp, Achievement, StreakData } from "@/lib/types";

export function useGameData() {
  const { user } = useAuth();
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [newBadge, setNewBadge] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;

    const [puRes, achRes, strRes] = await Promise.all([
      supabase.from("power_ups").select("*").eq("user_id", user.id),
      supabase.from("achievements").select("*").eq("user_id", user.id),
      supabase.from("streaks").select("*").eq("user_id", user.id).single(),
    ]);

    if (puRes.data) setPowerUps(puRes.data as PowerUp[]);
    if (achRes.data) setAchievements(achRes.data as Achievement[]);
    if (strRes.data) setStreak(strRes.data as StreakData);

    // Initialize streak if not exists
    if (strRes.error && strRes.error.code === "PGRST116") {
      await supabase.from("streaks").insert({ user_id: user.id });
      const { data } = await supabase.from("streaks").select("*").eq("user_id", user.id).single();
      if (data) setStreak(data as StreakData);
    }

    // Grant starter power-ups if empty
    if (!puRes.data || puRes.data.length === 0) {
      await supabase.rpc("grant_starter_power_ups", { _user_id: user.id });
      const { data } = await supabase.from("power_ups").select("*").eq("user_id", user.id);
      if (data) setPowerUps(data as PowerUp[]);
    }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const updateStreak = useCallback(async () => {
    if (!user || !streak) return;

    const today = new Date().toISOString().split("T")[0];
    if (streak.last_active_date === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const newStreak = streak.last_active_date === yesterday ? streak.current_streak + 1 : 1;
    const newLongest = Math.max(newStreak, streak.longest_streak);

    await supabase
      .from("streaks")
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_active_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    setStreak((s) => s ? { ...s, current_streak: newStreak, longest_streak: newLongest, last_active_date: today } : s);

    // Check streak achievements
    if (newStreak >= 3) await awardBadge("streak_3");
    if (newStreak >= 7) await awardBadge("streak_7");
    if (newStreak >= 30) await awardBadge("streak_30");
  }, [user, streak]);

  const addXP = useCallback(async (amount: number) => {
    if (!user || !streak) return;
    const newTotal = streak.total_xp + amount;
    await supabase.from("streaks").update({ total_xp: newTotal }).eq("user_id", user.id);
    setStreak((s) => s ? { ...s, total_xp: newTotal } : s);
  }, [user, streak]);

  const awardBadge = useCallback(async (badgeKey: string) => {
    if (!user) return;
    if (achievements.find((a) => a.badge_key === badgeKey)) return;

    const { error } = await supabase.from("achievements").insert({ user_id: user.id, badge_key: badgeKey });
    if (!error) {
      setNewBadge(badgeKey);
      setAchievements((prev) => [...prev, { id: "", user_id: user.id, badge_key: badgeKey, earned_at: new Date().toISOString() }]);
      setTimeout(() => setNewBadge(null), 4000);
    }
  }, [user, achievements]);

  const usePowerUp = useCallback(async (type: string) => {
    if (!user) return false;
    const pu = powerUps.find((p) => p.power_up_type === type);
    if (!pu || pu.quantity <= 0) return false;

    await supabase.from("power_ups").update({ quantity: pu.quantity - 1 }).eq("user_id", user.id).eq("power_up_type", type);
    setPowerUps((prev) => prev.map((p) => p.power_up_type === type ? { ...p, quantity: p.quantity - 1 } : p));
    return true;
  }, [user, powerUps]);

  return { powerUps, achievements, streak, newBadge, setNewBadge, updateStreak, addXP, awardBadge, usePowerUp, reload: loadAll };
}
