import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ---------- Security headers ----------
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// ---------- CORS ----------
const defaultOrigins = [
  "https://okschool-s.onrender.com",
  "https://okschool.in",
  "https://www.okschool.in",
  "capacitor://localhost",
  "https://localhost",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length ? configuredOrigins : defaultOrigins;

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin / server-to-server
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("CORS: origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ---------- Request logging ----------
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ---------- Simple in-memory rate limiter (no extra dependency) ----------
const buckets = new Map<string, { count: number; reset: number }>();
function rateLimit(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now > b.reset) {
      b = { count: 0, reset: now + windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > limit) {
      res.status(429).json({ error: "Too many requests, please slow down" });
      return;
    }
    next();
  };
}
// general: 120 req/min per ip+path ; auth-sensitive paths get stricter limits
app.use(rateLimit(120, 60_000));

// ---------- Body parsing ----------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

// ---------- Global error handler ----------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "unhandled error");
  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({ error: err?.message || "Internal server error" });
});

export default app;
