"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  Suspense,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { INFO_CARDS, type InfoCard } from "./info-cards";

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
  const { camera, size, viewport } = useThree();
  const controlsRef = useRef<any>(null);

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

  // Match the original working posX responsive calculation
  const posX = Math.max(2.4, Math.min(3.4, viewport.width * 0.20));
  const posY = 0.0;

  const interactionEnabled = scrollProgress < 0.18;

  useLayoutEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      // Offset view horizontally so that the target (Moon center) renders cleanly on the right side (~70% width)
      // This allows OrbitControls to orbit directly around the Moon's center without swinging
      const xOffset = -size.width * 0.20;
      camera.setViewOffset(size.width, size.height, xOffset, 0, size.width, size.height);
      camera.position.set(posX, posY, 10);
      if (controlsRef.current) {
        controlsRef.current.target.set(posX, posY, 0);
        controlsRef.current.update();
      }
    }
  }, [camera, size, posX, posY]);

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

    // PHASE 1 — ZOOM: progress 0.03 → 0.18
    // Moon: smoothly becomes slightly larger (1.00 -> 1.15)
    const zoomProgress = smooth(
      mapRange(p, 0.03, 0.18, 0.0, 1.0),
    );

    // PHASE 2 — MOVE RIGHT: progress 0.18 → 0.36
    // After zooming: move the entire Moon/particle/asteroid structure toward the RIGHT
    // keep the complete structure visible, do NOT push it outside the viewport
    const sideProgress = smooth(
      mapRange(p, 0.18, 0.36, 0.0, 1.0),
    );

    // PHASE 3 — SECOND SECTION ENLARGEMENT: progress 0.34 → 0.48
    // As user scrolls into second section, Moon gradually scales up ~12.5% more (~1.55x)
    const secondSectionGrow = smooth(
      mapRange(p, 0.34, 0.48, 0.0, 1.0),
    );

    const baseScale = THREE.MathUtils.lerp(
      1.0,
      1.15,
      zoomProgress,
    );
    // Smoothly grow approximately 10–15% larger than previous second-section size (1.15 * 1.35 = ~1.55x)
    const scale = baseScale * THREE.MathUtils.lerp(
      1.0,
      1.35,
      secondSectionGrow,
    );

    // Starting hero right position (posX) -> shifted right destination (posX + 0.60)
    const x = THREE.MathUtils.lerp(
      posX,
      posX + 0.60,
      sideProgress,
    );

    // Subtle Y coordinate alignment to keep structure centered
    const y = THREE.MathUtils.lerp(
      posY,
      0.06,
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
    // PHASE 3 — FADE: progress 0.28 → 0.50
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

    // Smoothly restore camera orientation to facing Moon once scroll enters cinematic phase (>= 0.18)
    if (!interactionEnabled && controlsRef.current) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, posX, 3.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, posY, 3.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, 10, 3.5, delta);
      controlsRef.current.target.set(posX, posY, 0);
      controlsRef.current.update();
    }
  });

  const p = clamp01(scrollProgress);

  // PHASE 3 — FADE: progress 0.28 → 0.50
  // Transition starts as Moon expands and reaches full 0.18 translucency while text displays
  const fadeProgress = smooth(
    mapRange(p, 0.28, 0.50, 0.0, 1.0),
  );

  // PHASE 4 — EXIT TO THIRD SECTION: progress 0.86 → 0.98
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
    <>
      <OrbitControls
        ref={controlsRef}
        target={[posX, posY, 0]}
        enabled={interactionEnabled}
        enableRotate={interactionEnabled}
        enablePan={false}
        enableZoom={false}
        autoRotate={false}
      />

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
    </>
  );
};

