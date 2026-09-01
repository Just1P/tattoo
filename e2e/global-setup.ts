import { execSync } from "node:child_process";

export default async function globalSetup() {
  execSync("npx tsx e2e/seed-test-artist.ts", { stdio: "inherit" });
}
