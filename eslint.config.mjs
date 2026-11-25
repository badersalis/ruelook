import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Static export with pre-sized WebP derivatives; next/image optimisation is unavailable (D-011)
      "@next/next/no-img-element": "off",
    },
  },
  { ignores: ["out/**", ".next/**", "node_modules/**", "public/**", "docs/**", "next-env.d.ts", "playwright-report/**", "test-results/**"] },
];
export default config;
