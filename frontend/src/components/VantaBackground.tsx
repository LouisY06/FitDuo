import { useEffect, useRef, useState, type ReactNode } from "react";

type VantaBackgroundProps = {
  children?: ReactNode;
};

declare global {
  interface Window {
    VANTA: {
      RINGS: (options: any) => { destroy: () => void };
    };
    THREE: any;
  }
}

export function VantaBackground({ children }: VantaBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    if (!vantaEffect && containerRef.current && window.VANTA && window.THREE) {
      const effect = window.VANTA.RINGS({
        el: containerRef.current,
        THREE: window.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        // Color options from Vanta.js panel
        color: 0x63ff00,
        backgroundColor: 0x202428,
        backgroundAlpha: 1.0,
      });
      setVantaEffect(effect);
    }

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Overlay content goes above Vanta */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}


