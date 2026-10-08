import { Mesh, type Material, type Object3D } from "three";

// Poly Haven clocks model their glass with transmission (Blender). The glTF
// export leaves it opaque (alpha 1, alphaMode BLEND), textured with the dial
// itself and almost coplanar with it : opaque it hides the dial, transparent
// it z-fights with it (checkerboard). At corridor distance a pane is not
// visible anyway : hide every "*glass*" mesh.
export function hideGlass(scene: Object3D) {
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials: Material[] = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => /glass/i.test(material.name))) object.visible = false;
  });
}
