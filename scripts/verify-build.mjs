import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(projectRoot, "dist");
const sourceFiles = ["index.html", "styles.css", "app.js", "engine.js"];

const referencedAssets = new Set();
const assetPattern = /(?:assets|backgrounds|icons|sfx)\/[A-Za-z0-9_./@+() -]+\.(?:png|webp|jpg|jpeg|gif|svg|mp3|m4a|wav)/gi;

for (const sourceFile of sourceFiles) {
  const source = await readFile(join(projectRoot, sourceFile), "utf8");
  for (const match of source.matchAll(assetPattern)) {
    referencedAssets.add(match[0]);
  }
}

const missingAssets = [];
for (const relativePath of referencedAssets) {
  try {
    await access(join(outputDir, relativePath));
  } catch {
    missingAssets.push(relativePath);
  }
}

if (missingAssets.length > 0) {
  console.error("Im App-Build fehlen referenzierte Dateien:");
  missingAssets.sort().forEach(path => console.error(`- ${path}`));
  process.exitCode = 1;
} else {
  console.log(`Build-Prüfung erfolgreich: ${referencedAssets.size} lokale Medien gefunden.`);
}
