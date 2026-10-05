"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  Suspense,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Environment } from "@react-three/drei";
import * as THREE from "three";

const RADIUS = 2.0;
const MOON_TEXTURE_URL = "/textures/moon.jpg";

type RingState = "hidden" | "animating" | "visible";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Smoothly remap a value from one range to another.
 */
const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => {
  const t = clamp01((value - inMin) / (inMax - inMin));
  return THREE.MathUtils.lerp(outMin, outMax, t);
};

/**
 * Returns smoothstep-like interpolation.
 */
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/**
 * The Moon keeps its original slow self-rotation at all times.
 * Scroll only changes the presentation around it.
 */
const RealisticMoon = ({
  opacity,
  materialRef: externalMaterialRef,
}: {
  opacity: number;
  materialRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const internalMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const materialRef = externalMaterialRef || internalMaterialRef;
  const colorMap = useTexture(MOON_TEXTURE_URL);

  const isFading = opacity < 0.999;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }

    if (materialRef.current) {
      const fading = opacity < 0.999;
      if (materialRef.current.transparent !== fading) {
        materialRef.current.transparent = fading;
        materialRef.current.needsUpdate = true;
      }
      materialRef.current.depthWrite = true;
      materialRef.current.opacity = opacity;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[RADIUS, 64, 64]} />
      <meshStandardMaterial
        ref={materialRef}
        map={colorMap}
        bumpMap={colorMap}
        bumpScale={0.02}
        roughness={0.8}
        metalness={0.1}
        transparent={isFading}
        opacity={opacity}
        depthWrite={true}
      />
    </mesh>
  );
};

const particlesCount = 60000;

const [ringPositions, ringColors, ringRandoms] = (() => {
  const pos = new Float32Array(particlesCount * 3);
  const col = new Float32Array(particlesCount * 3);
  const rnd = new Float32Array(particlesCount);

  for (let i = 0; i < particlesCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rDist = Math.pow(Math.random(), 1.5);
    const radius = 2.2 + rDist * 2.2;

    const thickness = 0.4 - rDist * 0.2;
    const ySpread =
      Math.random() + Math.random() + Math.random() - 1.5;
    const y = ySpread * thickness;

    pos[i * 3] = Math.cos(angle) * radius;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(angle) * radius;

    const intensity = 1.0 - rDist;

    const paletteType = Math.random();
    let baseR: number;
    let baseG: number;
    let baseB: number;

    if (paletteType < 0.8) {
      baseR = 0.25;
      baseG = 0.30;
      baseB = 0.35;
    } else if (paletteType < 0.92) {
      baseR = 0.0;
      baseG = 0.6;
      baseB = 0.8;
    } else {
      baseR = 0.6;
      baseG = 0.2;
      baseB = 0.8;
    }

    baseR = Math.min(
      1.0,
      Math.max(0.0, baseR + (Math.random() - 0.5) * 0.1),
    );
    baseG = Math.min(
      1.0,
      Math.max(0.0, baseG + (Math.random() - 0.5) * 0.1),
    );
    baseB = Math.min(
      1.0,
      Math.max(0.0, baseB + (Math.random() - 0.5) * 0.1),
    );

    const sparkle = Math.random() > 0.95 ? 2.5 : 1.0;

    col[i * 3] = baseR * intensity * sparkle;
    col[i * 3 + 1] = baseG * intensity * sparkle;
    col[i * 3 + 2] = baseB * intensity * sparkle;
    rnd[i] = Math.random();
  }

  return [pos, col, rnd] as const;
})();

