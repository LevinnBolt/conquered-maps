import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import type { Chapter } from "@/lib/types";

interface Props {
  chapter: Chapter;
  onComplete: (score: number, timeTaken: number) => void;
  onClose: () => void;
}

export default function QuizPanel({ chapter, onComplete, onClose }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(chapter.questions.length).fill(null));
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(chapter.timeLimit);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());

  const finishQuiz = useCallback(() => {
    if (finished) return;
    setFinished(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const score = answers.reduce(
      (acc, ans, i) => acc + (ans === chapter.questions[i].correctAnswer ? 1 : 0),
      0
    );

    if (score >= 3) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    onComplete(score, timeTaken);
  }, [finished, answers, chapter, startTime, onComplete]);

  useEffect(() => {
    if (finished) return;
    if (timeLeft <= 0) {
      finishQuiz();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, finished, finishQuiz]);

  const selectAnswer = (optionIndex: number) => {
    if (showResult || finished) return;
    setSelected(optionIndex);
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
      setSelected(null);
      if (currentQ < chapter.questions.length - 1) {
        setCurrentQ((q) => q + 1);
      } else {
        // Use the updated answers directly
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        const score = newAnswers.reduce(
          (acc, ans, i) => acc + (ans === chapter.questions[i].correctAnswer ? 1 : 0),
          0
        );
        setFinished(true);
        if (score >= 3) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
        onComplete(score, timeTaken);
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
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      >
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-contested" />
          <h2 className="font-display text-2xl font-bold mb-2">
            {finalScore >= 3 ? "Territory Conquered!" : "Territory Contested"}
          </h2>
          <p className="text-muted-foreground mb-6">
            You got {finalScore}/{chapter.questions.length} correct
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-muted-foreground">Score</div>
              <div className="font-display font-bold text-lg">{finalScore * 10}</div>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-muted-foreground">Time</div>
              <div className="font-display font-bold text-lg">
                {Math.floor((Date.now() - startTime) / 1000)}s
              </div>
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
        {/* Timer bar */}
        <div className="h-2 bg-secondary">
          <motion.div
            className={`h-full ${timerColor} transition-colors`}
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 1 }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="font-display text-sm text-muted-foreground">
              Question {currentQ + 1}/{chapter.questions.length}
            </span>
            <div className="flex items-center gap-2 font-mono">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={`font-bold ${timeLeft <= 10 ? "text-destructive" : "text-foreground"}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
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
                  let optionClass = "bg-secondary border-border hover:border-primary/50";
                  if (showResult) {
                    if (i === question.correctAnswer) optionClass = "bg-accent/20 border-accent";
                    else if (i === selected && !isCorrect) optionClass = "bg-destructive/20 border-destructive";
                  } else if (selected === i) {
                    optionClass = "bg-primary/20 border-primary";
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
                      {showResult && i === question.correctAnswer && (
                        <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                      )}
                      {showResult && i === selected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-destructive shrink-0" />
                      )}
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
