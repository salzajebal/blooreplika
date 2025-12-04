import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  console.log(`[static] Starting static file serving setup...`);
  console.log(`[static] Current working directory: ${process.cwd()}`);
  
  // Use multiple fallback paths for robustness in different environments
  const possiblePaths = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    "/home/runner/workspace/dist/public",
    path.join(process.cwd(), "dist", "public")
  ];
  
  console.log(`[static] Checking paths: ${JSON.stringify(possiblePaths)}`);
  
  let distPath: string | null = null;
  for (const p of possiblePaths) {
    const exists = fs.existsSync(p);
    console.log(`[static] Path ${p}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    if (exists && !distPath) {
      distPath = p;
      
      // Verify contents
      try {
        const files = fs.readdirSync(p);
        console.log(`[static] Found ${files.length} items in ${p}: ${files.slice(0, 5).join(', ')}...`);
        
        // Check for assets folder
        const assetsPath = path.join(p, 'assets');
        if (fs.existsSync(assetsPath)) {
          const assetFiles = fs.readdirSync(assetsPath);
          console.log(`[static] Assets folder has ${assetFiles.length} files`);
        }
      } catch (e) {
        console.error(`[static] Error reading directory: ${e}`);
      }
    }
  }
  
  if (!distPath) {
    console.error(`[static] CRITICAL: Could not find build directory!`);
    console.error(`[static] Listing current directory contents:`);
    try {
      const cwdContents = fs.readdirSync(process.cwd());
      console.error(`[static] CWD contents: ${cwdContents.join(', ')}`);
      
      const distExists = fs.existsSync(path.join(process.cwd(), 'dist'));
      if (distExists) {
        const distContents = fs.readdirSync(path.join(process.cwd(), 'dist'));
        console.error(`[static] dist/ contents: ${distContents.join(', ')}`);
      }
    } catch (e) {
      console.error(`[static] Error listing directories: ${e}`);
    }
    
    throw new Error(
      `Could not find the build directory, make sure to build the client first`,
    );
  }

  console.log(`[static] Using build directory: ${distPath}`);

  // Serve static files with proper caching headers
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    index: false,
    fallthrough: true
  }));

  // Debug middleware to log static file requests
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      const filePath = path.join(distPath!, req.path);
      const exists = fs.existsSync(filePath);
      if (!exists && req.path !== '/' && !req.path.includes('.')) {
        // SPA route, will be handled by fallback
      } else if (!exists) {
        console.log(`[static] 404: ${req.path} (looked for: ${filePath})`);
      }
    }
    next();
  });

  // SPA fallback - serve index.html for all non-file routes
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath!, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`[static] index.html not found at: ${indexPath}`);
      res.status(500).send('index.html not found');
    }
  });
  
  console.log(`[static] Static file serving configured successfully`);
}