const ParticleRing = ({
  ringState,
  massiveAsteroidsRef,
  opacity,
  materialRef: externalMaterialRef,
}: {
  ringState: RingState;
  massiveAsteroidsRef: React.MutableRefObject<Float32Array>;
  opacity: number;
  materialRef?: React.RefObject<THREE.PointsMaterial | null>;
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const internalMaterialRef = useRef<THREE.PointsMaterial>(null);
  const materialRef = externalMaterialRef || internalMaterialRef;

  const uniforms = useRef({
    uProgress: {
      value: ringState === "visible" ? 1.0 : 0.0,
    },
    uAsteroids: {
      value: new Float32Array(75 * 4),
    },
    time: { value: 0 },
  });

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.02;
      pointsRef.current.updateMatrix();

      const invMat = new THREE.Matrix4()
        .copy(pointsRef.current.matrix)
        .invert();

      const localAsteroids = new Float32Array(75 * 4);

      for (let i = 0; i < 75; i++) {
        const ast = new THREE.Vector3(
          massiveAsteroidsRef.current[i * 4],
          massiveAsteroidsRef.current[i * 4 + 1],
          massiveAsteroidsRef.current[i * 4 + 2],
        );

        ast.applyMatrix4(invMat);

        localAsteroids[i * 4] = ast.x;
        localAsteroids[i * 4 + 1] = ast.y;
        localAsteroids[i * 4 + 2] = ast.z;
        localAsteroids[i * 4 + 3] =
          massiveAsteroidsRef.current[i * 4 + 3];
      }

      uniforms.current.uAsteroids.value = localAsteroids;
    }

    uniforms.current.time.value = state.clock.elapsedTime;

    if (ringState === "animating") {
      uniforms.current.uProgress.value += delta * 0.35;

      if (uniforms.current.uProgress.value > 1.0) {
        uniforms.current.uProgress.value = 1.0;
      }
    } else if (ringState === "visible") {
      uniforms.current.uProgress.value = 1.0;
    } else {
      uniforms.current.uProgress.value = 0.0;
    }

    if (materialRef.current) {
      materialRef.current.opacity = opacity;
    }
  });

  const onBeforeCompile = (shader: {
    uniforms: Record<string, unknown>;
    vertexShader: string;
    fragmentShader: string;
  }) => {
    shader.uniforms.uProgress = uniforms.current.uProgress;
    shader.uniforms.uAsteroids = uniforms.current.uAsteroids;
    shader.uniforms.time = uniforms.current.time;

    shader.vertexShader = `
      uniform float uProgress;
      uniform vec4 uAsteroids[75];
      uniform float time;
      attribute float aRandom;
      varying float vProgress;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      `#include <begin_vertex>`,
      `
        vec3 transformed = vec3(position);

        float angle = atan(transformed.x, transformed.z);
        float normalizedAngle =
          abs(angle) / 3.14159265359;
        float spawnThreshold = 1.0 - normalizedAngle;

        float progressValue =
          (uProgress * 1.4) - spawnThreshold;

        float particleProgress =
          smoothstep(0.0, 0.4, progressValue);

        vProgress = particleProgress;

        transformed.y +=
          sin(angle * 10.0 + time) *
          0.05 *
          aRandom;

        if (uProgress > 0.5) {
          for (int i = 0; i < 75; i++) {
            vec4 astData = uAsteroids[i];
            vec3 delta = transformed - astData.xyz;
            float dist = length(delta);

            float rad =
              astData.w * 2.0 + 0.15;

            if (dist < rad) {
              float force =
                pow((rad - dist) / rad, 2.0);

              transformed +=
                normalize(delta) *
                force *
                0.4;

              transformed.y +=
                force *
                0.20 *
                (aRandom - 0.5);
            }
          }
        }

        float swirl =
          (1.0 - particleProgress) * 4.0;

        float s = sin(swirl);
        float c = cos(swirl);

        transformed.xz =
          mat2(c, -s, s, c) *
          transformed.xz;

        transformed.y +=
          (1.0 - particleProgress) *
          (transformed.y >= 0.0 ? 1.0 : -1.0);

        vec3 moonSurface =
          normalize(transformed) * 2.1;

        transformed =
          mix(
            moonSurface,
            transformed,
            particleProgress
          );
      `,
    );

    shader.fragmentShader = `
      varying float vProgress;
      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <color_fragment>`,
      `
        #include <color_fragment>
        diffuseColor.a *= vProgress;
      `,
    );
  };

  return (
    <points
      ref={pointsRef}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={ringPositions}
          itemSize={3}
          args={[ringPositions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particlesCount}
          array={ringColors}
          itemSize={3}
          args={[ringColors, 3]}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={particlesCount}
          array={ringRandoms}
          itemSize={1}
          args={[ringRandoms, 1]}
        />
      </bufferGeometry>

      <pointsMaterial
        ref={materialRef}
        size={0.008}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        onBeforeCompile={onBeforeCompile}
      />
    </points>
  );
};

