import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';

export interface MinitelSceneProps { children: ReactNode; background?: string }

/** Studio scene sized for the normalised Minitel GLB (2.4 units high, screen facing +Z). */
export function MinitelScene({ children, background = '#e4e8e7' }: MinitelSceneProps) {
  return (
    <Canvas camera={{ position: [4.2, 3.4, 9.2], fov: 35 }} dpr={[1, 2]} shadows={false}>
      <color attach="background" args={[background]} />
      <hemisphereLight args={['#f4f1e8', '#8a8f8c', 1.1]} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} />
      <directionalLight position={[-5, 3, -2]} intensity={0.6} />
      <Suspense fallback={null}>{children}</Suspense>
      <ContactShadows position={[0, 0, 0]} scale={12} blur={2.4} opacity={0.35} far={3} />
      <OrbitControls target={[0, 1.2, 0]} enablePan={false} minDistance={3.5} maxDistance={12}
        minPolarAngle={0.3} maxPolarAngle={Math.PI / 2 - 0.05} />
    </Canvas>
  );
}
