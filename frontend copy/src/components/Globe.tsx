import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import "./Globe.css";

type GlobeProps = {
  size?: number;
};

export function Globe({ size = 400 }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const phiRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = size * 2;
    const height = size * 2;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Create globe instance
    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width,
      height,
      phi: 0,
      theta: 0,
      dark: 0.9,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.1, 0.15],
      markerColor: [0.39, 1.0, 0.0], // Neon green #63ff00
      glowColor: [0.39, 1.0, 0.0],
      markers: [
        // Major cities with active players
        { location: [40.7128, -74.006], size: 0.1 }, // New York
        { location: [51.5074, -0.1278], size: 0.1 }, // London
        { location: [22.3193, 114.1694], size: 0.1 }, // Hong Kong
        { location: [34.0522, -118.2437], size: 0.1 }, // Los Angeles
        { location: [-23.5505, -46.6333], size: 0.1 }, // São Paulo
        { location: [35.6762, 139.6503], size: 0.1 }, // Tokyo
        { location: [52.52, 13.405], size: 0.1 }, // Berlin
        { location: [-33.8688, 151.2093], size: 0.1 }, // Sydney
        { location: [37.7749, -122.4194], size: 0.1 }, // San Francisco
        { location: [25.2048, 55.2708], size: 0.1 }, // Dubai
      ],
      onRender: (state: { phi: number }) => {
        // Rotate the globe (faster rotation)
        phiRef.current += 0.015;
        state.phi = phiRef.current;
      },
    });

    globeRef.current = globe;

    // Cleanup
    return () => {
      if (globeRef.current) {
        globeRef.current.destroy();
        globeRef.current = null;
      }
    };
  }, [size]);

  return (
    <div className="globe-wrapper" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} className="globe-canvas" />
    </div>
  );
}

