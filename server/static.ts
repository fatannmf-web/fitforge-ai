import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "client");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // HTTPS redirect în producție
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] === "http" && process.env.NODE_ENV === "production") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });

  // Service Worker — servit cu header special (no-cache + scope corect)
  app.get("/sw.js", (_req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Service-Worker-Allowed", "/");
    res.sendFile(path.resolve(distPath, "sw.js"));
  });

  // Assets (JS/CSS/images) cu long-term caching
  app.use(express.static(distPath, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      } else if (filePath.endsWith(".svg") || filePath.endsWith(".png") || filePath.endsWith("manifest.json")) {
        // Icoane și manifest — cache scurt (1 zi)
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    }
  }));

  // Redirect bare /api hits
  app.get("/api", (_req, res) => {
    res.redirect(302, "/dashboard");
  });

  // 404 JSON pentru API paths nematch-ate
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ message: "API endpoint not found" });
    } else {
      next();
    }
  });

  // SPA fallback — toate rutele → index.html
  app.use("/{*path}", (_req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
