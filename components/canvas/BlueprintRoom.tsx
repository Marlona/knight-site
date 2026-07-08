"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const OAK = "#a67c52";
const TAUPE = "#b3a68e";

type ProgressRef = React.RefObject<number>;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** Furniture massing blocks: size, position, and when they assemble (0..1). */
const FURNITURE: Array<{ size: [number, number, number]; pos: [number, number, number]; appear: number }> = [
  { size: [1.7, 0.45, 0.75], pos: [-0.45, 0.225, 0.35], appear: 0.05 }, // sofa
  { size: [0.8, 0.28, 0.5], pos: [-0.45, 0.14, -0.45], appear: 0.2 }, // coffee table
  { size: [0.5, 1.5, 0.4], pos: [1.25, 0.75, 0.9], appear: 0.35 }, // shelf
  { size: [0.35, 0.35, 0.35], pos: [0.9, 0.175, -0.7], appear: 0.5 }, // side table
  { size: [0.12, 1.2, 0.12], pos: [-1.35, 0.6, -0.8], appear: 0.62 }, // floor lamp
  { size: [2.4, 0.02, 1.6], pos: [-0.2, 0.01, 0], appear: 0.75 }, // rug
  { size: [0.3, 0.18, 0.3], pos: [0, 2.05, 0], appear: 0.88 }, // pendant
];

function WireBox({
  size,
  color = OAK,
  opacity = 0.85,
}: {
  size: [number, number, number];
  color?: string;
  opacity?: number;
}) {
  const geometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)),
    [size],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
}

function Room({ progressRef }: { progressRef: ProgressRef }) {
  const group = useRef<THREE.Group>(null);
  const itemRefs = useRef<Array<THREE.Group | null>>([]);

  useFrame(() => {
    const p = progressRef.current ?? 0;
    if (group.current) group.current.rotation.y = -0.55 + p * 1.15;
    FURNITURE.forEach((item, i) => {
      const obj = itemRefs.current[i];
      if (!obj) return;
      const s = easeOut(clamp01((p - item.appear) / 0.16));
      obj.scale.setScalar(Math.max(0.0001, s));
      obj.visible = s > 0.001;
    });
  });

  return (
    <group ref={group} position={[0, -0.9, 0]}>
      {/* Floor drafting grid */}
      <gridHelper args={[4, 14, TAUPE, TAUPE]}>
        <lineBasicMaterial transparent opacity={0.28} />
      </gridHelper>
      {/* Room shell: two walls as edge rectangles */}
      <group position={[0, 1.1, -2]}>
        <WireBox size={[4, 2.2, 0.02]} opacity={0.5} />
      </group>
      <group position={[-2, 1.1, 0]}>
        <WireBox size={[0.02, 2.2, 4]} opacity={0.5} />
      </group>
      {/* Window cutout hint on the back wall */}
      <group position={[0.7, 1.3, -1.99]}>
        <WireBox size={[1.4, 1.1, 0.01]} color={TAUPE} opacity={0.55} />
      </group>
      {FURNITURE.map((item, i) => (
        <group
          key={i}
          position={item.pos}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
        >
          <WireBox size={item.size} />
        </group>
      ))}
    </group>
  );
}

/** Re-render (demand frameloop) only when the scroll progress ref moves. */
function InvalidateOnProgress({ progressRef }: { progressRef: ProgressRef }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const loop = () => {
      const p = progressRef.current ?? 0;
      if (p !== last) {
        last = p;
        invalidate();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, progressRef]);
  return null;
}

/**
 * The one restrained 3D moment: an oak-line wireframe living room that
 * assembles piece by piece as the Services section scrolls. Dynamically
 * imported with ssr:false so three.js stays out of the initial bundle.
 */
export default function BlueprintRoom({ progressRef }: { progressRef: ProgressRef }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [3.1, 2.1, 3.4], fov: 38 }}
      className="!pointer-events-none"
      aria-hidden
    >
      <InvalidateOnProgress progressRef={progressRef} />
      <Room progressRef={progressRef} />
    </Canvas>
  );
}
