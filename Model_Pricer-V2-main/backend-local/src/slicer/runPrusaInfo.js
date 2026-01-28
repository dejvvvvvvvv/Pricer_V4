import { spawn } from "node:child_process";

/**
 * Runs PrusaSlicer in "--info" mode to extract model bounding box / volume.
 * Example:
 *   prusa-slicer-console.exe --info model.stl
 */
export async function runPrusaInfo({ slicerCmd, modelPath, timeoutMs = 20000 }) {
  const args = ["--info", modelPath];
  return await spawnWithTimeout(slicerCmd, args, { windowsHide: true }, timeoutMs);
}

function spawnWithTimeout(cmd, args, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { ...options, shell: false });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d) => (stdout += String(d)));
    child.stderr?.on("data", (d) => (stderr += String(d)));

    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        // ignore
      }
      reject(new Error(`PrusaSlicer --info timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });
  });
}