const generateAsteroids = (count: number) => {
  const data = [];

  for (let i = 0; i < count; i++) {
    const baseRadius = 2.8 + Math.random() * 2.0;
    const radialAmplitude = 0.5 + Math.random() * 1.5;
    const radialSpeed = 0.15 + Math.random() * 0.25;
    const phase = Math.random() * Math.PI * 2;

    const angle = Math.random() * Math.PI * 2;
    const zOffset = (Math.random() - 0.5) * 0.8;

    const speed =
      (0.04 + Math.random() * 0.08) *
      (Math.random() > 0.5 ? 1 : -1);

    const rotationSpeedX =
      (Math.random() - 0.5) * 0.05;
    const rotationSpeedY =
      (Math.random() - 0.5) * 0.05;
    const rotationSpeedZ =
      (Math.random() - 0.5) * 0.05;

    const scale =
      0.02 + Math.pow(Math.random(), 4) * 0.18;

    data.push({
      angle,
      baseRadius,
      radialAmplitude,
      radialSpeed,
      phase,
      zOffset,
      speed,
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      rz: Math.random() * Math.PI,
      rsx: rotationSpeedX,
      rsy: rotationSpeedY,
      rsz: rotationSpeedZ,
      scale,
    });
  }

  data.sort((a, b) => b.scale - a.scale);
  return data;
};

const AsteroidBelt = ({
  ringState,
  massiveAsteroidsRef,
  opacity,
  materialRef: externalMaterialRef,
}: {
  ringState: RingState;
  massiveAsteroidsRef: React.MutableRefObject<Float32Array>;
  opacity: number;
  materialRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
}) => {
  const meshRef =
    useRef<THREE.InstancedMesh>(null);

  const internalMaterialRef =
    useRef<THREE.MeshStandardMaterial>(null);
  const materialRef = externalMaterialRef || internalMaterialRef;

  const [colorMap, bumpMap] = useTexture([
    MOON_TEXTURE_URL,
    MOON_TEXTURE_URL,
  ]);

  const count = 75;
  const dummy = useMemo(
    () => new THREE.Object3D(),
    [],
  );
  const [asteroids] = useState(() =>
    generateAsteroids(count),
  );

  const scaleRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const targetScale =
      ringState === "hidden" ? 0 : 1;
    const lerpSpeed =
      ringState === "hidden" ? 5 : 2;

    scaleRef.current = THREE.MathUtils.lerp(
      scaleRef.current,
      targetScale,
      delta * lerpSpeed,
    );

    meshRef.current.visible =
      scaleRef.current >= 0.01;

    if (!meshRef.current.visible) return;

    asteroids.forEach((ast, i) => {
      ast.angle += ast.speed * delta;
      ast.phase += ast.radialSpeed * delta;

      let currentRadius =
        ast.baseRadius +
        Math.sin(ast.phase) *
          ast.radialAmplitude;

      if (currentRadius < 2.15) {
        const penetration =
          2.15 - currentRadius;

        currentRadius =
          2.15 + penetration * 0.85;
      }

      const x =
        Math.cos(ast.angle) *
        currentRadius;
      const y =
        Math.sin(ast.angle) *
        currentRadius;

      massiveAsteroidsRef.current[i * 4] = x;
      massiveAsteroidsRef.current[i * 4 + 1] = y;
      massiveAsteroidsRef.current[i * 4 + 2] =
        ast.zOffset;
      massiveAsteroidsRef.current[i * 4 + 3] =
        ast.scale;

      ast.rx += ast.rsx;
      ast.ry += ast.rsy;
      ast.rz += ast.rsz;

      dummy.position.set(
        x,
        y,
        ast.zOffset,
      );
      dummy.rotation.set(
        ast.rx,
        ast.ry,
        ast.rz,
      );
      dummy.scale.setScalar(
        ast.scale * scaleRef.current,
      );
      dummy.updateMatrix();

      meshRef.current!.setMatrixAt(
        i,
        dummy.matrix,
      );
    });

    meshRef.current.instanceMatrix.needsUpdate = true;

    if (materialRef.current) {
      const fading = opacity < 0.999;
      if (materialRef.current.transparent !== fading) {
        materialRef.current.transparent = fading;
        materialRef.current.needsUpdate = true;
      }
      materialRef.current.depthWrite = true;
      materialRef.current.opacity = opacity;
    }
  });

  const isFading = opacity < 0.999;

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        undefined,
        undefined,
        count,
      ]}
      castShadow
      receiveShadow
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        ref={materialRef}
        map={colorMap}
        bumpMap={bumpMap}
        bumpScale={0.08}
        color="#ffffff"
        roughness={0.7}
        metalness={0.1}
        transparent={isFading}
        opacity={opacity}
        depthWrite={true}
      />
    </instancedMesh>
  );
};

