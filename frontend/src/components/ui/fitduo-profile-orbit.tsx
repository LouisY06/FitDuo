import * as React from "react";
import { useState, useEffect, useRef } from "react";
import type { CSSProperties, MouseEvent } from "react";
import {
  Activity,
  Flame,
  Target,
  Trophy,
  Dumbbell,
  Link,
  Zap,
} from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export interface ProfileNode {
  id: number;
  title: string;
  metric: string;
  description: string;
  tag: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "crushing-it" | "on-track" | "needs-love";
  energy: number;
}

interface FitDuoProfileOrbitProps {
  username: string;
  nodes: ProfileNode[];
}

export function FitDuoProfileOrbit({
  username,
  nodes,
}: FitDuoProfileOrbitProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const orbitRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = nodes.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = nodes.findIndex((item) => item.id === nodeId);
    if (nodeIndex === -1) return;
    const totalNodes = nodes.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        const numericKey = Number(key);
        newState[numericKey] = numericKey === id ? !prev[numericKey] : false;
      });

      if (!(id in newState)) {
        newState[id] = true;
      }

      const willExpand = newState[id];

      if (willExpand) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulse: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulse[relId] = true;
        });
        setPulseEffect(newPulse);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    if (!autoRotate) return;
    const rotationTimer = setInterval(() => {
      setRotationAngle((prev) => {
        const next = (prev + 0.25) % 360;
        return Number(next.toFixed(3));
      });
    }, 60);
    return () => clearInterval(rotationTimer);
  }, [autoRotate]);

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.4,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, zIndex, opacity };
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const related = getRelatedItems(activeNodeId);
    return related.includes(itemId);
  };

  const getStatusStyles = (status: ProfileNode["status"]): string => {
    switch (status) {
      case "crushing-it":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-400";
      case "on-track":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400";
      case "needs-love":
        return "bg-rose-500/20 text-rose-300 border-rose-400";
      default:
        return "bg-slate-700/40 text-slate-200 border-slate-400/60";
    }
  };

  const getStatusLabel = (status: ProfileNode["status"]): string => {
    switch (status) {
      case "crushing-it":
        return "CRUSHING IT";
      case "on-track":
        return "ON TRACK";
      case "needs-love":
        return "NEEDS LOVE";
      default:
        return "TRACKING";
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="w-full h-[480px] md:h-[640px] flex flex-col items-center justify-center bg-black/90 rounded-3xl border border-white/10 relative overflow-hidden"
    >
      <div className="pointer-events-none absolute -top-40 -right-32 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl" />

      <div className="absolute top-4 left-6 flex items-center gap-2 z-20">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 via-lime-400 to-cyan-400 flex items-center justify-center text-xs font-semibold text-black shadow-[0_0_12px_rgba(74,222,128,0.8)]">
          <Activity size={16} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            FitDuo Profile
          </p>
          <p className="text-sm font-semibold text-white/90">
            {username}&apos;s Orbit
          </p>
        </div>
      </div>

      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          ref={orbitRef}
          className="absolute w-full h-full flex items-center justify-center"
          style={
            {
              perspective: "1000px",
              transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
            } as CSSProperties
          }
        >
          <div className="relative z-20">
            <div className="absolute inset-0 w-32 h-32 rounded-full border border-emerald-300/20 animate-orbital-ping opacity-70" />
            <div
              className="absolute inset-0 w-40 h-40 rounded-full border border-emerald-200/10 animate-orbital-ping opacity-50"
              style={{ animationDelay: "0.5s" }}
            />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 via-lime-400 to-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(74,222,128,0.9)]">
              <span className="text-sm font-semibold text-black text-center px-2">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="mt-2 text-center text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">
              CORE ENERGY
            </p>
          </div>

          <div className="absolute w-96 h-96 md:w-[26rem] md:h-[26rem] rounded-full border border-white/10" />

          {nodes.map((item, index) => {
            const pos = calculateNodePosition(index, nodes.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            const nodeStyle: CSSProperties = {
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              zIndex: isExpanded ? 200 : pos.zIndex,
              opacity: isExpanded ? 1 : pos.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => {
                  nodeRefs.current[item.id] = el;
                }}
                className="absolute transition-all duration-700 cursor-pointer"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${
                    isPulsing ? "animate-orbital-pulse" : ""
                  }`}
                  style={{
                    background:
                      "radial-gradient(circle, rgba(74,222,128,0.25) 0%, rgba(0,0,0,0) 70%)",
                    width: `${item.energy * 0.4 + 40}px`,
                    height: `${item.energy * 0.4 + 40}px`,
                    left: `-${(item.energy * 0.4 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.4 + 40 - 40) / 2}px`,
                  }}
                />

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-xs ${
                    isExpanded
                      ? "bg-emerald-400 text-black border-emerald-200 shadow-[0_0_18px_rgba(74,222,128,0.9)]"
                      : isRelated
                      ? "bg-emerald-300/40 text-emerald-50 border-emerald-200/80"
                      : "bg-black text-white border-white/40"
                  } transition-all duration-300 ${isExpanded ? "scale-150" : ""}`}
                >
                  <Icon size={16} />
                </div>

                <div
                  className={`absolute top-11 whitespace-nowrap text-[11px] font-semibold tracking-wide transition-all duration-300 ${
                    isExpanded ? "text-white scale-110" : "text-white/70"
                  }`}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card className="absolute top-16 left-1/2 -translate-x-1/2 w-72 bg-black/90 backdrop-blur-lg border-white/20 shadow-xl shadow-emerald-500/20 overflow-visible">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-emerald-300/70" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center gap-2">
                        <Badge
                          className={`px-2 py-0 text-[10px] uppercase tracking-[0.15em] ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </Badge>
                        <span className="text-[10px] font-mono text-white/50">
                          {item.tag}
                        </span>
                      </div>
                      <CardTitle className="text-sm mt-2 flex items-baseline justify-between gap-2">
                        <span>{item.title}</span>
                        <span className="text-emerald-300 text-xs font-mono">
                          {item.metric}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-white/80 space-y-3">
                      <p>{item.description}</p>

                      <div className="pt-2 border-t border-white/10">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="flex items-center gap-1">
                            <Zap size={11} className="text-emerald-300" />
                            Training Load
                          </span>
                          <span className="font-mono">{item.energy}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 via-lime-300 to-cyan-300"
                            style={{ width: `${item.energy}%` }}
                          />
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="pt-2 border-t border-white/10">
                          <div className="flex items-center mb-2">
                            <Link
                              size={11}
                              className="text-emerald-200 mr-1"
                            />
                            <h4 className="text-[10px] uppercase tracking-[0.18em] font-medium text-emerald-200/80">
                              Connected Stats
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = nodes.find(
                                (n) => n.id === relatedId
                              );
                              if (!relatedItem) return null;
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center h-6 px-2 py-0 text-[11px] rounded-full border-emerald-300/40 bg-transparent hover:bg-emerald-400/10 text-emerald-100 hover:text-emerald-50 transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem.title}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Re-export icons used by the demo config so callers don't need to import them.
export const FitDuoOrbitIcons = {
  Activity,
  Flame,
  Target,
  Trophy,
  Dumbbell,
};


