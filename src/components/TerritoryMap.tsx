import { motion } from "framer-motion";
import { Lock, Swords, Crown, AlertTriangle, Zap } from "lucide-react";
import type { UserProgress, RoomMember, Chapter } from "@/lib/types";
import { useState, useEffect } from "react";

interface Props {
  chapters: Chapter[];
  progress: UserProgress[];
  members: RoomMember[];
  currentUserId: string;
  onSelectTerritory: (chapterNumber: number) => void;
}

const HEX_LAYOUT = [
  { x: 250, y: 200 },
  { x: 250, y: 80 },
  { x: 147, y: 140 },
  { x: 353, y: 140 },
  { x: 147, y: 260 },
  { x: 353, y: 260 },
  { x: 250, y: 320 },
];

function hexPoints(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

function getStatusColor(status: string, memberColor?: string) {
  switch (status) {
    case "conquered": return memberColor || "#10b981";
    case "contested": return "#f59e0b";
    case "available": return "#3b82f6";
    default: return "#374151";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "conquered": return Crown;
    case "contested": return AlertTriangle;
    case "available": return Swords;
    default: return Lock;
  }
}

// Particle effect for conquered territories
function ConquestParticles({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 6;
        const dist = 55;
        return (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r={2}
            fill={color}
            animate={{
              cx: cx + Math.cos(angle) * dist,
              cy: cy + Math.sin(angle) * dist,
              opacity: [1, 0.6, 0],
              r: [3, 1.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeOut",
            }}
          />
        );
      })}
    </>
  );
}

// Battle animation for contested
function BattleEffect({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r={45}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1.5}
          animate={{
            r: [45, 65],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}
    </>
  );
}

export default function TerritoryMap({ chapters, progress, members, currentUserId, onSelectTerritory }: Props) {
  const myProgress = progress.filter((p) => p.user_id === currentUserId);

  const getMyStatus = (chapterNum: number): string => {
    const p = myProgress.find((pr) => pr.chapter_number === chapterNum);
    return p?.status || (chapterNum === 1 ? "available" : "locked");
  };

  const getMemberColor = (userId: string) => {
    return members.find((m) => m.user_id === userId)?.color || "#3b82f6";
  };

  const getConquerers = (chapterNum: number) => {
    return progress.filter(
      (p) => p.chapter_number === chapterNum && (p.status === "conquered" || p.status === "contested")
    );
  };

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <svg viewBox="0 0 500 400" className="w-full">
        {/* Animated grid background */}
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="500" height="400" fill="url(#mapGlow)" />

        {/* Connection lines with pulse */}
        {[
          [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
          [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6],
        ].map(([a, b], i) => (
          <motion.line
            key={i}
            x1={HEX_LAYOUT[a].x}
            y1={HEX_LAYOUT[a].y}
            x2={HEX_LAYOUT[b].x}
            y2={HEX_LAYOUT[b].y}
            stroke="hsl(217 33% 25%)"
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

        {/* Territories */}
        {HEX_LAYOUT.map((pos, i) => {
          const chapterNum = i + 1;
          const status = getMyStatus(chapterNum);
          const chapter = chapters[i];
          const conquerers = getConquerers(chapterNum);
          const isClickable = status === "available" || status === "contested";
          const StatusIcon = getStatusIcon(status);
          const fillColor = getStatusColor(status, getMemberColor(currentUserId));

          return (
            <g
              key={i}
              onClick={() => isClickable && onSelectTerritory(chapterNum)}
              className={isClickable ? "cursor-pointer" : "cursor-default"}
            >
              {/* Conquest particles */}
              {status === "conquered" && (
                <ConquestParticles cx={pos.x} cy={pos.y} color={getMemberColor(currentUserId)} />
              )}

              {/* Battle effect */}
              {status === "contested" && <BattleEffect cx={pos.x} cy={pos.y} />}

              {/* Glow for available */}
              {status === "available" && (
                <motion.polygon
                  points={hexPoints(pos.x, pos.y, 52)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  filter="url(#glow)"
                  animate={{ opacity: [0.2, 0.8, 0.2], strokeWidth: [1, 3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Main hex with enhanced gradient */}
              <motion.polygon
                points={hexPoints(pos.x, pos.y, 45)}
                fill={fillColor}
                fillOpacity={status === "locked" ? 0.2 : 0.75}
                stroke={fillColor}
                strokeWidth={status === "available" ? 2.5 : 1.5}
                strokeOpacity={0.9}
                whileHover={isClickable ? { scale: 1.12 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                filter={status !== "locked" ? "url(#glow)" : undefined}
              />

              {/* Icon */}
              <foreignObject x={pos.x - 10} y={pos.y - 22} width={20} height={20}>
                <StatusIcon
                  className="w-5 h-5"
                  style={{ color: status === "locked" ? "#6b7280" : "#fff" }}
                />
              </foreignObject>

              {/* Chapter name */}
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                fill={status === "locked" ? "#6b7280" : "#fff"}
                fontSize="10"
                fontFamily="Orbitron"
                fontWeight="bold"
              >
                {chapter?.title ? chapter.title.slice(0, 12) : `Ch. ${chapterNum}`}
              </text>

              {/* Difficulty indicator */}
              {chapter && status !== "locked" && (
                <text
                  x={pos.x}
                  y={pos.y + 16}
                  textAnchor="middle"
                  fill={status === "locked" ? "#6b7280" : "#ffffff80"}
                  fontSize="7"
                  fontFamily="Inter"
                >
                  {chapter.questions?.length || 5} Q • {chapter.timeLimit}s
                </text>
              )}

              {/* Conquerer dots with colors */}
              {conquerers.length > 0 && (
                <g>
                  {conquerers.slice(0, 5).map((c, ci) => (
                    <motion.circle
                      key={ci}
                      cx={pos.x - 10 + ci * 6}
                      cy={pos.y + 28}
                      r={3}
                      fill={getMemberColor(c.user_id)}
                      stroke="hsl(222 47% 11%)"
                      strokeWidth={1}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: ci * 0.1 }}
                    />
                  ))}
                  {conquerers.length > 5 && (
                    <text x={pos.x + 22} y={pos.y + 31} fontSize="7" fill="#9ca3af">+{conquerers.length - 5}</text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
