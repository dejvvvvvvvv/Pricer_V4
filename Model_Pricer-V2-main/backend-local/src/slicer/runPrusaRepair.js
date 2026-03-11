import { spawn } from "node:child_process";
import path from "node:path";

/**
 * Runs PrusaSlicer in "--repair" mode to fix mesh issues and export a repaired STL.
 *
 * Command:
 *   prusa-slicer-console.exe --repair --export-stl -o output.stl input.stl
 *
 * @param {Object} opts
 * @param {string} opts.slicerCmd   Path to PrusaSlicer executable
 * @param {string} opts.modelPath   Path to input 3D model file
 * @param {string} opts.outDir      Directory for the repaired output file
 * @param {number} [opts.timeoutMs=60000]  Timeout in milliseconds
 * @returns {Promise<{ exitCode: number, stdout: string, stderr: string, outStlPath: string, durationMs: number }>}
 */
export async function runPrusaRepair({ slicerCmd, modelPath, outDir, timeoutMs = 60000 }) {
  const outStlPath = path.join(outDir, "repaired.stl");

  const args = [
    "--repair",
    "--export-stl",
    "-o",
    outStlPath,
    modelPath,
  ];

  const start = Date.now();
  const result = await spawnWithTimeout(slicerCmd, args, { cwd: outDir, windowsHide: true }, timeoutMs);
  return {
    ...result,
    outStlPath,
    durationMs: Date.now() - start,
  };
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
      reject(new Error(`PrusaSlicer --repair timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code, stdout, stderr });
    });
  });
}
