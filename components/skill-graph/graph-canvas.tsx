"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NODE_H, NODE_W, type SkillGraph, type SkillStatus } from "@/lib/skill-graph";

const COLOR: Record<SkillStatus, string> = { verified: "#3F8F5F", partial: "#C97A1A", missing: "#C4432E" };

type Transform = { x: number; y: number; k: number };

export function GraphCanvas({
  graph,
  selected,
  onSelect,
}: {
  graph: SkillGraph;
  selected: string | null;
  onSelect: (name: string | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [t, setT] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const interacted = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);
  const moved = useRef(0);
  const [grabbing, setGrabbing] = useState(false);
  const [hint, setHint] = useState(true);

  const fit = useCallback(() => {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const padX = 40;
    const padTop = 120;
    const padBottom = r.width < 640 ? r.height * 0.45 : 80;
    const aw = r.width - padX * 2;
    const ah = r.height - padTop - padBottom;
    const b = graph.bounds;
    const k = Math.max(0.2, Math.min(aw / b.w, ah / b.h, 1.6));
    setT({
      k,
      x: padX + (aw - b.w * k) / 2 - b.x * k,
      y: padTop + (ah - b.h * k) / 2 - b.y * k,
    });
  }, [graph.bounds]);

  useEffect(() => {
    interacted.current = false;
    fit();
  }, [fit]);

  useEffect(() => {
    const onResize = () => {
      if (!interacted.current) fit();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fit]);

  const touched = () => {
    interacted.current = true;
    setHint(false);
  };

  const zoomAt = useCallback((px: number, py: number, factor: number) => {
    setT((prev) => {
      const k = Math.min(4, Math.max(0.2, prev.k * factor));
      const f = k / prev.k;
      return { k, x: px - (px - prev.x) * f, y: py - (py - prev.y) * f };
    });
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      touched();
      const r = el.getBoundingClientRect();
      const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = 0;
    setGrabbing(true);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const p = pointers.current.get(e.pointerId);
      if (!p) return;
      const el = svgRef.current;
      if (pointers.current.size === 2 && pinch.current && el) {
        p.x = e.clientX;
        p.y = e.clientY;
        const [a, b] = [...pointers.current.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const r = el.getBoundingClientRect();
        zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, d / pinch.current);
        pinch.current = d;
        moved.current = 99;
        touched();
        return;
      }
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      moved.current += Math.abs(dx) + Math.abs(dy);
      if (moved.current > 4) {
        setT((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        touched();
      }
    };
    const onUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      pinch.current = null;
      if (pointers.current.size === 0) setGrabbing(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [zoomAt]);

  function buttonZoom(factor: number) {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    touched();
    zoomAt(r.width / 2, r.height / 2, factor);
  }

  const byName = new Map(graph.nodes.map((n) => [n.name, n]));
  const select = (name: string) => {
    if (moved.current > 4) return;
    onSelect(name);
  };

  return (
    <>
      <svg
        ref={svgRef}
        onPointerDown={onPointerDown}
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as Element).tagName === "rect") {
            if (moved.current <= 4) onSelect(null);
          }
        }}
        className="absolute inset-0 w-full h-full select-none"
        style={{ touchAction: "none", cursor: grabbing ? "grabbing" : "grab" }}
        role="application"
        aria-label="Skill dependency graph. Scroll to zoom, drag to pan, select a skill for details."
      >
        <defs>
          <pattern id="sg-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" className="fill-black/15 dark:fill-white/15" />
          </pattern>
        </defs>
        <g transform={`translate(${t.x} ${t.y}) scale(${t.k})`}>
          <rect x={-4000} y={-4000} width={9000} height={9000} fill="url(#sg-dots)" />
          {graph.edges.map((edge) => {
            const a = byName.get(edge.from);
            const b = byName.get(edge.to);
            if (!a || !b) return null;
            return edge.gap ? (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#C4432E"
                strokeOpacity={0.45}
                strokeWidth={1.5}
                strokeDasharray="6 6"
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className="stroke-black/15 dark:stroke-white/20"
              />
            );
          })}
          {graph.nodes.map((n) => {
            const color = COLOR[n.status];
            return (
              <g
                key={n.name}
                tabIndex={0}
                role="button"
                aria-label={`${n.name}, ${n.status}`}
                style={{ cursor: "pointer", outline: "none" }}
                onClick={() => select(n.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(n.name);
                  }
                }}
              >
                <rect x={n.x - NODE_W / 2} y={n.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={6} className="fill-paper dark:fill-[#0B0D11]" />
                <rect
                  x={n.x - NODE_W / 2}
                  y={n.y - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill={color}
                  fillOpacity={0.12}
                  stroke={color}
                  strokeWidth={selected === n.name ? 3.5 : 2}
                />
                <text
                  x={n.x}
                  y={n.y + 6}
                  textAnchor="middle"
                  fill={color}
                  style={{ fontFamily: "var(--font-mono), monospace", fontWeight: 700, fontSize: 15, pointerEvents: "none" }}
                >
                  {n.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute left-4 bottom-[42%] sm:left-5 sm:bottom-5 flex items-center gap-3">
        <div className="flex items-center bg-paper dark:bg-[#0B0D11] border border-hair dark:border-white/10 rounded-xl shadow-sm p-1">
          <button onClick={() => buttonZoom(1 / 1.25)} aria-label="Zoom out" className="w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-lg leading-none">
            −
          </button>
          <span className="font-mono text-xs w-12 text-center">{Math.round(t.k * 100)}%</span>
          <button onClick={() => buttonZoom(1.25)} aria-label="Zoom in" className="w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-lg leading-none">
            +
          </button>
          <button
            onClick={() => {
              interacted.current = false;
              fit();
            }}
            aria-label="Fit graph to screen"
            className="px-2.5 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-xs font-medium"
          >
            Fit
          </button>
        </div>
        {hint && <span className="hidden sm:inline text-xs text-muted dark:text-white/40">Scroll to zoom · drag to pan</span>}
      </div>
    </>
  );
}
