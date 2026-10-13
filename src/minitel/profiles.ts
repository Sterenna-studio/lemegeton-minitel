import type { ModelProfile } from "./types";
export const genericProfile: ModelProfile = {
  normalize: true,
  screenNames: ["Minitel_Screen", "Screen", "CRT"],
  screenFallback: { position: [0, 1.28, 0.75], size: [1.91, 1.56] },
  anchors: {
    top: { position: [0, 2.4, 0] },
    left: { position: [-1.24, 1.2, 0] },
    right: { position: [1.24, 1.2, 0] },
    rear: { position: [0, 1.1, -1] },
  },
  keys: {},
};
export const suppliedProfile: ModelProfile = {
  ...genericProfile,
  normalize: false,
  // Bounds centre of Minitel_Screen in public/models/minitel.glb.
  screenCenter: [0, 1.282, 0.743],
  // Minitel_Screen is two flat triangles : bulge it like the CRT glass.
  screenBulge: 0.16,
  keys: {
    Object_51: "1",
    Object_52: "2",
    Object_53: "3",
    Object_48: "4",
    Object_49: "5",
    Object_50: "6",
    Object_54: "7",
    Object_56: "8",
    Object_55: "9",
    Object_42: "0",
    Object_57: "*",
    Object_58: "#",
    Object_46: "ConnexionFin",
    Object_37: "Repetition",
    Object_38: "Annulation",
    Object_39: "Retour",
    Object_43: "Sommaire",
    Object_40: "Correction",
    Object_41: "Suite",
    Object_45: "Guide",
    Object_44: "Envoi",
    Object_20: "A",
    Object_69: "Z",
    Object_70: "E",
    Object_68: "R",
    Object_11: "T",
    Object_13: "Y",
    Object_14: "U",
    Object_12: "I",
    Object_10: "O",
    Object_21: "P",
    Object_23: "Q",
    Object_66: "S",
    Object_67: "D",
    Object_65: "F",
    Object_60: "G",
    Object_61: "H",
    Object_62: "J",
    Object_64: "K",
    Object_63: "L",
    Object_24: "M",
    Object_22: "W",
    Object_17: "X",
    Object_18: "C",
    Object_16: "V",
    Object_15: "B",
    Object_59: "N",
    Object_25: " ",
  },
};
// Web copy of "1950's Retro Television" (tools/prepare_television.py):
// 2.4 units high, about 3.55 wide, screen already named Minitel_Screen.
export const televisionProfile: ModelProfile = {
  ...genericProfile,
  normalize: false,
  screenFallback: { position: [0, 1.73, 0.5], size: [1.34, 1.12] },
  // Bounds centre of Minitel_Screen in public/models/television-1950.glb.
  screenCenter: [0.014, 1.732, 0.46],
  anchors: {
    top: { position: [0, 2.4, 0] },
    left: { position: [-1.78, 1.2, 0] },
    right: { position: [1.78, 1.2, 0] },
    rear: { position: [0, 1.2, -0.5] },
  },
};
// Web copy of the Velta-3D scan of the Radiotechnique Minitel 1 NFZ 300
// (tools/prepare_nfz300.py) : 3.02 units high, 2.34 wide, keyboard open in
// front ; screen and keys added on the scan, keys named Key_* with a `key` extra.
export const nfz300Profile: ModelProfile = {
  ...genericProfile,
  normalize: false,
  screenFallback: { position: [0, 1.369, -0.564], size: [1.81, 1.47] },
  // Bounds centre of Minitel_Screen in public/models/minitel-nfz-300.glb.
  screenCenter: [0, 1.369, -0.564],
  screenBulge: 0.12,
  anchors: {
    top: { position: [0, 3.02, -0.6] },
    left: { position: [-1.17, 1.5, -0.6] },
    right: { position: [1.17, 1.5, -0.6] },
    rear: { position: [0, 1.4, -1.63] },
  },
};
