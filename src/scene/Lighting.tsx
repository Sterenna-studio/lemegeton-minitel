import { Environment, Lightformer } from "@react-three/drei";
// Warm key light, cool rim light to outline dark finishes against the dark
// page, and a local environment (no HDR download) for glossy reflections.
export function Lighting() {
  return (
    <>
      <hemisphereLight args={["#f3e6cf", "#1c1916", 1.6]} />
      <directionalLight
        position={[-4, 7, 5]}
        color="#ffe9c9"
        intensity={3.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.001}
      />
      <directionalLight position={[5, 4, -4]} color="#cfd8e6" intensity={2.4} />
      <directionalLight position={[-5, 3, -5]} color="#e6d2b0" intensity={1.4} />
      <Environment frames={1} resolution={256}>
        <Lightformer form="rect" intensity={2.2} color="#fff1dc" position={[-3, 4, 4]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#d7e1ee" position={[4, 3, -3]} scale={[4, 4, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#c9a56b" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={3} />
      </Environment>
    </>
  );
}
