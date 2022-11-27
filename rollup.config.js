import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import { generateDtsBundle } from "rollup-plugin-dts-bundle-generator";
import pkg from "./package.json" assert { type: "json" };

const defaultConfig = {
  external: [...Object.keys(pkg.dependencies), "./utils", "@redis/client"],
  treeshake: {
    moduleSideEffects: "no-external",
  },
  plugins: [typescript({ sourceMap: false }), commonjs(), nodeResolve()],
};
const moduleConfig = (name) => ({
  input: `src/${name}.ts`,
  output: [
    { file: `dist/${name}.mjs`, format: "es", plugins: [generateDtsBundle()] },
    { file: `dist/${name}.cjs`, format: "cjs" },
  ],
});

export default [
  {
    ...defaultConfig,
    ...moduleConfig("index"),
  },
  {
    ...defaultConfig,
    ...moduleConfig("node"),
  },
  {
    ...defaultConfig,
    ...moduleConfig("redis"),
  },
  {
    ...defaultConfig,
    ...moduleConfig("utils"),
  },
];