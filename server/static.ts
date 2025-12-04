import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Use multiple fallback paths for robustness in different environments
  const possiblePaths = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    "/home/runner/workspace/dist/public"
  ];
  
  let distPath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      distPath = p;
      console.log(`[static] Found build directory at: ${p}`);
      break;
    }
  }
  
  if (!distPath) {
    console.error(`[static] Could not find build directory. Tried: ${possiblePaths.join(", ")}`);
    throw new Error(
      `Could not find the build directory, make sure to build the client first`,
    );
  }

  // Serve static files with proper caching headers
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    index: false
  }));

  // SPA fallback - serve index.html for all non-file routes
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath!, "index.html"));
  });
}
