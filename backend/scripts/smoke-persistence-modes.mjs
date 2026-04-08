import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, "..");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runScenario = async ({ name, envOverrides, expectExitCode, expectOutput }) => {
  const env = { ...process.env, ...envOverrides };
  const child = spawn(process.execPath, ["--import", "tsx", "src/index.ts"], {
    cwd: backendDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    output += String(chunk);
  });

  let exitCode;
  let timedOut = false;

  const exited = new Promise((resolve) => {
    child.on("exit", (code) => {
      exitCode = code;
      resolve();
    });
  });

  if (expectExitCode === 0) {
    for (let i = 0; i < 30; i += 1) {
      if (output.includes("Backend running on")) {
        break;
      }
      if (exitCode !== undefined) {
        break;
      }
      await wait(250);
    }
    if (!output.includes("Backend running on") && exitCode === undefined) {
      timedOut = true;
      child.kill("SIGTERM");
      await exited;
    } else if (exitCode === undefined) {
      child.kill("SIGTERM");
      await exited;
      exitCode = 0;
    }
  } else {
    for (let i = 0; i < 50; i += 1) {
      if (exitCode !== undefined) break;
      await wait(200);
    }
    if (exitCode === undefined) {
      timedOut = true;
      child.kill("SIGTERM");
      await exited;
    }
  }

  assert(!timedOut, `${name}: scenario timed out`);
  assert(exitCode === expectExitCode, `${name}: expected exit ${expectExitCode}, got ${exitCode}. Output: ${output}`);

  if (expectOutput) {
    assert(output.includes(expectOutput), `${name}: expected output to include '${expectOutput}', got: ${output}`);
  }

  return { name, passed: true };
};

const run = async () => {
  const scenarios = [
    {
      name: "dev_without_database_url_allows_json_fallback",
      envOverrides: {
        NODE_ENV: "development",
        DATABASE_URL: "",
        PORT: "4011",
      },
      expectExitCode: 0,
      expectOutput: "Backend running on",
    },
    {
      name: "production_without_database_url_fails_fast",
      envOverrides: {
        NODE_ENV: "production",
        DATABASE_URL: "",
        PORT: "4012",
      },
      expectExitCode: 1,
      expectOutput: "DATABASE_URL is required when NODE_ENV is not development",
    },
    {
      name: "development_with_unreachable_database_url_fails_fast",
      envOverrides: {
        NODE_ENV: "development",
        DATABASE_URL: "postgresql://invalid:invalid@127.0.0.1:65432/notthere",
        PORT: "4013",
      },
      expectExitCode: 1,
      expectOutput: "Canonical persistence cannot fallback",
    },
  ];

  const results = [];
  for (const scenario of scenarios) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await runScenario(scenario));
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: Object.fromEntries(results.map((result) => [result.name, result.passed])),
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown persistence smoke failure",
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
