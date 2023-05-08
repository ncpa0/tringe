import { build } from "@ncpa0cpl/nodepack";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const p = (p) => path.resolve(__dirname, "..", p);

async function main() {
  try {
    await build({
      srcDir: p("src"),
      outDir: p("dist"),
      target: "ESNext",
      formats: ["cjs", "esm", "legacy"],
      declarations: true,
      tsConfig: p("tsconfig.json"),
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
