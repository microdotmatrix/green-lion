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
      CONTACT_EMAIL: envField.string({ context: "server", access: "public" }),
      RESEND_API_KEY: envField.string({ context: "server", access: "secret" }),
    }
  }
});