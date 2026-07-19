import type { MetadataRoute } from "next";

/**
 * PWA manifest for NextAct. Served at /manifest.webmanifest by the App Router.
 * Colors come only from Brand Color 4.
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
    theme_color: "#10192B",
    background_color: "#FAF9F7",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
