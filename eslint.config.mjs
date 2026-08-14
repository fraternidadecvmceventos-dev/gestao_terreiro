import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Este projeto usa o padrão simples "buscar dados no useEffect" em
      // várias telas do painel (consulentes, pagamentos, doações,
      // despesas). É um padrão comum e adequado para o tamanho deste app;
      // a alternativa sugerida pela regra (bibliotecas de data-fetching,
      // Suspense, etc.) adicionaria complexidade desnecessária aqui.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
