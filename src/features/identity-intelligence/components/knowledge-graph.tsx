"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import type { GenomeSnapshot, KnowledgeGraphNode } from "@/features/identity-intelligence/types";

type KnowledgeGraphProps = {
  graph: GenomeSnapshot["knowledgeGraph"];
  hasExtractedKnowledge: boolean;
};

type GraphPoint = {
  x: number;
  y: number;
};

const graphWidth = 640;
const graphHeight = 360;

const nodeAppearance: Record<KnowledgeGraphNode["kind"], { fill: string; stroke: string; label: string }> = {
  genome: { fill: "#a99bff", stroke: "#d7d1ff", label: "Identity Genome" },
  source: { fill: "#76d9f7", stroke: "#c2f2ff", label: "Evidence source" },
  knowledge: { fill: "#7ee2bc", stroke: "#c7ffe5", label: "Extracted knowledge" },
  awaiting: { fill: "#71809d", stroke: "#a8b4ca", label: "Awaiting evidence" },
};

function titleCase(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function shortenedLabel(value: string) {
  return value.length > 18 ? `${value.slice(0, 16)}…` : value;
}

function groupNodes(nodes: KnowledgeGraphNode[]) {
  return {
    genome: nodes.filter((node) => node.kind === "genome"),
    source: nodes.filter((node) => node.kind === "source"),
    knowledge: nodes.filter((node) => node.kind === "knowledge"),
    awaiting: nodes.filter((node) => node.kind === "awaiting"),
  };
}

function columnPosition(index: number, count: number, side: "left" | "right"): GraphPoint {
  const columns = Math.max(1, Math.ceil(count / 5));
  const rows = Math.ceil(count / columns);
  const column = Math.floor(index / rows);
  const row = index % rows;
  const xOffset = column * 62;
  const x = side === "left" ? 112 + xOffset : graphWidth - 112 - xOffset;
  const y = rows === 1 ? graphHeight / 2 : 58 + (row / (rows - 1)) * (graphHeight - 116);

  return { x, y };
}

function awaitingPosition(index: number, count: number): GraphPoint {
  const columns = Math.max(1, Math.ceil(count / 4));
  const rows = Math.ceil(count / columns);
  const column = Math.floor(index / rows);
  const row = index % rows;
  const x = columns === 1 ? graphWidth / 2 : 245 + (column / (columns - 1)) * 150;
  const y = 292 + Math.min(row * 34, 42);

  return { x, y };
}

function layoutNodes(nodes: KnowledgeGraphNode[]) {
  const positions = new Map<string, GraphPoint>();
  const groups = groupNodes(nodes);

  groups.genome.forEach((node, index) => {
    positions.set(node.id, {
      x: graphWidth / 2 + (index % 2 === 0 ? 0 : (index % 2 === 1 ? 58 : -58)),
      y: graphHeight / 2 + Math.floor(index / 2) * 52,
    });
  });
  groups.source.forEach((node, index) => positions.set(node.id, columnPosition(index, groups.source.length, "left")));
  groups.knowledge.forEach((node, index) => positions.set(node.id, columnPosition(index, groups.knowledge.length, "right")));
  groups.awaiting.forEach((node, index) => positions.set(node.id, awaitingPosition(index, groups.awaiting.length)));

  return positions;
}

function NodeGlyph({ node, point }: { node: KnowledgeGraphNode; point: GraphPoint }) {
  const appearance = nodeAppearance[node.kind];

  if (node.kind === "source") {
    return (
      <>
        <rect x={point.x - 10} y={point.y - 10} width="20" height="20" rx="5" fill={appearance.fill} fillOpacity="0.15" stroke={appearance.stroke} strokeWidth="1.25" />
        <path d={`M ${point.x - 4} ${point.y - 2} h 8 M ${point.x - 4} ${point.y + 3} h 5`} stroke={appearance.stroke} strokeLinecap="round" strokeWidth="1.25" />
      </>
    );
  }

  if (node.kind === "knowledge") {
    return (
      <>
        <circle cx={point.x} cy={point.y} r="10" fill={appearance.fill} fillOpacity="0.16" stroke={appearance.stroke} strokeWidth="1.25" />
        <circle cx={point.x} cy={point.y} r="3.5" fill={appearance.stroke} />
      </>
    );
  }

  if (node.kind === "awaiting") {
    return (
      <>
        <circle cx={point.x} cy={point.y} r="10" fill={appearance.fill} fillOpacity="0.1" stroke={appearance.stroke} strokeDasharray="3 3" strokeWidth="1.25" />
        <path d={`M ${point.x - 3} ${point.y} h 6 M ${point.x} ${point.y - 3} v 6`} stroke={appearance.stroke} strokeLinecap="round" strokeWidth="1.1" />
      </>
    );
  }

  return (
    <>
      <circle cx={point.x} cy={point.y} r="27" fill={appearance.fill} fillOpacity="0.08" stroke={appearance.fill} strokeOpacity="0.32" />
      <circle cx={point.x} cy={point.y} r="17" fill={appearance.fill} fillOpacity="0.18" stroke={appearance.stroke} strokeWidth="1.25" />
      <path d={`M ${point.x - 7} ${point.y} h 14 M ${point.x} ${point.y - 7} v 14`} stroke={appearance.stroke} strokeLinecap="round" strokeWidth="1.3" />
    </>
  );
}

export function KnowledgeGraph({ graph, hasExtractedKnowledge }: KnowledgeGraphProps) {
  const reduceMotion = useReducedMotion();
  const instanceId = useId().replace(/:/g, "");
  const titleId = `${instanceId}-knowledge-graph-title`;
  const edgeGradientId = `${instanceId}-knowledge-graph-edge`;
  const hasGraphData = graph.nodes.length > 0;
  const positions = layoutNodes(graph.nodes);
  const visibleEdges = graph.edges.filter((edge) => positions.has(edge.from) && positions.has(edge.to));

  return (
    <section aria-labelledby={titleId} className="glass relative overflow-hidden rounded-[1.65rem] border border-white/[.1] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div aria-hidden="true" className="absolute -right-24 -top-24 size-56 rounded-full bg-cyan-300/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-28 -left-16 size-56 rounded-full bg-violet-400/10 blur-3xl" />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        className="relative"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-medium tracking-[.18em] text-cyan-200/70">IDENTITY MAP</p>
            <h3 id={titleId} className="mt-1.5 text-lg font-medium tracking-tight text-white">Knowledge Graph</h3>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-400">
              {hasExtractedKnowledge
                ? "Connections reflect current source-to-knowledge evidence in this Identity Genome."
                : "No personal traits or knowledge claims are shown until a supported source has been analyzed."}
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-medium tracking-[.13em] ${hasExtractedKnowledge ? "border-emerald-200/20 bg-emerald-300/10 text-emerald-100" : "border-slate-300/15 bg-slate-300/[.06] text-slate-300"}`}>
            <span aria-hidden="true" className={`size-1.5 rounded-full ${hasExtractedKnowledge ? "bg-emerald-200 shadow-[0_0_9px_#b6f7d8]" : "bg-slate-400"}`} />
            {hasExtractedKnowledge ? "EVIDENCE LINKED" : "AWAITING EVIDENCE"}
          </span>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/[.08] bg-[#060a20]/70 p-3 sm:p-4">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(139,124,255,.15),transparent_40%),linear-gradient(120deg,rgba(34,211,238,.04),transparent_52%)]" />
          {hasGraphData ? (
            <svg aria-hidden="true" className="relative h-auto w-full" viewBox={`0 0 ${graphWidth} ${graphHeight}`} fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id={edgeGradientId} x1="0" y1="0" x2={graphWidth} y2={graphHeight} gradientUnits="userSpaceOnUse">
                  <stop stopColor="#80e4ff" stopOpacity="0.42" />
                  <stop offset="0.5" stopColor="#b9adff" stopOpacity="0.75" />
                  <stop offset="1" stopColor="#8af0c2" stopOpacity="0.42" />
                </linearGradient>
              </defs>
              <g opacity="0.38">
                <path d="M0 72H640M0 180H640M0 288H640" stroke="#9aa9d0" strokeDasharray="2 12" strokeWidth="0.6" />
                <path d="M104 0V360M320 0V360M536 0V360" stroke="#9aa9d0" strokeDasharray="2 12" strokeWidth="0.6" />
              </g>
              {visibleEdges.map((edge) => {
                const from = positions.get(edge.from)!;
                const to = positions.get(edge.to)!;
                return (
                  <motion.line
                    key={`${edge.from}-${edge.to}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={`url(#${edgeGradientId})`}
                    strokeDasharray={hasExtractedKnowledge ? "3 7" : "2 8"}
                    strokeWidth="1.3"
                    initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.48, delay: reduceMotion ? 0 : 0.08, ease: "easeOut" }}
                  />
                );
              })}
              {graph.nodes.map((node, index) => {
                const point = positions.get(node.id)!;
                const appearance = nodeAppearance[node.kind];
                return (
                  <motion.g
                    key={node.id}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.76 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.34, delay: reduceMotion ? 0 : 0.12 + index * 0.045, ease: "easeOut" }}
                    style={{ transformOrigin: `${point.x}px ${point.y}px` }}
                  >
                    <NodeGlyph node={node} point={point} />
                    <text x={point.x} y={point.y + (node.kind === "genome" ? 43 : 29)} fill={appearance.stroke} fontFamily="var(--font-geist-mono), ui-monospace, monospace" fontSize="9" fontWeight="600" letterSpacing="0.65" textAnchor="middle">
                      {shortenedLabel(node.label).toUpperCase()}
                    </text>
                  </motion.g>
                );
              })}
            </svg>
          ) : (
            <div className="relative grid min-h-64 place-items-center px-6 text-center">
              <div>
                <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl border border-dashed border-slate-300/20 bg-slate-300/[.05] text-xl text-slate-400">+</span>
                <p className="mt-4 text-sm font-medium text-slate-200">Awaiting graph evidence</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">A source-to-knowledge map will be available after TrustDNA receives structured identity evidence.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
          {Object.entries(nodeAppearance).map(([kind, appearance]) => (
            <span key={kind} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: appearance.fill }} />
              {appearance.label}
            </span>
          ))}
        </div>

        <div className="sr-only">
          <p>
            {hasExtractedKnowledge
              ? `Knowledge Graph contains ${graph.nodes.length} nodes and ${visibleEdges.length} evidence connections.`
              : "Knowledge Graph is awaiting verified evidence. TrustDNA does not infer knowledge, skills, values, or relationships before a supported source is analyzed."}
          </p>
          <ul>
            {graph.nodes.map((node) => <li key={node.id}>{nodeAppearance[node.kind].label}: {node.label}. Origin: {titleCase(node.origin)}.</li>)}
          </ul>
          {visibleEdges.length > 0 && <ul>{visibleEdges.map((edge) => <li key={`${edge.from}-${edge.to}`}>Connection from {graph.nodes.find((node) => node.id === edge.from)?.label ?? edge.from} to {graph.nodes.find((node) => node.id === edge.to)?.label ?? edge.to}.</li>)}</ul>}
        </div>
      </motion.div>
    </section>
  );
}
