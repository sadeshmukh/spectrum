#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("Testing aggregate-populate script...\n");

const child = spawn("npx", ["tsx", "aggregate-populate.ts"], {
  stdio: "inherit",
  cwd: __dirname,
});

child.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ Aggregate populate test completed successfully!");
  } else {
    console.log(`\n❌ Aggregate populate test failed with code ${code}`);
    process.exit(1);
  }
});

child.on("error", (error) => {
  console.error("Failed to start aggregate populate test:", error);
  process.exit(1);
});
