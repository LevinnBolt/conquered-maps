import { motion } from "framer-motion";
import { Lock, Swords, Crown, AlertTriangle } from "lucide-react";
import type { UserProgress, RoomMember, Chapter } from "@/lib/types";

interface Props {
  chapters: Chapter[];
  progress: UserProgress[];
  members: RoomMember[];
  currentUserId: string;
  onSelectTerritory: (chapterNumber: number) => void;
}

// Hex positions for 7 territories: center + 6 around
const HEX_LAYOUT = [
  { x: 250, y: 200, label: "1" }, // center
  { x: 250, y: 80, label: "2" },  // top
  { x: 147, y: 140, label: "3" }, // top-left
  { x: 353, y: 140, label: "4" }, // top-right
  { x: 147, y: 260, label: "5" }, // bottom-left
  { x: 353, y: 260, label: "6" }, // bottom-right
  { x: 250, y: 320, label: "7" }, // bottom
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

export default function TerritoryMap({ chapters, progress, members, currentUserId, onSelectTerritory }: Props) {
  const myProgress = progress.filter((p) => p.user_id === currentUserId);

  const getMyStatus = (chapterNum: number): string => {
    const p = myProgress.find((pr) => pr.chapter_number === chapterNum);
    return p?.status || (chapterNum === 1 ? "available" : "locked");
  };

  const getMemberColor = (userId: string) => {
    return members.find((m) => m.user_id === userId)?.color || "#3b82f6";
  };

  // Get all conquerers for a territory
  const getConquerers = (chapterNum: number) => {
    return progress.filter(
      (p) => p.chapter_number === chapterNum && (p.status === "conquered" || p.status === "contested")
    );
  };

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <svg viewBox="0 0 500 400" className="w-full">
        {/* Connection lines */}
        {[
          [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
          [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6],
        ].map(([a, b], i) => (
          <line
            key={i}
            x1={HEX_LAYOUT[a].x}
            y1={HEX_LAYOUT[a].y}
            x2={HEX_LAYOUT[b].x}
            y2={HEX_LAYOUT[b].y}
            stroke="hsl(217 33% 25%)"
            strokeWidth="2"
            opacity="0.4"
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
              {/* Glow effect for available */}
              {status === "available" && (
                <motion.polygon
                  points={hexPoints(pos.x, pos.y, 52)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  opacity="0.4"
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Main hex */}
              <motion.polygon
                points={hexPoints(pos.x, pos.y, 45)}
                fill={fillColor}
                fillOpacity={status === "locked" ? 0.3 : 0.7}
                stroke={fillColor}
                strokeWidth={status === "available" ? 2 : 1}
                strokeOpacity={0.8}
                whileHover={isClickable ? { scale: 1.08 } : {}}
                transition={{ type: "spring", stiffness: 300 }}
                style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
              />

              {/* Icon */}
              <foreignObject x={pos.x - 10} y={pos.y - 22} width={20} height={20}>
                <StatusIcon
                  className="w-5 h-5"
                  style={{ color: status === "locked" ? "#6b7280" : "#fff" }}
                />
              </foreignObject>

              {/* Chapter number */}
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                fill={status === "locked" ? "#6b7280" : "#fff"}
                fontSize="11"
                fontFamily="Orbitron"
                fontWeight="bold"
              >
                {chapter?.title ? chapter.title.slice(0, 12) : `Ch. ${chapterNum}`}
              </text>

              {/* Conquerer dots */}
              {conquerers.length > 0 && (
                <g>
                  {conquerers.slice(0, 4).map((c, ci) => (
                    <circle
                      key={ci}
                      cx={pos.x - 12 + ci * 8}
                      cy={pos.y + 20}
                      r={4}
                      fill={getMemberColor(c.user_id)}
                      stroke="hsl(222 47% 11%)"
                      strokeWidth={1}
                    />
                  ))}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
