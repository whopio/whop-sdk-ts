import { defineConfig } from "orval";

export default defineConfig({
  whop: {
    output: {
      mode: "split",
      target: "src/index.ts",
      schemas: "src/model",
      client: "svelte-query",
    },
    input: {
      target: "../spec/openapi.json",
    },
  },
});
