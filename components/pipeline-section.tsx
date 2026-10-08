"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import { 
  type LucideIcon,
  Radio, 
  Wifi, 
  Workflow, 
  Cpu, 
  Bell, 
  ArrowRight, 
  ArrowDown, 
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStep {
  number: string;
  stage: string;
  name: string;
  badge: string;
  description: string;
  subSpecs?: string[];
  icon: LucideIcon;
}

const pipelineSteps: PipelineStep[] = [
  {
    number: "01",
    stage: "SENSE",
    name: "Edge Sensing",
    badge: "ESP32 SENSOR NODES",
    description: "ESP32-based sensor nodes continuously capture environmental signals across the monitored area.",
    subSpecs: ["Rainfall", "Water Level", "Soil Moisture", "Temp / Humidity"],
    icon: Radio,
  },
  {
    number: "02",
    stage: "CONNECT",
    name: "Data Ingestion",
    badge: "MQTT",
    description: "The Master Node aggregates sensor readings and streams telemetry to the platform using MQTT.",
    subSpecs: ["Master Gateway", "Low-Latency Transport", "Live Telemetry"],
    icon: Wifi,
  },
  {
    number: "03",
    stage: "UNDERSTAND",
    name: "Signal Orchestration",
    badge: "NODE-RED",
    description: "Node-RED validates, normalizes, and routes incoming data into the machine-learning pipeline.",
    subSpecs: ["Data Routing", "Normalization", "Stream Processing"],
    icon: Workflow,
  },
  {
    number: "04",
    stage: "PREDICT",
    name: "Risk Intelligence Engine",
    badge: "ML RISK ENGINE",
    description: "ML models detect anomalies, forecast emerging conditions, and fuse multiple signals into a 0–100 risk score.",
    subSpecs: ["Classifier", "Detector", "Forecaster"],
    icon: Cpu,
  },
  {
    number: "05",
    stage: "ACT",
    name: "Decision & Alert Layer",
    badge: "FASTAPI / ALERTING",
    description: "Risk intelligence is delivered through the dashboard and localized alerts, enabling faster and more proactive response.",
    subSpecs: ["Live Dashboard", "Hazard Alerts", "Proactive Response"],
    icon: Bell,
  },
];

const telemetryStatuses = [
  { stage: "SENSE", status: "SIGNAL DETECTED" },
  { stage: "CONNECT", status: "DATA RECEIVED" },
  { stage: "UNDERSTAND", status: "PATTERN ANALYZED" },
  { stage: "PREDICT", status: "RISK COMPUTED" },
  { stage: "ACT", status: "ACTION ENABLED" },
];

