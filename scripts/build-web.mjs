import { cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(projectRoot, "dist");

const runtimeFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "engine.js",
  "manifest.json",
  "aq_schriftzugtitle.png"
];

const runtimeDirectories = ["assets", "backgrounds", "icons", "sfx"];

async function assertExists(relativePath) {
  try {
    await stat(join(projectRoot, relativePath));
  } catch {
    throw new Error(`Benötigte Laufzeitdatei fehlt: ${relativePath}`);
  }
}

await Promise.all([...runtimeFiles, ...runtimeDirectories].map(assertExists));

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const relativePath of runtimeFiles) {
  await cp(join(projectRoot, relativePath), join(outputDir, relativePath));
}

for (const relativePath of runtimeDirectories) {
  await cp(join(projectRoot, relativePath), join(outputDir, relativePath), {
    recursive: true
  });
}

console.log(`ADHD Quest Web-Build erstellt: ${outputDir}`);
