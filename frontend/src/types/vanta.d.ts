// src/types/vanta.d.ts

declare module "vanta/dist/vanta.halo.min" {
  const HALO: (options: any) => { destroy: () => void };
  export default HALO;
}

declare module "vanta/dist/vanta.rings.min.js" {
  const RINGS: (options: any) => { destroy: () => void };
  export default RINGS;
}


