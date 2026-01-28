import { spawn } from "node:child_process";
import path from "node:path";

export async function runPrusaSlicer({ slicerCmd, modelPath, iniPath, outDir, timeoutMs = 300000 }) {
  const outGcodePath = path.join(outDir, "out.gcode");

  // NOTE: Some PrusaSlicer builds accept both:
  //   prusa-slicer-console.exe --export-gcode -o out.gcode input.stl --load profile.ini
  const args = [
    "--export-gcode",
    "-o",
    outGcodePath,
    modelPath,
    "--load",
    iniPath
  ];

  const start = Date.now();
  const result = await spawnWithTimeout(slicerCmd, args, { cwd: outDir, windowsHide: true }, timeoutMs);
  return {
    ...result,
    outGcodePath,
    durationMs: Date.now() - start
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
      reject(new Error(`PrusaSlicer timed out after ${timeoutMs}ms`));
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
