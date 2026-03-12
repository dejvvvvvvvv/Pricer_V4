/**
 * slicerHealthService.js — Service layer for PrusaSlicer health checks.
 *
 * Pure service — NO Express dependency (no req/res/next).
 * Verifies PrusaSlicer installation, returns version info.
 *
 * @module services/slicerHealthService
 */

import { spawn } from "node:child_process";
import { parseSlicerVersion } from "../util/health.js";

/**
 * Run a simple command and capture output with a timeout.
 *
 * @param {string} cmd - Command to execute
 * @param {string[]} args - Command arguments
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<{ exitCode: number, stdout: string, stderr: string }>}
 */
function runSimple(cmd, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true, shell: false });
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
      reject(new Error(`Command timed out after ${timeoutMs}ms`));
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

/**
 * Check PrusaSlicer health — verifies the binary is installed and accessible,
 * returns version info and availability status.
 *
 * @param {Object} opts
 * @param {() => Promise<string>} opts.resolveSlicerCmd - Resolves path to PrusaSlicer binary
 * @param {(path: string) => Promise<boolean>} opts.fileExists - Checks if file exists
 * @returns {Promise<{ available: boolean, version: string|null, exitCode: number|null, error: string|null }>}
 */
export async function checkSlicerHealth({ resolveSlicerCmd, fileExists }) {
  const slicerCmd = await resolveSlicerCmd();

  if (!slicerCmd) {
    return {
      available: false,
      version: null,
      exitCode: null,
      error: "PrusaSlicer binary not configured. Set PRUSA_SLICER_CMD or place portable in tools/prusaslicer.",
    };
  }

  if (!(await fileExists(slicerCmd))) {
    return {
      available: false,
      version: null,
      exitCode: null,
      error: "PrusaSlicer binary not found at configured path.",
    };
  }

  try {
    const result = await runSimple(slicerCmd, ["--help"], 15000);
    const version = parseSlicerVersion(result.stdout) || parseSlicerVersion(result.stderr) || null;

    return {
      available: result.exitCode === 0,
      version,
      exitCode: result.exitCode,
      error: result.exitCode !== 0 ? `PrusaSlicer --help exited with code ${result.exitCode}` : null,
    };
  } catch (err) {
    return {
      available: false,
      version: null,
      exitCode: null,
      error: String(err?.message || err),
    };
  }
}