const RotatingStructure = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const groupRef =
    useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Keep the original continuous rotation.
      groupRef.current.rotation.y +=
        delta * 0.35;
    }
  });

  return (
    <group
      ref={groupRef}
      rotation={[0, Math.PI / 2, 0]}
    >
      <group
        rotation={[-Math.PI / 4.5, 0, 0]}
      >
        {children}
      </group>
    </group>
  );
};

interface AnimatedLunarStructureProps {
  scrollProgress: number;
}

const AnimatedLunarStructure = ({
  scrollProgress,
}: AnimatedLunarStructureProps) => {
  const massiveAsteroidsRef =
    useRef<Float32Array>(
      new Float32Array(75 * 4),
    );

  const smoothProgress =
    useRef(clamp01(scrollProgress));

  const groupRef =
    useRef<THREE.Group>(null);
  const moonMaterialRef =
    useRef<THREE.MeshStandardMaterial>(null);
  const particleMaterialRef =
    useRef<THREE.PointsMaterial>(null);
  const asteroidMaterialRef =
    useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    // Smooth the scroll value so the movement remains cinematic.
    smoothProgress.current =
      THREE.MathUtils.damp(
        smoothProgress.current,
        clamp01(scrollProgress),
        5.5,
        delta,
      );

    if (!groupRef.current) return;

    const p = smoothProgress.current;

    // PHASE 1: small controlled zoom-in.
    const zoomProgress = smooth(
      mapRange(p, 0.03, 0.18, 0.0, 1.0),
    );

    // PHASE 2: after zoom, move the scene farther RIGHT.
    const sideProgress = smooth(
      mapRange(p, 0.18, 0.36, 0.0, 1.0),
    );

    const baseScale = THREE.MathUtils.lerp(
      1.0,
      1.15,
      zoomProgress,
    );

    const secondSectionGrow = smooth(
      mapRange(p, 0.34, 0.48, 0.0, 1.0),
    );

    const scale = baseScale * THREE.MathUtils.lerp(
      1.0,
      1.35,
      secondSectionGrow,
    );

    const x = THREE.MathUtils.lerp(
      2.10,
      2.95,
      sideProgress,
    );

    // Very small Y movement to keep the composition grounded.
    const y = THREE.MathUtils.lerp(
      0.0,
      0.08,
      sideProgress,
    );

    groupRef.current.position.set(
      x,
      y,
      0,
    );
    groupRef.current.scale.setScalar(
      scale,
    );

    // Dynamic per-frame opacity calculation driven directly by damped cinematic progress
    const frameFadeProgress = smooth(
      mapRange(p, 0.28, 0.50, 0.0, 1.0),
    );
    const frameExitProgress = smooth(
      mapRange(p, 0.86, 0.98, 0.0, 1.0),
    );
    const frameExitFade = 1 - frameExitProgress * 0.70;

    const currentMoonOpacity = THREE.MathUtils.lerp(
      1.0,
      0.18,
      frameFadeProgress,
    ) * frameExitFade;

    const currentRingOpacity = THREE.MathUtils.lerp(
      1.0,
      0.18,
      frameFadeProgress,
    ) * frameExitFade;

    if (moonMaterialRef.current) {
      const fading = currentMoonOpacity < 0.999;
      if (moonMaterialRef.current.transparent !== fading) {
        moonMaterialRef.current.transparent = fading;
        moonMaterialRef.current.needsUpdate = true;
      }
      moonMaterialRef.current.depthWrite = true;
      moonMaterialRef.current.opacity = currentMoonOpacity;
    }

    if (particleMaterialRef.current) {
      particleMaterialRef.current.opacity = currentRingOpacity;
    }

    if (asteroidMaterialRef.current) {
      const fading = currentRingOpacity < 0.999;
      if (asteroidMaterialRef.current.transparent !== fading) {
        asteroidMaterialRef.current.transparent = fading;
        asteroidMaterialRef.current.needsUpdate = true;
      }
      asteroidMaterialRef.current.depthWrite = true;
      asteroidMaterialRef.current.opacity = currentRingOpacity;
    }
  });

  const p = clamp01(scrollProgress);

  const fadeProgress = smooth(
    mapRange(p, 0.28, 0.50, 0.0, 1.0),
  );

  const exitProgress = smooth(
    mapRange(p, 0.86, 0.98, 0.0, 1.0),
  );
  const exitFade = 1 - exitProgress * 0.70;

  // Target opacity (0.18) ensures the Moon, particle ring, and asteroid belt fade together in the second section
  const moonOpacity = THREE.MathUtils.lerp(
    1.0,
    0.18,
    fadeProgress,
  ) * exitFade;
  const ringOpacity = THREE.MathUtils.lerp(
    1.0,
    0.18,
    fadeProgress,
  ) * exitFade;

  return (
    <group ref={groupRef}>
      <RotatingStructure>
        <RealisticMoon opacity={moonOpacity} materialRef={moonMaterialRef} />

        <ParticleRing
          ringState="animating"
          massiveAsteroidsRef={
            massiveAsteroidsRef
          }
          opacity={ringOpacity}
          materialRef={particleMaterialRef}
        />

        <AsteroidBelt
          ringState="animating"
          massiveAsteroidsRef={
            massiveAsteroidsRef
          }
          opacity={ringOpacity}
          materialRef={asteroidMaterialRef}
        />

        <Environment preset="city" />
      </RotatingStructure>
    </group>
  );
};

