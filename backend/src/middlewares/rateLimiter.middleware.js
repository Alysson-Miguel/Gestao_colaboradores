const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

/* ─────────────────────────────────────────────────────────
   STORE
   MemoryStore = fine for single instance.
   To swap to Redis: npm install rate-limit-redis ioredis
   then replace `store` below with:
     new RedisStore({ client: redisClient })
───────────────────────────────────────────────────────── */

const handler429 = (req, res) => {
  console.warn(`[RATE LIMIT] ${req.ip} | ${req.method} ${req.originalUrl} | user: ${req.user?.id ?? "anon"}`);
  res.status(429).json({
    success: false,
    message: "Limite de requisições excedido. Tente novamente em alguns segundos.",
    retryAfter: res.getHeader("Retry-After"),
  });
};

// Key: user ID when authenticated, fallback to IP (IPv6-safe)
const keyByIP   = (req) => ipKeyGenerator(req);
const keyByUser = (req) => req.user?.id ?? ipKeyGenerator(req);

/* ─── GLOBAL ────────────────────────────────────────────
   300 req / min por IP — protege flood antes de autenticar
─────────────────────────────────────────────────────── */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: keyByIP,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler429,
  skip: (req) => req.path === "/health",
});

/* ─── AUTH ───────────────────────────────────────────────
   10 tentativas / min por IP — brute force protection
─────────────────────────────────────────────────────── */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: keyByIP,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler429,
});

/* ─── DASHBOARD ─────────────────────────────────────────
   120 req / min por usuário — dashboards podem fazer
   múltiplas chamadas por load, mas 120 é 2/seg (suficiente)
─────────────────────────────────────────────────────── */
const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: keyByUser,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler429,
});

/* ─── REPORTS / EXPORTS ─────────────────────────────────
   20 req / min por usuário — queries pesadas (Excel, PDF,
   controle mensal, absenteismo histórico)
─────────────────────────────────────────────────────── */
const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: keyByUser,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler429,
});

/* ─── WRITES ─────────────────────────────────────────────
   60 req / min por usuário — POST/PUT/DELETE operacionais
─────────────────────────────────────────────────────── */
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: keyByUser,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler429,
  skip: (req) => req.method === "GET",
});

module.exports = {
  globalLimiter,
  authLimiter,
  dashboardLimiter,
  reportLimiter,
  writeLimiter,
};
