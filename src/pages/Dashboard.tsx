import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, LogIn, LogOut, Shield, Users, Map } from "lucide-react";
import { USER_COLORS } from "@/lib/types";

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadRooms();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    setProfile(data);
  };

  const loadRooms = async () => {
    const { data: memberRooms } = await supabase
      .from("room_members")
      .select("room_id, color, rooms(id, name, room_code, created_at, syllabus_data)")
      .eq("user_id", user!.id);

    if (memberRooms) {
      setRooms(memberRooms.map((m: any) => ({ ...m.rooms, myColor: m.color })));
    }
  };

  const createRoom = async () => {
    if (!roomName.trim()) return;
    setLoading(true);
    try {
      const code = generateRoomCode();
      const { data: room, error } = await supabase
        .from("rooms")
        .insert({ name: roomName, room_code: code, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Join as first member with first color
      await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: user!.id,
        color: USER_COLORS[0],
      });

      toast.success(`Room created! Code: ${code}`);
      navigate(`/room/${room.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      const { data: joinedRoomId, error } = await supabase.rpc("join_room_with_code", {
        _room_code: joinCode.toUpperCase(),
      });

      if (error || !joinedRoomId) {
        throw new Error(error?.message || "Room not found");
      }

      toast.success("Joined room!");
      navigate(`/room/${joinedRoomId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Top Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-lg text-gradient-hero">ConquerEd</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {profile?.username || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold mb-2">Command Center</h1>
          <p className="text-muted-foreground">Create a study room or join your squad</p>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <Button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="font-display gap-2">
            <Plus className="w-4 h-4" /> Create Room
          </Button>
          <Button variant="secondary" onClick={() => { setShowJoin(true); setShowCreate(false); }} className="font-display gap-2">
            <LogIn className="w-4 h-4" /> Join Room
          </Button>
        </div>

        {/* Create Room Panel */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-card border border-border rounded-xl p-6 mb-8"
          >
            <h3 className="font-display text-lg mb-4">Create New Room</h3>
            <div className="flex gap-3">
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name (e.g. Biology 101)"
                className="bg-secondary border-border flex-1"
              />
              <Button onClick={createRoom} disabled={loading} className="font-display">
                {loading ? "Creating..." : "Create"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Join Room Panel */}
        {showJoin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-card border border-border rounded-xl p-6 mb-8"
          >
            <h3 className="font-display text-lg mb-4">Join a Room</h3>
            <div className="flex gap-3">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                className="bg-secondary border-border flex-1 font-mono uppercase tracking-widest"
              />
              <Button onClick={joinRoom} disabled={loading} className="font-display">
                {loading ? "Joining..." : "Join"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Room Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/room/${room.id}`)}
              className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 hover:glow-primary transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-semibold">{room.name}</h3>
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: room.myColor }}
                />
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">
                  {room.room_code}
                </span>
                <span className="flex items-center gap-1">
                  <Map className="w-3.5 h-3.5" />
                  {room.syllabus_data ? "7 territories" : "No syllabus"}
                </span>
              </div>
            </motion.div>
          ))}

          {rooms.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-display">No rooms yet</p>
              <p className="text-sm mt-1">Create or join a room to begin your conquest</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
