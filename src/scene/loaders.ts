import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { WebGLRenderer } from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

// Every model goes through here : GLB optimised by tools/optimize_glb.mjs carry
// KTX2 textures (KHR_texture_basisu) and meshopt geometry
// (EXT_meshopt_compression). drei already decodes meshopt ; the KTX2 loader
// needs the renderer to pick a GPU format (ASTC on iPhone, BC7/S3TC on desktop).
// The Basis transcoder (basis/) comes from three itself, served by the
// basisTranscoder plugin of vite.config.ts : its version always matches.

let ktx2: KTX2Loader | undefined;

function ktx2Loader(gl: WebGLRenderer): KTX2Loader {
  if (!ktx2) ktx2 = new KTX2Loader().setTranscoderPath(`${import.meta.env.BASE_URL}basis/`).detectSupport(gl);
  return ktx2;
}

/** useGLTF with KTX2 and meshopt support. */
export function useModel(url: string) {
  const gl = useThree((state) => state.gl);
  // drei bundles the GLTFLoader of three-stdlib ; it only calls load() on the
  // KTX2 loader, which three's own loader provides.
  return useGLTF(url, true, true, (loader) => loader.setKTX2Loader(ktx2Loader(gl) as never));
}
