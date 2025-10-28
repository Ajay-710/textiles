// src/config/particles-config.ts -> OPTION 1: "FALLING THREADS"

import type { ISourceOptions } from "tsparticles-engine";

export const particlesConfig: ISourceOptions = {
  background: {
    color: { value: "transparent" },
  },
  fpsLimit: 60,
  particles: {
    // We use an array of colors from your "silk" gradient for variety
    color: {
      value: ["#f7797d", "#c471ed", "#e5a1ad"],
    },
    // Links are disabled as we only want individual threads
    links: {
      enable: false,
    },
    // The key change: particles are now shaped like lines
    shape: {
      type: "line",
    },
    // Make the lines very thin
    size: {
      value: { min: 1, max: 3 },
    },
    opacity: {
      value: { min: 0.1, max: 0.4 },
    },
    move: {
      // All threads move towards the bottom
      direction: "bottom",
      enable: true,
      outModes: {
        default: "out",
      },
      // Give each thread a slightly different speed for a natural feel
      speed: { min: 0.5, max: 1.5 },
      straight: true, // They fall in straight lines
    },
    number: {
      density: {
        enable: true,
        area: 800,
      },
      // More threads for a fuller look
      value: 80,
    },
  },
  detectRetina: true,
};