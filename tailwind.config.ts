import type { Config } from "tailwindcss";
// @ts-expect-error - daisyui doesn't have type definitions
import daisyui from "daisyui";

interface ExtendedConfig extends Config {
  daisyui?: {
    themes?: string[];
  };
}

const config: ExtendedConfig = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: ['corporate'],
  },
};

export default config;
