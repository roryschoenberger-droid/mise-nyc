import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the build's file-tracing root to this repo so Next never guesses it from
  // a stray lockfile elsewhere on the machine.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Allow the ngrok tunnel origin to load Next.js dev assets.
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok.app"],
};

export default nextConfig;
