// @ts-check
import { defineConfig, envField } from "astro/config";

import tailwind from "@astrojs/tailwind";

import netlify from "@astrojs/netlify";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind({
    applyBaseStyles: false,
  }), react()],
  adapter: netlify(),
  output: "server",
  env: {
    schema: {
      ZAPIER_WEBHOOK_URL: envField.string({ context: "server", access: "public" }),
      PUBLIC_ZAPIER_WEBHOOK_URL: envField.string({ context: "client", access: "public" }),
    }
  }
});