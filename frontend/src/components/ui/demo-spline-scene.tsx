import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

export function SplineSceneBasic() {
  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-black/60 overflow-hidden h-72">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <span className="loader" />
          </div>
        }
      >
        <Spline
          scene="https://prod.spline.design/your-scene-url-here/scene.splinecode"
          className="w-full h-full"
        />
      </Suspense>
    </div>
  );
}


