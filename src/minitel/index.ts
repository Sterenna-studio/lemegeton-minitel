export { Minitel, type MinitelProps } from "./Minitel";
export { MinitelAttachment } from "./MinitelAttachment";
export { genericProfile, suppliedProfile, televisionProfile } from "./profiles";
export type { MaterialFinish, MeshRole } from "./MinitelModel";
export type { ModelProfile, ScreenSource, Anchor } from "./types";
export { Terminal, type TerminalPage } from "../videotex/terminal";
export {
  createScreen,
  text,
  plainText,
  type TerminalFrame,
} from "../videotex/screen";
export { useMinitel } from "../hooks/useMinitel";
