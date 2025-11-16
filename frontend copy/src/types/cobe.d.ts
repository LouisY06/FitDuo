declare module "cobe" {
  export type GlobeInstance = { destroy: () => void };

  const createGlobe: (canvas: HTMLCanvasElement, options: any) => GlobeInstance;

  export default createGlobe;
}