export function PipelineSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [maxReachedStage, setMaxReachedStage] = useState<number>(0);

  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  // Update highest reached stage so revealed cards remain visible permanently
  useEffect(() => {
    setMaxReachedStage((prev) => Math.max(prev, activeStage));
  }, [activeStage]);

  // Synchronized continuous signal progression: SENSE -> CONNECT -> UNDERSTAND -> PREDICT -> ACT
  // Starts when the section enters the viewport, cycling smoothly every 1400ms
  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 5);
    }, 1400);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section 
      ref={sectionRef}
      id="pipeline-section" 
      className="relative w-full bg-gradient-to-b from-transparent via-zinc-950/80 to-zinc-950 text-zinc-100 py-24 sm:py-32 lg:py-40"
    >
      {/* Ambient background light & subtle tech grid */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#27272a0f_1px,transparent_1px),linear-gradient(to_bottom,#27272a0f_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)] pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="relative z-10 max-w-[1420px] mx-auto px-5 sm:px-8 lg:px-8 xl:px-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 text-xs font-mono tracking-widest text-zinc-400 uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            End-to-End Architecture
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-50 leading-[1.1]">
            From Signals to Situational Intelligence
          </h2>
          
          <p className="mt-5 text-base sm:text-lg text-zinc-400 font-normal leading-relaxed">
            From edge sensors to risk intelligence, every signal passes through a coordinated pipeline built for continuous environmental awareness.
          </p>
        </motion.div>

        {/* Mobile Telemetry Status Bar */}
        <div className="flex items-center justify-between px-1 mb-6 lg:hidden text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-zinc-300">LIVE TELEMETRY</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10.5px] font-mono">
            <span className="text-zinc-500 font-medium">STAGE 0{activeStage + 1}:</span>
            <span className="text-emerald-400 font-semibold">{telemetryStatuses[activeStage].status}</span>
          </div>
        </div>

        {/* Desktop Connected Flow Indicator & Animated Telemetry Line */}
        <div className="hidden lg:block mb-8">
          {/* Small Labels Row */}
          <div className="flex items-center justify-between px-2 mb-4">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>LIVE ENVIRONMENTAL TELEMETRY</span>
              <span className="text-zinc-700">/</span>
              {/* Subtle changing status label updating in sync with moving signal */}
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-500 font-medium">STAGE 0{activeStage + 1}:</span>
                <span className="text-zinc-200 font-semibold tracking-wider">
                  {telemetryStatuses[activeStage].status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-mono text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-zinc-300 tracking-wider">REAL-TIME INTELLIGENCE PIPELINE</span>
            </div>
          </div>

          {/* Technical Signal Path with Animated Pulses and Stage Nodes */}
          <div className="relative w-full">
            {/* Grid matching the five cards below */}
            <div className="grid grid-cols-5 gap-5 xl:gap-6 relative">
              {pipelineSteps.map((step, idx) => {
                const isActive = activeStage === idx;
                const isPredict = step.stage === "PREDICT";
                const isPassed = activeStage > idx;

                return (
                  <div key={step.stage} className="relative flex flex-col items-center">
                    {/* Horizontal Signal Path segment connecting to the next stage */}
                    {idx < 4 && (
                      <div 
                        className="absolute left-1/2 top-3.5 -translate-y-1/2 w-[calc(100%+1.25rem)] xl:w-[calc(100%+1.5rem)] h-[2px] bg-zinc-800/90 z-0 overflow-hidden" 
                        aria-hidden="true"
                      >
                        {/* Background wire track */}
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 via-zinc-700/70 to-zinc-800" />
                        
                        {/* Synchronized signal packet traveling along this segment */}
                        {isActive && (
                          <>
                            <motion.div 
                              key={`pulse-${idx}-${activeStage}`}
                              className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_rgba(210,166,121,0.9)]"
                              initial={{ left: "-20%" }}
                              animate={{ left: "100%" }}
                              transition={{ duration: 1.35, ease: "easeInOut" }}
                            />
                            <motion.div 
                              key={`core-${idx}-${activeStage}`}
                              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]"
                              initial={{ left: "0%" }}
                              animate={{ left: "96%" }}
                              transition={{ duration: 1.35, ease: "easeInOut" }}
                            />
                          </>
                        )}
                      </div>
                    )}

                    {/* Stage Node: sits directly above card, centered */}
                    <div className="relative z-10 flex flex-col items-center">
                      {/* Node circle with brief glow when reached */}
                      <div 
                        className={cn(
                          "relative w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300",
                          isActive
                            ? isPredict
                              ? "bg-emerald-950/90 border-emerald-400 shadow-[0_0_16px_rgba(210,166,121,0.65)] scale-110"
                              : "bg-emerald-950/80 border-emerald-400 shadow-[0_0_12px_rgba(210,166,121,0.5)] scale-105"
                            : isPassed
                              ? "bg-zinc-900 border-emerald-500/40"
                              : "bg-zinc-950 border-zinc-800"
                        )}
                      >
                        {/* Active pulsing halo */}
                        {isActive && (
                          <span 
                            className={cn(
                              "absolute inset-0 rounded-full animate-ping pointer-events-none",
                              isPredict ? "bg-emerald-400/40" : "bg-emerald-400/25"
                            )} 
                          />
                        )}

                        {/* Core dot */}
                        <div 
                          className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            isActive 
                              ? isPredict 
                                ? "bg-white shadow-[0_0_8px_#d2a679]" 
                                : "bg-emerald-400 shadow-[0_0_6px_#d2a679]"
                              : isPassed
                                ? "bg-emerald-400/60"
                                : "bg-zinc-600"
                          )} 
                        />
                      </div>

                      {/* Monospace Stage Label */}
                      <span 
                        className={cn(
                          "mt-1 text-[10.5px] font-mono font-semibold tracking-wider uppercase transition-colors duration-300",
                          isActive 
                            ? isPredict 
                              ? "text-emerald-300" 
                              : "text-emerald-400"
                            : "text-zinc-500"
                        )}
                      >
                        {step.stage}
                      </span>

                      {/* Intentional vertical connection line pointing toward the card below */}
                      <div 
                        className={cn(
                          "w-[1px] transition-all duration-300 mt-1",
                          isActive
                            ? isPredict
                              ? "bg-gradient-to-b from-emerald-400 via-emerald-500/50 to-transparent h-5"
                              : "bg-gradient-to-b from-emerald-400/80 via-emerald-500/30 to-transparent h-5"
                            : "bg-gradient-to-b from-zinc-700/60 to-transparent h-4"
                        )} 
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop Horizontal Pipeline & Mobile Vertical Timeline */}
        <div className="relative">
          {/* Cards Grid / Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 xl:gap-6 relative z-10">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              const isPredict = step.stage === "PREDICT";
              const isHovered = hoveredIndex === idx;
              const isCurrentActive = activeStage === idx;
              const hasBeenReached = maxReachedStage >= idx;

              return (
                <motion.div
                  key={step.stage}
                  initial={false}
                  animate={{
                    opacity: hasBeenReached ? 1 : 0,
                    y: hasBeenReached ? 0 : 22,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "relative flex-col lg:flex",
                    !hasBeenReached ? "hidden lg:flex pointer-events-none" : "flex"
                  )}
                >
                  {/* Card Container */}
                  <div
                    className={cn(
                      "group relative flex-1 flex flex-col p-6 sm:p-6.5 xl:p-7 rounded-2xl bg-zinc-900/60 border transition-all duration-500 backdrop-blur-sm min-h-[470px] lg:min-h-[500px]",
                      isHovered 
                        ? "border-zinc-700 bg-zinc-900/90 shadow-xl shadow-black/50 -translate-y-1" 
                        : isCurrentActive
                          ? isPredict
                            ? "border-emerald-400/80 bg-gradient-to-b from-zinc-900/95 via-zinc-900/80 to-zinc-950/90 shadow-[0_0_28px_rgba(210,166,121,0.22)] -translate-y-0.5"
                            : "border-emerald-500/60 bg-zinc-900/85 shadow-[0_0_24px_rgba(210,166,121,0.16)] -translate-y-0.5"
                          : isPredict
                            ? "border-zinc-700/70 bg-gradient-to-b from-zinc-900/90 via-zinc-900/65 to-zinc-950/85 hover:border-zinc-700/80"
                            : "border-zinc-800/80 hover:border-zinc-700/80"
                    )}
                  >
                    {/* 1. STAGE: Stage Number & Stage Name (prominent) + Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-mono text-xs font-bold tracking-wider transition-colors",
                          isCurrentActive ? "text-emerald-300" : "text-emerald-400"
                        )}>
                          {step.number}
                        </span>
                        <span className="text-zinc-600 font-mono text-xs">—</span>
                        <span className="font-mono text-xs font-bold tracking-widest text-zinc-200 group-hover:text-white transition-colors">
                          {step.stage}
                        </span>
                      </div>

                      <div 
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 shrink-0",
                          isPredict 
                            ? isCurrentActive
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(210,166,121,0.3)]"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                            : isCurrentActive
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(210,166,121,0.2)]"
                              : "bg-zinc-800/60 border-zinc-700/60 text-zinc-300 group-hover:text-white group-hover:border-zinc-600"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* 2. BADGE: Visually smaller than title */}
                    <div className="mb-2.5">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10.5px] font-mono font-medium tracking-tight text-zinc-400 bg-zinc-800/80 border border-zinc-700/50 uppercase">
                        {step.badge}
                      </span>
                    </div>

                    {/* 3. MAIN TITLE: Primary heading */}
                    <h3 className="text-lg sm:text-[19px] font-semibold text-zinc-100 tracking-tight leading-snug mb-3">
                      {step.name}
                    </h3>

                    {/* 4. DESCRIPTION: Comfortable line-height */}
                    <p className="text-[13.5px] text-zinc-400 leading-relaxed font-normal mb-6 flex-1">
                      {step.description}
                    </p>

                    {/* 5. TECHNICAL DETAILS: PREDICT Special Visual Representation OR Sub-tags */}
                    {isPredict ? (
                      <div className="mt-auto pt-3.5 border-t border-zinc-800/80 font-mono text-[11px]">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-medium flex items-center justify-between">
                          <span>Multi-Signal Fusion</span>
                          <span className={cn(
                            "font-semibold transition-colors",
                            isCurrentActive ? "text-emerald-300" : "text-emerald-400/90"
                          )}>
                            Meta Risk
                          </span>
                        </div>
                        <div className="bg-zinc-950/90 rounded-lg p-2.5 border border-zinc-800/90 space-y-1.5">
                          <div className="text-zinc-400 text-[10px] flex items-center justify-between">
                            <span>Raw sensor signals</span>
                            <ArrowDown className="w-2.5 h-2.5 text-zinc-500" />
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[8.5px] leading-tight text-center text-zinc-300 font-medium">
                            <div className="bg-zinc-900 border border-zinc-800 rounded py-1 px-1">
                              <span className="block text-zinc-400 text-[7.5px] uppercase">Classifier</span>
                              Risk Score
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded py-1 px-1">
                              <span className="block text-zinc-400 text-[7.5px] uppercase">Detector</span>
                              Anomaly
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded py-1 px-1">
                              <span className="block text-zinc-400 text-[7.5px] uppercase">Forecaster</span>
                              Water Level
                            </div>
                          </div>
                          <div className="flex items-center justify-center text-zinc-600">
                            <ArrowDown className="w-2.5 h-2.5" />
                          </div>
                          <div className={cn(
                            "text-zinc-300 text-[10.5px] flex items-center justify-between px-2 py-1 rounded border transition-all duration-300",
                            isCurrentActive
                              ? "bg-zinc-900 border-emerald-500/40 shadow-[0_0_10px_rgba(210,166,121,0.15)]"
                              : "bg-zinc-900/90 border-emerald-500/20"
                          )}>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                              Final Risk Score
                            </span>
                            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded text-[10px]">
                              0–100
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Architectural Micro-Tags for other cards */
                      <div className="mt-auto pt-3.5 border-t border-zinc-800/80">
                        <div className="flex flex-wrap gap-1.5">
                          {step.subSpecs?.map((spec) => (
                            <span 
                              key={spec} 
                              className="text-[11px] font-mono text-zinc-400 bg-zinc-950/70 px-2.5 py-0.5 rounded border border-zinc-800/70"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Flow Connector Arrow on Mobile / Tablet */}
                  {idx < pipelineSteps.length - 1 && hasBeenReached && maxReachedStage > idx && (
                    <div className={cn(
                      "flex lg:hidden justify-center py-2.5 transition-colors duration-300",
                      isCurrentActive ? "text-emerald-400" : "text-zinc-600"
                    )} aria-hidden="true">
                      <ArrowDown className="w-4 h-4 animate-bounce" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PipelineSection;
