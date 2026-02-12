import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TerritoryMap from "@/components/TerritoryMap";
import QuizPanel from "@/components/QuizPanel";
import Leaderboard from "@/components/Leaderboard";
import SyllabusUpload from "@/components/SyllabusUpload";
import type { Chapter, UserProgress, RoomMember, LeaderboardEntry } from "@/lib/types";

export default function RoomView() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Chapter | null>(null);
  const [activeChapterNum, setActiveChapterNum] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const chapters: Chapter[] = room?.syllabus_data?.chapters || [];

  const loadRoom = useCallback(async () => {
    if (!roomId || !user) return;

    const { data: roomData } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();
    setRoom(roomData);

    const { data: membersData } = await supabase
      .from("room_members")
      .select("*, profiles:user_id(username, avatar_url)")
      .eq("room_id", roomId);

    if (membersData) {
      setMembers(
        membersData.map((m: any) => ({
          ...m,
          profile: m.profiles,
        }))
      );
    }

    const { data: progressData } = await supabase
      .from("progress")
      .select("*")
      .eq("room_id", roomId);
    if (progressData) setProgress(progressData as UserProgress[]);

    setLoading(false);
  }, [roomId, user]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // Realtime subscriptions
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "progress", filter: `room_id=eq.${roomId}` }, () => {
        loadRoom();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` }, () => {
        loadRoom();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, loadRoom]);

  const handleSelectTerritory = (chapterNum: number) => {
    const chapter = chapters[chapterNum - 1];
    if (!chapter) return;
    setActiveChapterNum(chapterNum);
    setActiveQuiz(chapter);
  };

  const handleQuizComplete = async (score: number, timeTaken: number) => {
    if (!user || !roomId) return;

    const status = score >= 3 ? "conquered" : "contested";
    const timeLimit = activeQuiz?.timeLimit || 120;
    const timeBonus = Math.max(0, Math.floor((timeLimit - timeTaken) / 10));

    // Check if first to complete
    const existingCompletions = progress.filter(
      (p) => p.chapter_number === activeChapterNum && (p.status === "conquered" || p.status === "contested")
    );
    const firstBonus = existingCompletions.length === 0 ? 50 : 0;
    const totalPoints = score * 10 + timeBonus + firstBonus;

    // Upsert progress
    const { error } = await supabase.from("progress").upsert(
      {
        user_id: user.id,
        room_id: roomId,
        chapter_number: activeChapterNum,
        status,
        score,
        completion_time: timeTaken,
        points: totalPoints,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,room_id,chapter_number" }
    );

    if (error) {
      toast.error("Failed to save progress");
      return;
    }

    // Make next chapter available if conquered
    if (status === "conquered" && activeChapterNum < 7) {
      const nextChapter = activeChapterNum + 1;
      const existingNext = progress.find(
        (p) => p.user_id === user.id && p.chapter_number === nextChapter
      );
      if (!existingNext) {
        await supabase.from("progress").insert({
          user_id: user.id,
          room_id: roomId,
          chapter_number: nextChapter,
          status: "available",
        });
      }
    }

    if (firstBonus > 0) {
      toast.success(`First conqueror bonus! +${firstBonus} points`);
    }

    loadRoom();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room?.room_code || "");
    toast.success("Room code copied!");
  };

  // Build leaderboard
  const leaderboard: LeaderboardEntry[] = members.map((m) => {
    const memberProgress = progress.filter((p) => p.user_id === m.user_id);
    return {
      user_id: m.user_id,
      username: m.profile?.username || "Unknown",
      color: m.color,
      totalPoints: memberProgress.reduce((acc, p) => acc + p.points, 0),
      territoriesConquered: memberProgress.filter((p) => p.status === "conquered").length,
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-muted-foreground animate-pulse">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="font-display font-semibold truncate">{room?.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg text-sm font-mono hover:bg-secondary/80 transition-colors"
            >
              <span className="tracking-widest">{room?.room_code}</span>
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{members.length}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!room?.syllabus_data ? (
          <div className="max-w-lg mx-auto">
            <SyllabusUpload roomId={roomId!} onSyllabusProcessed={loadRoom} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <h3 className="font-display font-semibold mb-2 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  Territory Map
                </h3>
                <TerritoryMap
                  chapters={chapters}
                  progress={progress}
                  members={members}
                  currentUserId={user!.id}
                  onSelectTerritory={handleSelectTerritory}
                />

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground justify-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-locked" /> Locked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-available" /> Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-conquered" /> Conquered
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-contested" /> Contested
                  </span>
                </div>
              </motion.div>

              {/* Members */}
              <div className="mt-4 bg-card border border-border rounded-xl p-4">
                <h4 className="font-display text-sm font-semibold mb-3">Squad Members</h4>
                <div className="flex flex-wrap gap-3">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                      <span>{m.profile?.username || "Unknown"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="lg:col-span-1">
              <Leaderboard entries={leaderboard} currentUserId={user!.id} />
            </div>
          </div>
        )}
      </main>

      {/* Quiz Overlay */}
      {activeQuiz && (
        <QuizPanel
          chapter={activeQuiz}
          onComplete={handleQuizComplete}
          onClose={() => setActiveQuiz(null)}
        />
      )}
    </div>
  );
}
