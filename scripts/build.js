import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("dist", { recursive: true });
writeFileSync("dist/package-check.txt", "agent-eval-pack-skill build artifact\n");
console.log("wrote dist/package-check.txt");
