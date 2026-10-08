import { useLoader, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Loader, REVISION, RepeatWrapping, type CompressedTexture, type WebGLRenderer } from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

// Every model goes through here : GLB optimised by tools/optimize_glb.mjs carry
// KTX2 textures (KHR_texture_basisu) and meshopt geometry
// (EXT_meshopt_compression). drei already decodes meshopt ; the KTX2 loader
// needs the renderer to pick a GPU format (ASTC on iPhone, BC7/S3TC on desktop).
// The Basis transcoder (basis/<three revision>/) comes from three itself, served
// by the basisTranscoder plugin of vite.config.ts : its version always matches.

let ktx2: KTX2Loader | undefined;

function ktx2Loader(gl: WebGLRenderer): KTX2Loader {
  if (!ktx2) ktx2 = new KTX2Loader().setTranscoderPath(`${import.meta.env.BASE_URL}basis/${REVISION}/`).detectSupport(gl);
  return ktx2;
}

/** useGLTF with KTX2 and meshopt support. */
export function useModel(url: string) {
  const gl = useThree((state) => state.gl);
  // drei bundles the GLTFLoader of three-stdlib ; it only calls load() on the
  // KTX2 loader, which three's own loader provides.
  return useGLTF(url, true, true, (loader) => loader.setKTX2Loader(ktx2Loader(gl) as never));
}

// Standalone KTX2 textures (tools/encode_textures.mjs) through the same shared
// loader, cached and suspending like any R3F loader.
class Ktx2TextureLoader extends Loader<CompressedTexture> {
  renderer?: WebGLRenderer;
  load(
    url: string,
    onLoad: (texture: CompressedTexture) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ) {
    ktx2Loader(this.renderer!).load(url, onLoad as never, onProgress, onError);
  }
}

/** KTX2 textures that tile (walls, floors). */
export function useKtx2Textures(urls: string[]): CompressedTexture[] {
  const gl = useThree((state) => state.gl);
  const textures = useLoader(Ktx2TextureLoader, urls, (loader) => {
    (loader as Ktx2TextureLoader).renderer = gl;
  }) as CompressedTexture[];
  for (const texture of textures) texture.wrapS = texture.wrapT = RepeatWrapping;
  return textures;
}
