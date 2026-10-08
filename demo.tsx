"use client";

import React, { Suspense, lazy, useRef, useState, useEffect } from "react";
import { INFO_CARDS } from "@/components/ui/info-cards";

// Heavy parts (three.js canvas + below-the-fold sections) load as separate
// chunks so the page text paints first.
const LunarCanvas = lazy(() =>
  import("@/components/ui/lunar-gravity-scroll-experience").then((m) => ({
    default: m.LunarCanvas,
  })),
);
const PipelineSection = lazy(() =>
  import("@/components/pipeline-section").then((m) => ({
    default: m.PipelineSection,
  })),
);
const EnvironmentalDashboardSection = lazy(() =>
  import("@/components/environmental-dashboard-section").then((m) => ({
    default: m.EnvironmentalDashboardSection,
  })),
);
const SectionFallback = () => <div style={{ minHeight: "100vh" }} />;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => {
  const t = clamp01((value - inMin) / (inMax - inMin));
  return outMin + (outMax - outMin) * t;
};

export default function Demo() {
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    const handleScroll = () => {
      const el = storyContainerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const scrollableDistance = el.offsetHeight - window.innerHeight;
      if (scrollableDistance <= 0) return;

      // When container is at top of viewport, rect.top is 0 => progress is 0.
      // As user scrolls down through the container, -rect.top increases.
      const traveled = Math.min(scrollableDistance, Math.max(0, -rect.top));
      const p = clamp01(traveled / scrollableDistance);
      setScrollProgress(p);
      raf = 0;
    };

    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(handleScroll);
      }
    };

    handleScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Interaction enabled during initial hero and zoom phase (storyProgress < 0.18)
  const isInteractive = scrollProgress < 0.18;

  // ANIMATION PROGRESS CHOREOGRAPHY (Single shared progress 0 -> 1):
  // PHASE 1 (0.00 - 0.18): Hero remains full opacity until zoom begins (0.06 - 0.18 dissolves smoothly)
  const heroOpacity = 1 - smooth(mapRange(scrollProgress, 0.06, 0.18, 0, 1));
  const heroTranslateY = (1 - heroOpacity) * -24;
  const gradientOpacity = 1 - smooth(mapRange(scrollProgress, 0.06, 0.20, 0, 1));

  // PHASE 2 & 3: Second-section cards reveal, then Moon text fades in after Moon reaches larger size
  const cardsMaster = smooth(mapRange(scrollProgress, 0.36, 0.52, 0, 1));
  const moonTextProgress = smooth(mapRange(scrollProgress, 0.46, 0.58, 0, 1));

  // PHASE 4 (0.86 - 0.98): Second section gradually gives way to third section
  const exitProgress = smooth(mapRange(scrollProgress, 0.86, 0.98, 0, 1));
  const exitOpacity = 1 - exitProgress;
  const exitTranslateY = -exitProgress * 24;

  return (
    <div
      id="demo-container"
      className="w-full min-h-screen overflow-x-clip bg-black font-sans text-zinc-100 selection:bg-zinc-800"
    >
      {/* ============================================================ */}
      {/* SHARED STORY CONTAINER: Encompasses Hero, Transition, & Second Section */}
      {/* The 3D Canvas physically persists across this entire container. */}
      {/* Extended height (480vh) provides generous time to experience second section */}
      {/* ============================================================ */}
      <div
        id="lunar-story-container"
        ref={storyContainerRef}
        className="relative w-full h-[480vh]"
      >
        {/* ============================================================ */}
        {/* PERSISTENT 3D CANVAS LAYER: Exactly ONE Canvas instance       */}
        {/* Sticky top-0 h-screen across the entire 300vh story          */}
        {/* Interactive when scrollProgress < 0.30; non-interactive later */}
        {/* ============================================================ */}
        <div
          className="sticky top-0 h-screen w-full z-0 overflow-hidden"
          style={{
            pointerEvents: isInteractive ? "auto" : "none",
          }}
        >
          <Suspense fallback={null}>
            <LunarCanvas scrollProgress={scrollProgress} />
          </Suspense>
        </div>

        {/* ============================================================ */}
        {/* STORY CONTENT LAYER: Pinned in sync with sticky canvas       */}
        {/* Encompasses Hero and Second Section in the same container     */}
        {/* ============================================================ */}
        <div className="sticky top-0 h-screen w-full -mt-[100vh] z-10 pointer-events-none overflow-hidden">
          {/* Left-side subtle gradient protecting Hero readability */}
          <div
            className="absolute inset-y-0 left-0 w-full md:w-[50%] lg:w-[46%] bg-gradient-to-r from-black via-black/95 to-transparent z-10 pointer-events-none transition-opacity duration-150"
            style={{ opacity: gradientOpacity }}
            aria-hidden="true"
          />

          {/* ========================================================== */}
          {/* 1. HERO CONTENT SECTION */}
          {/* ========================================================== */}
          <section
            id="hero-section"
            className="absolute inset-0 z-20 flex items-center pointer-events-none"
            style={{
              opacity: heroOpacity,
              transform: `translate3d(0, ${heroTranslateY}px, 0)`,
              visibility: heroOpacity <= 0 ? "hidden" : "visible",
            }}
          >
            <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 pointer-events-none">
              <div 
                className="w-full md:w-[48%] lg:w-[42%] max-w-[500px]"
                style={{
                  pointerEvents: heroOpacity > 0.05 ? "auto" : "none",
                }}
              >
                <h1 className="text-[4.25rem] sm:text-[5rem] lg:text-[5.75rem] font-bold tracking-tighter leading-[0.9] mb-4">
                  <span className="text-zinc-50 drop-shadow-sm">Eco</span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-400 to-zinc-800 drop-shadow-md">
                    Sentinel
                  </span>
                </h1>
                <p className="text-base sm:text-lg font-semibold text-zinc-200 tracking-tight mb-4">
                  AI-Powered Multi-Hazard Intelligence
                </p>
                <p className="text-base sm:text-lg text-zinc-400 font-medium leading-relaxed max-w-[360px]">
                  Detect threats. Predict risk. Act before disaster strikes.
                </p>
              </div>
            </div>
          </section>

          {/* ========================================================== */}
          {/* 2. SECOND SECTION CONTENT */}
          {/* LEFT: 4 Floating Information Cards */}
          {/* RIGHT: Statement sitting over the translucent Moon */}
          {/* ========================================================== */}
          <section
            id="second-section"
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              visibility: cardsMaster <= 0 && moonTextProgress <= 0 ? "hidden" : "visible",
            }}
          >
            {/* LEFT: Floating Information Cards */}
            <div
              className="
                absolute left-0 top-1/2 -translate-y-1/2
                w-full max-w-[500px]
                px-6 sm:px-10 lg:pl-16 lg:pr-8
              "
            >
              <div className="flex flex-col gap-4">
                {INFO_CARDS.map((card, index) => {
                  // Cards animate in sequentially as user scrolls into the second section
                  const start = 0.36 + index * 0.035;
                  const end = start + 0.09;
                  const itemProgress = smooth(
                    mapRange(scrollProgress, start, end, 0, 1)
                  );
                  const visible = itemProgress * cardsMaster * exitOpacity;

                  return (
                    <div
                      key={card.number}
                      className="
                        pointer-events-auto
                        rounded-2xl
                        border border-white/[0.10]
                        bg-zinc-950/70
                        backdrop-blur-md
                        px-5 py-4
                        shadow-[0_18px_60px_rgba(0,0,0,0.24)]
                        will-change-transform
                        transition-all duration-200
                        hover:border-white/20 hover:bg-zinc-950/85
                      "
                      style={{
                        opacity: visible,
                        transform: `translate3d(${(1 - visible) * -38}px, ${exitTranslateY}px, 0)`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="pt-0.5 text-[11px] font-semibold tracking-[0.18em] text-zinc-500 font-mono">
                          {card.number}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold tracking-tight text-zinc-100 uppercase tracking-wider">
                            {card.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-zinc-400">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Statement sitting INSIDE the translucent Moon */}
            <div
              className="
                absolute
                left-[74%]
                top-1/2
                w-[330px] sm:w-[370px] lg:w-[395px] max-w-[80vw]
                text-center
                pointer-events-none
                select-none
              "
              style={{
                opacity: moonTextProgress * exitOpacity,
                transform: `translate3d(-50%, calc(-50% + ${(1 - moonTextProgress) * 16 + exitTranslateY}px), 0) scale(${0.96 + moonTextProgress * 0.04})`,
              }}
            >
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400 font-mono drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                EcoSentinel
              </p>
              <h2 className="mt-2 sm:mt-2.5 text-[1.65rem] sm:text-[1.95rem] lg:text-[2.15rem] font-semibold tracking-tight text-zinc-100 leading-[1.18] drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
                Environmental Hazards Don't Wait.
                <br />
                <span className="text-zinc-300">Neither Do We.</span>
              </h2>
              <p className="mt-3 text-[14px] sm:text-[15px] lg:text-[16px] leading-[1.48] text-zinc-300/90 font-normal max-w-[310px] sm:max-w-[350px] lg:max-w-[370px] mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                EcoSentinel transforms continuous environmental signals into actionable intelligence — detecting abnormal conditions, predicting emerging risks, and delivering localized warnings before a hazard becomes a crisis.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. SUBSEQUENT SECTION: From Signals to Situational Intelligence */}
      {/* ============================================================ */}
      <Suspense fallback={<SectionFallback />}>
        <PipelineSection />
      </Suspense>

      {/* ============================================================ */}
      {/* 4. FOURTH SECTION: Live Environmental Data & Intelligence   */}
      {/* ============================================================ */}
      <Suspense fallback={<SectionFallback />}>
        <EnvironmentalDashboardSection />
      </Suspense>
    </div>
  );
}