interface InfoCard {
  number: string;
  stage: string;
  title: string;
  description: string;
}

const INFO_CARDS: InfoCard[] = [
  {
    number: "01",
    stage: "SENSE",
    title: "Sense",
    description:
      "Collect live environmental signals from distributed sensor nodes.",
  },
  {
    number: "02",
    stage: "UNDERSTAND",
    title: "Understand",
    description:
      "Detect anomalies and identify emerging hazard patterns.",
  },
  {
    number: "03",
    stage: "CORRELATE",
    title: "Correlate",
    description:
      "Estimate how risk is evolving across the monitored environment.",
  },
  {
    number: "04",
    stage: "PREDICT & ACT",
    title: "Predict & Act",
    description:
      "Predict how risk may evolve and enable timely, localized response.",
  },
];

const InfoOverlay = ({
  progress,
}: {
  progress: number;
}) => {
  const p = clamp01(progress);

  // Cards begin appearing only after the Moon has mostly completed
  // its zoom + rightward movement.
  const cardsStart = smooth(mapRange(p, 0.54, 0.70, 0, 1));
  const moonTextOpacity = smooth(mapRange(p, 0.75, 0.88, 0, 1));

  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none"
      aria-hidden="true"
    >
      {/* Left-side information cards */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full max-w-[460px] pl-6 sm:pl-10 lg:pl-16 pr-6">
        <div className="flex flex-col gap-4">
          {INFO_CARDS.map((card, index) => {
            const staggerStart = 0.50 + index * 0.055;
            const staggerEnd = staggerStart + 0.16;

            const cardProgress = smooth(
              mapRange(p, staggerStart, staggerEnd, 0, 1),
            );

            const visibleProgress =
              cardProgress * cardsStart;

            return (
              <div
                key={card.number}
                className="pointer-events-auto rounded-2xl border border-white/10 bg-zinc-950/75 backdrop-blur-md px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-colors hover:border-white/20"
                style={{
                  opacity: visibleProgress,
                  transform: `translate3d(${(1 - visibleProgress) * -28}px, 0, 0)`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-0.5 text-[11px] font-semibold tracking-[0.18em] text-zinc-500 font-mono">
                    {card.number}
                  </div>
                  <div>
                    <div className="text-[11px] font-mono tracking-widest text-zinc-400 font-semibold uppercase">
                      {card.stage}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-zinc-300">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Short statement positioned visually INSIDE the translucent Moon */}
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
          opacity: moonTextOpacity,
          transform: `translate3d(-50%, calc(-50% + ${(1 - moonTextOpacity) * 16}px), 0) scale(${0.96 + moonTextOpacity * 0.04})`,
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
    </div>
  );
};

export interface LunarGravityBackgroundProps {
  className?: string;
  scrollProgress?: number;
  useWindowScroll?: boolean;
  scrollDistance?: number;
}

export default function LunarGravityBackground({
  className,
  scrollProgress,
  useWindowScroll = true,
  scrollDistance = 1100,
}: LunarGravityBackgroundProps) {
  const [internalProgress, setInternalProgress] =
    useState(0);

  useEffect(() => {
    if (!useWindowScroll) return;

    let raf = 0;

    const updateProgress = () => {
      const progress = clamp01(
        window.scrollY / scrollDistance,
      );

      setInternalProgress(progress);
      raf = 0;
    };

    const onScroll = () => {
      if (!raf) {
        raf = window.requestAnimationFrame(
          updateProgress,
        );
      }
    };

    updateProgress();

    window.addEventListener(
      "scroll",
      onScroll,
      { passive: true },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        onScroll,
      );

      if (raf) {
        window.cancelAnimationFrame(raf);
      }
    };
  }, [useWindowScroll, scrollDistance]);

  const progress =
    scrollProgress !== undefined
      ? clamp01(scrollProgress)
      : internalProgress;

  return (
    <div
      className={`absolute inset-0 ${
        className ?? ""
      }`}
      style={{
        // The 3D scene stays non-interactive. Overlay cards/text
        // explicitly opt back into pointer events.
        pointerEvents: "none",
      }}
    >
      <Canvas
        shadows
        gl={{
          alpha: true,
          antialias: true,
        }}
        camera={{
          position: [0, 1.2, 10],
          fov: 45,
        }}
        dpr={[1, 2]}
        style={{
          pointerEvents: "none",
        }}
      >
        <Environment preset="city" />

        <ambientLight intensity={0.02} />

        <directionalLight
          position={[8, 5, 5]}
          intensity={1.5}
          color="#ffffff"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        <directionalLight
          position={[-5, -3, -5]}
          intensity={0.15}
          color="#4a90e2"
        />

        <Suspense fallback={null}>
          <AnimatedLunarStructure
            scrollProgress={progress}
          />
        </Suspense>
      </Canvas>

      <InfoOverlay progress={progress} />
    </div>
  );
}

export {
  LunarGravityBackground,
  AnimatedLunarStructure,
  InfoOverlay,
};
