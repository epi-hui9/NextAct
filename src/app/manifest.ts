import type { MetadataRoute } from "next";

/**
 * Installable PWA manifest for NextAct.
 * Launch surface uses Brand Color 3 ivory so iPhone never flashes black.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NextAct",
    short_name: "NextAct",
    description:
      "A private space to turn a lifetime of judgment into a living legacy.",
    display: "standalone",
    start_url: "/",
    scope: "/",
    orientation: "portrait",
    theme_color: "#0B1F3A",
    background_color: "#FAFAF8",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