const InfoOverlay = ({ progress }: { progress: number }) => {
  const p = clamp01(progress);

  // Second-section cards reveal, then Moon text fades in after Moon reaches larger size
  const cardsMaster = smooth(mapRange(p, 0.36, 0.52, 0, 1));
  const moonTextProgress = smooth(mapRange(p, 0.46, 0.58, 0, 1));

  // Exit transition to third section
  const exitProgress = smooth(mapRange(p, 0.86, 0.98, 0, 1));
  const exitOpacity = 1 - exitProgress;
  const exitTranslateY = -exitProgress * 24;

  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none"
      aria-hidden="true"
    >
      {/* LEFT: cards for the second-section story */}
      <div
        className="
          absolute left-0 top-1/2 -translate-y-1/2
          w-full max-w-[500px]
          px-6 sm:px-10 lg:pl-16 lg:pr-8
        "
      >
        <div className="flex flex-col gap-4">
          {INFO_CARDS.map((card, index) => {
            const start = 0.36 + index * 0.035;
            const end = start + 0.09;
            const itemProgress = smooth(
              mapRange(p, start, end, 0, 1),
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
                  transition-colors duration-200
                  hover:border-white/20 hover:bg-zinc-950/80
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
    </div>
  );
};

/**
 * Progress controller.
 *
 * IMPORTANT:
 * The 3D scene is attached to a scroll-stage.
 * This is the key change that lets the Moon remain visible while the
 * user transitions from the hero into the second section.
 */
export const ScrollStage = ({
  children,
  externalProgress,
  useWindowScroll = true,
  scrollStageVh = 260,
}: {
  children: (progress: number) => React.ReactNode;
  externalProgress?: number;
  useWindowScroll?: boolean;
  scrollStageVh?: number;
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [internalProgress, setInternalProgress] = useState(0);

  useEffect(() => {
    if (!useWindowScroll || externalProgress !== undefined) return;

    let raf = 0;

    const updateProgress = () => {
      const el = stageRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const scrollableDistance =
        Math.max(window.innerHeight, el.offsetHeight - window.innerHeight);

      // Start at 0 while the stage is entering the viewport.
      // Reach 1 near the bottom of the stage.
      const traveled = Math.min(
        scrollableDistance,
        Math.max(0, -rect.top),
      );

      setInternalProgress(
        clamp01(traveled / Math.max(1, scrollableDistance)),
      );

      raf = 0;
    };

    const onScroll = () => {
      if (!raf) {
        raf = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [useWindowScroll, externalProgress]);

  const progress =
    externalProgress !== undefined
      ? clamp01(externalProgress)
      : internalProgress;

  return (
    <div
      ref={stageRef}
      className="relative w-full"
      style={{
        minHeight: `${scrollStageVh}vh`,
      }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {children(progress)}
      </div>
    </div>
  );
};

export interface LunarGravityBackgroundProps {
  className?: string;
  /**
   * Optional external scroll progress.
   * 0 = initial hero state
   * 1 = final second-section state
   */
  scrollProgress?: number;
  /**
   * When true, calculate progress from the component's own scroll stage.
   * When false, the parent can provide scrollProgress.
   */
  useWindowScroll?: boolean;
  /**
   * Height of the scroll stage in viewport heights.
   */
  scrollStageVh?: number;
  /**
   * Optional children or custom overlay elements that receive progress
   */
  children?: ((progress: number) => React.ReactNode) | React.ReactNode;
}

export default function LunarGravityBackground({
  className,
  scrollProgress,
  useWindowScroll = true,
  scrollStageVh = 260,
  children,
}: LunarGravityBackgroundProps) {
  return (
    <ScrollStage
      externalProgress={scrollProgress}
      useWindowScroll={useWindowScroll}
      scrollStageVh={scrollStageVh}
    >
      {(progress) => {
        const interactive = progress < 0.30;
        return (
          <div
            className={`absolute inset-0 ${className ?? ""}`}
            style={{
              pointerEvents: interactive ? "auto" : "none",
            }}
          >
            <Canvas
              shadows
              gl={{
                alpha: true,
                antialias: true,
              }}
              camera={{
                position: [0, 0, 10],
                fov: 45,
              }}
              dpr={[1, 2]}
              className={cn(
                "w-full h-full",
                interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              )}
              style={{
                pointerEvents: interactive ? "auto" : "none",
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

            {typeof children === "function" ? children(progress) : children}
          </div>
        );
      }}
    </ScrollStage>
  );
}

/**
 * Pure 3D Canvas component for direct embedding into sticky story stages.
 * Retains 100% of the Moon, 60,000 particle shader, 75 asteroids, and rotation.
 */
export function LunarCanvas({
  scrollProgress,
  className,
}: {
  scrollProgress: number;
  className?: string;
}) {
  const interactive = scrollProgress < 0.30;

  return (
    <div
      className={`absolute inset-0 ${className ?? ""}`}
      style={{
        pointerEvents: interactive ? "auto" : "none",
      }}
    >
      <Canvas
        shadows
        gl={{
          alpha: true,
          antialias: true,
        }}
        camera={{
          position: [0, 0, 10],
          fov: 45,
        }}
        dpr={[1, 2]}
        className={cn(
          "w-full h-full",
          interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        )}
        style={{
          pointerEvents: interactive ? "auto" : "none",
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
          <AnimatedLunarStructure scrollProgress={scrollProgress} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export {
  LunarGravityBackground,
  LunarGravityBackground as LunarGravityScrollExperience,
  AnimatedLunarStructure,
  InfoOverlay,
  INFO_CARDS,
  type InfoCard,
};
