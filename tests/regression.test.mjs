import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const PORT = 3001;

function startDevServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn("npm", ["run", "dev", "--", "--port", String(PORT)], {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error("Dev server did not start in time"));
    }, 30000);

    let output = "";

    const onData = (data) => {
      output += data.toString();
      if (output.includes("Ready")) {
        clearTimeout(timeout);
        cleanup();
        resolve(proc);
      }
    };

    const cleanup = () => {
      proc.stdout.off("data", onData);
      proc.stderr.off("data", onData);
    };

    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("error", reject);
    proc.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Dev server exited with ${code}\n${output}`));
    });
  });
}

async function fetchHtml(path, cookie) {
  const headers = cookie ? { Cookie: cookie } : {};
  const response = await fetch(`http://localhost:${PORT}${path}`, { headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${path}`);
  }
  return response.text();
}

let server;

before(async () => {
  server = await startDevServer();
});

after(() => {
  server?.kill();
});

test("default dark theme and welcome animation markup are rendered", async () => {
  const html = await fetchHtml("/");

  assert.match(html, /<html[^>]*class=[^>]*\bdark\b/, "html should have dark class");
  assert.match(html, /welcome-letter/, "welcome animation letters should be present");
  assert.match(html, /welcome-cursor/, "welcome animation cursor should be present");
  assert.match(
    html,
    /aria-label="Switch to light mode"/,
    "toggle should indicate it switches to light mode"
  );
});

test("light theme cookie is respected", async () => {
  const html = await fetchHtml("/", "nexo-theme=light");

  assert.doesNotMatch(
    html,
    /<html[^>]*class=[^>]*\bdark\b/,
    "html should not have dark class when cookie is light"
  );
  assert.match(
    html,
    /aria-label="Switch to dark mode"/,
    "toggle should indicate it switches to dark mode"
  );
});

test("Google sign-in preview is rendered on the home page", async () => {
  const html = await fetchHtml("/");

  assert.match(html, /Continue with Google/, "sign-in button text should be present");
  assert.match(
    html,
    /Google sign-in is not yet connected/,
    "disclaimer should be present"
  );
  assert.match(
    html,
    /google-sign-in-status/,
    "status region should be present"
  );
});
