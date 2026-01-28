import fs from "node:fs/promises";
import path from "node:path";
import { fileExists } from "./fsSafe.js";

// Try to find prusa-slicer-console.exe under <projectRoot>/tools/prusaslicer/**
export async function findPrusaSlicerConsole(projectRoot) {
  const base = path.join(projectRoot, "tools", "prusaslicer");
  if (!(await fileExists(base))) return "";

  // BFS with depth limit to avoid scanning huge trees
  const maxDepth = 6;
  const queue = [{ dir: base, depth: 0 }];

  while (queue.length) {
    const { dir, depth } = queue.shift();
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isFile() && ent.name.toLowerCase() === "prusa-slicer-console.exe") {
        return full;
      }
      if (ent.isDirectory() && depth < maxDepth) {
        queue.push({ dir: full, depth: depth + 1 });
      }
    }
  }

  return "";
}
