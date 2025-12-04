import express, { type Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  if (!fs.existsSync(distPath)) {
    console.error(`[static] Build directory not found: ${distPath}`);
    throw new Error(`Build directory not found: ${distPath}`);
  }

  console.log(`[static] Serving static files from: ${distPath}`);

  // Serve static files with proper error handling
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    index: false,
    fallthrough: true,
    setHeaders: (res, filePath) => {
      // Set proper content types
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      }
    }
  }));

  // Also serve the images folder explicitly
  const imagesPath = path.join(distPath, 'images');
  if (fs.existsSync(imagesPath)) {
    app.use('/images', express.static(imagesPath, {
      maxAge: '7d',
      etag: true,
      lastModified: true,
      fallthrough: true
    }));
  }

  // Serve assets folder explicitly
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    app.use('/assets', express.static(assetsPath, {
      maxAge: '1d',
      etag: true,
      lastModified: true,
      fallthrough: true
    }));
  }

  // SPA fallback - serve index.html for all non-API, non-static routes
  app.use("*", (req: Request, res: Response, next: NextFunction) => {
    // Skip API routes
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/ws')) {
      return next();
    }

    const indexPath = path.join(distPath, "index.html");
    
    try {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(500).json({ error: 'Application not found' });
      }
    } catch (error) {
      console.error('[static] Error serving index.html:', error);
      res.status(500).json({ error: 'Failed to serve application' });
    }
  });

  console.log(`[static] Static file serving configured`);
}
