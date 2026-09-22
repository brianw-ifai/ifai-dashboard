"use client";

import { SdkViewToggle } from "@/components/sdk/SdkViewToggle";
import { sdkCanvasSpec } from "@/components/sdk/sdk-canvas-spec";
import { IntelligenceCanvas } from "@/lib/canvas-sdk";

export function SdkCanvas() {
  return (
    <IntelligenceCanvas
      spec={{
        ...sdkCanvasSpec,
        headerSlot: <SdkViewToggle view="canvas" />,
      }}
    />
  );
}
