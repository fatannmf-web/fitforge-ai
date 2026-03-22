import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "20mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "20mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    // Log all API requests and all non-2xx/3xx responses
    if (path.startsWith("/api") || status >= 400) {
      let logLine = `${req.method} ${path} ${status} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// Health check registered IMMEDIATELY — before any async work or auth setup.
// This ensures Replit's startup health check always succeeds.
app.get("/api/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const port = parseInt(process.env.PORT || "5000", 10);

// Start listening IMMEDIATELY so health checks respond during startup.
// Auth and API routes are registered async below.
httpServer.listen(
  { port, host: "0.0.0.0", reusePort: true },
  () => { log(`serving on port ${port}`); },
);

(async () => {
  // In Replit artifact-mode, PORT=8080 but external traffic may also come
  // through port 5000. Bind both when running in production.
  if (process.env.NODE_ENV === "production" && port !== 5000) {
    const { createServer: makeServer } = await import("http");
    const extra = makeServer(app);
    extra.on("error", (e: NodeJS.ErrnoException) => {
      if (e.code === "EADDRINUSE") {
        log("port 5000 already in use, skipping extra listener");
      } else {
        console.error("[express] extra port error:", e.message);
      }
    });
    extra.listen({ port: 5000, host: "0.0.0.0" }, () => {
      log("also serving on port 5000 (external routing)");
    });
  }

  try {
    await registerRoutes(httpServer, app);
  } catch (err) {
    console.error("[startup] registerRoutes error:", err);
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }
})();
