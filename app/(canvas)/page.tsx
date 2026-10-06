import { HomeCanvasDynamic } from "@/components/v3/HomeCanvasDynamic";
import { HomeCanvasStatic } from "@/components/v3/HomeCanvasStatic";

export default function Home() {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "1") {
    return <HomeCanvasStatic />;
  }
  return <HomeCanvasDynamic />;
}
