import type { Config } from "tailwindcss";

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
  plugins: [require("daisyui")],
  daisyui: {
    themes: ['corporate'],
  },
};

export default config;
