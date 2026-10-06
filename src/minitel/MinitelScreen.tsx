import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CanvasTexture,
  LinearFilter,
  Mesh,
  SRGBColorSpace,
  ShaderMaterial,
  type Texture,
} from "three";
import {
  HEIGHT,
  WIDTH,
  renderTerminal,
  type CrtEffects,
} from "../videotex/renderer";
import type { ScreenSource } from "./types";
interface Props {
  source: ScreenSource;
  mesh: Mesh;
  effects: CrtEffects;
  reducedMotion: boolean;
}
const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragmentShader = `
  uniform sampler2D content; uniform float curved; varying vec2 vUv;
  void main(){
    vec2 p=vUv*2.0-1.0;
    vec2 uv=(p*(1.0+curved*.018*dot(p,p))+1.0)*.5;
    vec3 color=texture2D(content,uv).rgb;
    if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)color=vec3(.012,.025,.018);
    gl_FragColor=vec4(color,1.0);
    #include <colorspace_fragment>
  }`;
export function MinitelScreen({ source, mesh, effects, reducedMotion }: Props) {
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = WIDTH;
    c.height = HEIGHT;
    return c;
  }, []);
  const ownedTexture = useMemo(() => new CanvasTexture(canvas), [canvas]);
  const externalCanvas = source.kind === "canvas" ? source.canvas : null;
  const canvasTexture = useMemo(
    () => (externalCanvas ? new CanvasTexture(externalCanvas) : null),
    [externalCanvas],
  );
  const texture: Texture =
    source.kind === "texture"
      ? source.texture
      : (canvasTexture ?? ownedTexture);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { content: { value: texture }, curved: { value: 0 } },
        toneMapped: false,
      }),
    [texture],
  );
  const latest = useRef({ source, effects, reducedMotion });
  useEffect(() => {
    latest.current = { source, effects, reducedMotion };
  }, [source, effects, reducedMotion]);
  useEffect(() => {
    ownedTexture.flipY = false;
    ownedTexture.colorSpace = SRGBColorSpace;
    ownedTexture.minFilter = LinearFilter;
    ownedTexture.generateMipmaps = false;
    if (canvasTexture) {
      canvasTexture.flipY = false;
      canvasTexture.colorSpace = SRGBColorSpace;
      canvasTexture.minFilter = LinearFilter;
      canvasTexture.generateMipmaps = false;
    }
    return () => {
      ownedTexture.dispose();
      canvasTexture?.dispose();
    };
  }, [ownedTexture, canvasTexture]);
  useEffect(() => {
    const original = mesh.material;
    mesh.material = material;
    invalidate();
    return () => {
      mesh.material = original;
      material.dispose();
    };
  }, [mesh, material, invalidate]);
  useEffect(() => {
    material.uniforms.curved.value = effects.curvature ? 1 : 0;
    if (source.kind === "videotex") {
      const ctx = canvas.getContext("2d");
      if (ctx)
        renderTerminal(
          ctx,
          source.frame,
          effects,
          performance.now(),
          reducedMotion,
        );
    }
    texture.needsUpdate = true;
    invalidate();
  }, [source, effects, reducedMotion, canvas, texture, material, invalidate]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = latest.current;
      if (current.source.kind === "videotex" && !current.reducedMotion) {
        const ctx = canvas.getContext("2d");
        if (ctx)
          renderTerminal(
            ctx,
            current.source.frame,
            current.effects,
            performance.now(),
            false,
          );
        texture.needsUpdate = true;
        invalidate();
      } else if (
        current.source.kind !== "videotex" &&
        current.source.continuous
      ) {
        texture.needsUpdate = true;
        invalidate();
      }
    }, 125);
    return () => window.clearInterval(timer);
  }, [canvas, texture, invalidate]);
  useFrame(() => {
    if (source.kind === "texture" && source.continuous)
      texture.needsUpdate = true;
  });
  return null;
}
