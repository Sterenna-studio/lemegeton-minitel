export function Lighting() {
  return (
    <>
      <hemisphereLight args={["#ffffff", "#89958b", 2.2]} />
      <directionalLight
        position={[-4, 7, 5]}
        intensity={3.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.001}
      />
      <directionalLight position={[5, 4, -4]} intensity={2} />
    </>
  );
}
