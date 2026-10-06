import { Suspense, type ComponentProps, type ReactNode } from "react";
import { MinitelModel } from "./MinitelModel";
import { genericProfile } from "./profiles";
import { defaultEffects } from "../videotex/renderer";
import { AnchorContext } from "./MinitelAttachment";
import { useReducedMotion } from "../hooks/useReducedMotion";
export type MinitelProps = Omit<
  ComponentProps<typeof MinitelModel>,
  "profile" | "effects" | "reducedMotion"
> & {
  profile?: ComponentProps<typeof MinitelModel>["profile"];
  effects?: ComponentProps<typeof MinitelModel>["effects"];
  children?: ReactNode;
};
export function Minitel({
  profile = genericProfile,
  effects = defaultEffects,
  children,
  ...props
}: MinitelProps) {
  const reducedMotion = useReducedMotion();
  return (
    <AnchorContext.Provider value={profile.anchors}>
      <Suspense fallback={null}>
        <MinitelModel
          {...props}
          profile={profile}
          effects={effects}
          reducedMotion={reducedMotion}
        />
        {children}
      </Suspense>
    </AnchorContext.Provider>
  );
}
