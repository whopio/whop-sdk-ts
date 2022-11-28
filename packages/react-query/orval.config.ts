import { defineConfig } from "orval";

export default defineConfig({
  whop: {
    output: {
      mode: "split",
      target: "src/index.ts",
      schemas: "src/model",
      client: "react-query",
    },
    input: {
      target: "../spec/openapi.json",
    },
  },
});
