import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Swords, Trophy, Map, Users, Sparkles } from "lucide-react";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background bg-grid-pattern relative overflow-hidden">
      {/* Ambient lights */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[150px]" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-xp/5 rounded-full blur-[120px]" />

      {/* Nav */}
      <nav className="relative z-10 max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary" />
          <span className="font-display font-bold text-xl text-gradient-hero">ConquerEd</span>
        </div>
        <Button onClick={() => navigate("/auth")} className="font-display">
          Enter Arena
        </Button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-display font-black mb-6 leading-tight">
            <span className="text-gradient-hero">Conquer</span>
            <br />
            <span className="text-foreground">Your Studies</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Upload your syllabus. AI creates 7 territory challenges. 
            Compete with friends on a shared conquest map. Learn by battling.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="font-display text-lg px-8 gap-2"
            >
              <Swords className="w-5 h-5" />
              Start Conquering
            </Button>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-4xl mx-auto"
        >
          {[
            {
              icon: Sparkles,
              title: "AI-Powered",
              desc: "Upload any syllabus — AI generates 7 chapters with quiz questions instantly",
              color: "text-xp",
            },
            {
              icon: Map,
              title: "Territory Map",
              desc: "Visual hex map where completing quizzes conquers territories in your color",
              color: "text-primary",
            },
            {
              icon: Users,
              title: "Squad Play",
              desc: "Create rooms, share codes, and compete on a real-time leaderboard",
              color: "text-accent",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6 text-left hover:border-primary/30 transition-colors"
            >
              <f.icon className={`w-8 h-8 mb-3 ${f.color}`} />
              <h3 className="font-display font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
