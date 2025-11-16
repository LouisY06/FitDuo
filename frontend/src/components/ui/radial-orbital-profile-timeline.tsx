"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { useNavigate } from "react-router-dom";

interface TimelineItem {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  emphasis: "primary" | "secondary" | "future";
  energy: number;
}

interface ProfileMeta {
  name: string;
  handle?: string;
  tagline?: string;
}

interface RadialOrbitalProfileTimelineProps {
  profile: ProfileMeta;
  timelineData: TimelineItem[];
}

export default function RadialOrbitalProfileTimeline({
  profile,
  timelineData,
}: RadialOrbitalProfileTimelineProps) {
  const navigate = useNavigate();
  const {
    workouts: recentBattleWorkouts,
    loading: loadingBattleHistory,
    error: battleHistoryError,
  } = useWorkoutHistory({
    workout_type: "battle",
    limit: 5,
  });

  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );
  const [viewMode] = useState<"orbital">("orbital");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key, 10) !== id) {
          newState[parseInt(key, 10)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

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
    let rotationTimer: ReturnType<typeof setInterval>;

    if (autoRotate && viewMode === "orbital") {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate, viewMode]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

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

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getEmphasisStyles = (emphasis: TimelineItem["emphasis"]): string => {
    switch (emphasis) {
      case "primary":
        return "text-white bg-black border-white";
      case "secondary":
        return "text-black bg-white border-black";
      case "future":
        return "text-white bg-black/40 border-white/50";
      default:
        return "text-white bg-black/40 border-white/50";
    }
  };

  const getEmphasisLabel = (emphasis: TimelineItem["emphasis"]): string => {
    switch (emphasis) {
      case "primary":
        return "CORE";
      case "secondary":
        return "DETAIL";
      case "future":
        return "GOAL";
      default:
        return "";
    }
  };

  const hasExpanded = Object.values(expandedItems).some(Boolean);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-transparent overflow-hidden"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        {!hasExpanded && (
          <div className="absolute z-20 flex flex-col items-center gap-3 pointer-events-none -translate-y-10">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-lime-400 via-emerald-400 to-teal-400 flex items-center justify-center shadow-orbital">
              <div className="w-20 h-20 rounded-full bg-black/70 border border-white/60 flex items-center justify-center text-2xl font-semibold">
                <UserIcon size={28} />
              </div>
              <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-50" />
            </div>
            <div className="text-center space-y-1">
              <h2
                className="text-xl audiowide-regular tracking-tight"
                style={{
                  color: "#63ff00",
                  textShadow: "0 0 18px rgba(99, 255, 0, 0.7)",
                }}
              >
                {profile.name}
              </h2>
              {profile.handle && (
                <p className="text-xs text-white/60">@{profile.handle}</p>
              )}
            </div>
          </div>
        )}

        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          <div className="absolute w-96 h-96 rounded-full border border-white/10" />

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            const nodeStyle: React.CSSProperties = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
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
                    isPulsing ? "animate-pulse duration-1000" : ""
                  }`}
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)",
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                  }}
                />

                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${
                      isExpanded
                        ? "bg-white text-black"
                        : isRelated
                        ? "bg-white/50 text-black"
                        : "bg-black text-white"
                    }
                    border-2 
                    ${
                      isExpanded
                        ? "border-white shadow-lg shadow-white/30"
                        : isRelated
                        ? "border-white animate-pulse"
                        : "border-white/40"
                    }
                    transition-all duration-300 transform
                    ${isExpanded ? "scale-150" : ""}
                  `}
                >
                  <Icon size={16} />
                </div>

                <div
                  className={`
                    absolute top-12 whitespace-nowrap
                    text-[10px] audiowide-regular uppercase tracking-[0.18em]
                    transition-all duration-300
                    ${isExpanded ? "text-lime-300 scale-125" : "text-neutral-200/80"}
                  `}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card
                    className="absolute left-1/2 -translate-x-1/2 w-72 bg-transparent backdrop-blur-lg border border-white/30 shadow-xl shadow-black/80 overflow-visible"
                    style={{ top: "130px" }}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-white/50" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge
                          className={`px-2 text-[0.6rem] ${getEmphasisStyles(
                            item.emphasis
                          )}`}
                        >
                          {getEmphasisLabel(item.emphasis)} •{" "}
                          {item.category.toUpperCase()}
                        </Badge>
                        {item.subtitle && (
                          <span className="text-[0.6rem] font-mono text-white/50">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-sm mt-2">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-white/80 space-y-3">
                      {item.category === "History" ? (
                        <div className="space-y-3">
                          <p>{item.content}</p>
                          <div className="pt-1 border-t border-white/10 space-y-2">
                            {loadingBattleHistory && (
                              <p className="text-[0.7rem] text-white/60">
                                Loading recent matches...
                              </p>
                            )}
                            {battleHistoryError && !loadingBattleHistory && (
                              <p className="text-[0.7rem] text-red-400">
                                Couldn&apos;t load match history.
                              </p>
                            )}
                            {!loadingBattleHistory &&
                              !battleHistoryError &&
                              recentBattleWorkouts.length === 0 && (
                                <p className="text-[0.7rem] text-white/60">
                                  No past matches yet. Jump into a battle to
                                  start your history.
                                </p>
                              )}
                            {!loadingBattleHistory &&
                              !battleHistoryError &&
                              recentBattleWorkouts.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[0.65rem] uppercase tracking-[0.16em] text-neutral-400">
                                      Recent Matches
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 py-0 text-[0.6rem] rounded-full border-white/30 bg-transparent hover:bg-white/10 text-white/80 hover:text-white"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/history");
                                      }}
                                    >
                                      Open full history
                                    </Button>
                                  </div>
                                  <div className="flex justify-between text-[0.65rem] text-white/60 font-mono">
                                    <span>Date</span>
                                    <span className="flex-1 ml-2">
                                      Match
                                    </span>
                                    <span className="ml-2 text-right">
                                      Score
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    {recentBattleWorkouts.map((workout) => (
                                      <div
                                        key={workout.id}
                                        className="flex items-center justify-between text-[0.7rem] font-mono text-white/80"
                                      >
                                        <span className="tabular-nums">
                                          {formatDate(workout.completed_at)}
                                        </span>
                                        <span className="flex-1 ml-2 truncate">
                                          {workout.exercise_name}
                                        </span>
                                        <span className="ml-2 text-lime-300 tabular-nums">
                                          {workout.score}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      ) : (
                        <p>{item.content}</p>
                      )}

                      <div className="pt-2 border-t border-white/10">
                        <div className="flex justify-between items-center text-[0.7rem] mb-1">
                          <span className="flex items-center">
                            <Zap size={10} className="mr-1" />
                            Focus Level
                          </span>
                          <span className="font-mono">{item.energy}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${item.energy}%` }}
                          />
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="pt-2 border-t border-white/10">
                          <div className="flex items-center mb-2">
                            <Link size={10} className="text-white/70 mr-1" />
                            <h4 className="text-[0.65rem] uppercase tracking-wider font-medium text-white/70">
                              Connected Profile Facets
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find(
                                (i) => i.id === relatedId
                              );
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center h-6 px-2 py-0 text-[0.65rem] rounded-none border-white/20 bg-transparent hover:bg-white/10 text-white/80 hover:text-white transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight
                                    size={8}
                                    className="ml-1 text-white/60"
                                  />
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


