import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Trophy, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import PowerUpBar from "@/components/PowerUpBar";
import type { Chapter, PowerUp } from "@/lib/types";

interface Props {
  chapter: Chapter;
  powerUps: PowerUp[];
  onComplete: (score: number, timeTaken: number, doublePoints: boolean) => void;
  onClose: () => void;
  onUsePowerUp: (type: string) => Promise<boolean>;
}

export default function QuizPanel({ chapter, powerUps, onComplete, onClose, onUsePowerUp }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(chapter.questions.length).fill(null));
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(chapter.timeLimit);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [hiddenOptions, setHiddenOptions] = useState<Set<number>>(new Set());
  const [timeFrozen, setTimeFrozen] = useState(false);
  const [doublePoints, setDoublePoints] = useState(false);
  const [usedPowerUps, setUsedPowerUps] = useState<Set<string>>(new Set());
  const [comboCount, setComboCount] = useState(0);

  const finishQuiz = useCallback(() => {
    if (finished) return;
    setFinished(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const score = answers.reduce(
      (acc, ans, i) => acc + (ans === chapter.questions[i].correctAnswer ? 1 : 0),
      0
    );
    if (score >= 3) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"] });
    }
    onComplete(score, timeTaken, doublePoints);
  }, [finished, answers, chapter, startTime, onComplete, doublePoints]);

  useEffect(() => {
    if (finished || timeFrozen) return;
    if (timeLeft <= 0) { finishQuiz(); return; }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, finished, finishQuiz, timeFrozen]);

  const handlePowerUp = async (type: string) => {
    if (usedPowerUps.has(type) && type !== "fifty_fifty") return;
    const success = await onUsePowerUp(type);
    if (!success) return;

    setUsedPowerUps((prev) => new Set([...prev, type]));

    if (type === "fifty_fifty") {
      const q = chapter.questions[currentQ];
      const wrongOptions = q.options
        .map((_, i) => i)
        .filter((i) => i !== q.correctAnswer);
      const toHide = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2);
      setHiddenOptions(new Set(toHide));
    } else if (type === "time_freeze") {
      setTimeFrozen(true);
      setTimeout(() => setTimeFrozen(false), 15000);
    } else if (type === "double_points") {
      setDoublePoints(true);
    }
  };

  const selectAnswer = (optionIndex: number) => {
    if (showResult || finished || hiddenOptions.has(optionIndex)) return;
    setSelected(optionIndex);
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
    setShowResult(true);

    const isCorrect = optionIndex === chapter.questions[currentQ].correctAnswer;
    if (isCorrect) setComboCount((c) => c + 1);
    else setComboCount(0);

    setTimeout(() => {
      setShowResult(false);
      setSelected(null);
      setHiddenOptions(new Set());
      if (currentQ < chapter.questions.length - 1) {
        setCurrentQ((q) => q + 1);
      } else {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        const score = newAnswers.reduce(
          (acc, ans, i) => acc + (ans === chapter.questions[i].correctAnswer ? 1 : 0),
          0
        );
        setFinished(true);
        if (score >= 3) {
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ["#3b82f6", "#10b981", "#f59e0b"] });
        }
        onComplete(score, timeTaken, doublePoints);
      }
    }, 1200);
  };

  const question = chapter.questions[currentQ];
  const isCorrect = selected === question.correctAnswer;
  const timerPercent = (timeLeft / chapter.timeLimit) * 100;
  const timerColor = timerPercent > 50 ? "bg-accent" : timerPercent > 20 ? "bg-contested" : "bg-destructive";

  if (finished) {
    const finalScore = answers.reduce(
      (acc, ans, i) => acc + (ans === chapter.questions[i].correctAnswer ? 1 : 0),
      0
    );
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      >
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Trophy className="w-16 h-16 mx-auto mb-4 text-contested" />
          </motion.div>
          <h2 className="font-display text-2xl font-bold mb-2">
            {finalScore >= 3 ? "🏰 Territory Conquered!" : "⚔️ Territory Contested"}
          </h2>
          <p className="text-muted-foreground mb-6">
            You got {finalScore}/{chapter.questions.length} correct
          </p>
          <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-muted-foreground text-xs">Score</div>
              <div className="font-display font-bold text-lg text-xp">{finalScore * 10}{doublePoints ? " x2" : ""}</div>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-muted-foreground text-xs">Time</div>
              <div className="font-display font-bold text-lg">{timeTaken}s</div>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-muted-foreground text-xs">Combo</div>
              <div className="font-display font-bold text-lg text-contested">{comboCount}x</div>
            </div>
          </div>
          <Button onClick={onClose} className="w-full font-display">
            Back to Map
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <div className="bg-card border border-border rounded-xl max-w-lg w-full overflow-hidden">
        {/* Timer */}
        <div className="h-2 bg-secondary relative">
          <motion.div
            className={`h-full ${timeFrozen ? "bg-cyan-400" : timerColor} transition-colors`}
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 1 }}
          />
          {timeFrozen && (
            <motion.div
              className="absolute inset-0 bg-cyan-400/20"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="font-display text-sm text-muted-foreground">
                Q{currentQ + 1}/{chapter.questions.length}
              </span>
              {comboCount >= 2 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs font-display font-bold text-contested bg-contested/20 px-2 py-0.5 rounded-full"
                >
                  {comboCount}x Combo! 🔥
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-2 font-mono">
              <Clock className={`w-4 h-4 ${timeFrozen ? "text-cyan-400" : "text-muted-foreground"}`} />
              <span className={`font-bold ${timeLeft <= 10 ? "text-destructive animate-pulse" : "text-foreground"}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
              {timeFrozen && <span className="text-xs text-cyan-400">❄️ FROZEN</span>}
            </div>
          </div>

          {/* Power-ups */}
          <div className="mb-4">
            <PowerUpBar powerUps={powerUps} onUsePowerUp={handlePowerUp} disabled={showResult} />
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-semibold mb-6">{question.question}</h3>

              <div className="space-y-3">
                {question.options.map((opt, i) => {
                  const isHidden = hiddenOptions.has(i);
                  if (isHidden) {
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, height: "auto" }}
                        animate={{ opacity: 0.2, height: "auto" }}
                        className="w-full p-4 rounded-lg border border-border/30 bg-secondary/20 text-muted-foreground/30 line-through"
                      >
                        <span className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-secondary/30 flex items-center justify-center text-sm font-mono">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>{opt}</span>
                        </span>
                      </motion.div>
                    );
                  }

                  let optionClass = "bg-secondary border-border hover:border-primary/50";
                  if (showResult) {
                    if (i === question.correctAnswer) optionClass = "bg-accent/20 border-accent";
                    else if (i === selected && !isCorrect) optionClass = "bg-destructive/20 border-destructive";
                  }

                  return (
                    <motion.button
                      key={i}
                      onClick={() => selectAnswer(i)}
                      disabled={showResult}
                      whileHover={!showResult ? { scale: 1.02 } : {}}
                      whileTap={!showResult ? { scale: 0.98 } : {}}
                      className={`w-full text-left p-4 rounded-lg border transition-all flex items-center gap-3 ${optionClass}`}
                    >
                      <span className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-sm font-mono font-bold shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {showResult && i === question.correctAnswer && <CheckCircle className="w-5 h-5 text-accent shrink-0" />}
                      {showResult && i === selected && !isCorrect && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
