import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

// Simple admin password (header x-admin-password or query ?password=)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me"; // set in backend/.env

function requireAdmin(req, res, next) {
  const provided = req.header("x-admin-password") || req.query.password;
  if (!provided || provided !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Parse flavor query params (flavor=single OR flavors=csv)
function parseFlavorQuery(req) {
  const { flavor, flavors } = req.query;
  let list = [];
  if (flavors) {
    list = String(flavors)
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  } else if (flavor) {
    list = [String(flavor).trim()];
  }
  return list;
}

// Derive clustering grid size from zoom (fallback heuristic)
function gridFromZoom(z) {
  if (z >= 16) return 0.0005;
  if (z >= 14) return 0.001;
  if (z >= 12) return 0.01;
  if (z >= 10) return 0.035;
  if (z >= 8)  return 0.12;
  if (z >= 6)  return 0.25;
  if (z >= 5)  return 0.5;
  if (z >= 4)  return 1;
  return 0.5;
}

// Log a basic connection (id + createdAt)
app.post("/connection", async (_req, res) => {
  try {
    const connection = await prisma.connection.create({ data: {} });
    res.json(connection);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création connection" });
  }
});

// Admin routes (protected)
// GET /admin/update-logs?limit=50 => latest update logs with store & flavor info
app.get("/admin/update-logs", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const logs = await prisma.updateLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        store: { select: { id: true, name: true, address: true } },
        flavor: { select: { name: true } }
      }
    });
    res.json(logs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur récupération update logs" });
  }
});

// GET /admin/connections?limit=100 => recent connections list
app.get("/admin/connections", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const connections = await prisma.connection.findMany({
      orderBy: { createdAt: "desc" },
      take: limit
    });
    // Ajoute un total global pour affichage rapide
    const total = await prisma.connection.count();
    res.json({ total, recent: connections });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur récupération connections" });
  }
});

// GET /admin/connections/stats?interval=5m|1h|1d -> time buckets { bucketStart, count }
// Windows: 5m -> 24h, 1h -> 7d, 1d -> 30d
app.get("/admin/connections/stats", requireAdmin, async (req, res) => {
  try {
    const interval = req.query.interval || '5m';
  let step;
  let windowStartExpr;
  let bucketSql; // kept for potential future refactor
  let seriesStep;
  let windowLength;

    if (interval === '1d') {
      step = '1 day';
      seriesStep = '1 day';
      windowLength = '30 days';
  windowStartExpr = "date_trunc('day', now() - interval '29 days')"; // 30 day window
    } else if (interval === '1h') {
      step = '1 hour';
      seriesStep = '1 hour';
      windowLength = '7 days';
      windowStartExpr = "date_trunc('hour', now() - interval '7 days')";
  } else { // default 5m
      step = '5 minutes';
      seriesStep = '5 minutes';
      windowLength = '24 hours';
      windowStartExpr = "date_trunc('minute', now() - interval '24 hours')";
    }

  // Safe, controlled query (constants above)
    const query = `
      WITH series AS (
        SELECT generate_series(
          ${windowStartExpr},
          date_trunc('minute', now()),
          interval '${seriesStep}'
        ) AS bucket_start
      )
      SELECT bucket_start, COUNT(c.*)::int AS count
      FROM series
      LEFT JOIN "Connection" c
        ON c."createdAt" >= series.bucket_start
       AND c."createdAt" < series.bucket_start + interval '${step}'
      GROUP BY bucket_start
      ORDER BY bucket_start ASC;
    `;

    const rows = await prisma.$queryRawUnsafe(query);
    res.json(rows.map(r => ({ bucketStart: r.bucket_start, count: Number(r.count) })));
  } catch (e) {
    console.error(e);
  res.status(500).json({ error: 'stats error' });
  }
});

// GET /clusters - spatial clustering (store must contain ALL requested flavors if filtered)
app.get("/clusters", async (req, res) => {
  try {
    const { swLat, swLon, neLat, neLon, cellSize, zoom } = req.query;
    if (!swLat || !swLon || !neLat || !neLon)
      return res.status(400).json({ error: "missing bounds params" });

  const flavorList = parseFlavorQuery(req); // [] if no filter
    const swLatNum = parseFloat(swLat);
    const swLonNum = parseFloat(swLon);
    const neLatNum = parseFloat(neLat);
    const neLonNum = parseFloat(neLon);
    const grid = cellSize ? parseFloat(cellSize) : gridFromZoom(Number(zoom) || 8);

    let rows;
    if (flavorList.length === 0) {
      rows = await prisma.$queryRaw`
        SELECT 
          ST_X(ST_Centroid(ST_Collect(location::geometry))) AS lon,
          ST_Y(ST_Centroid(ST_Collect(location::geometry))) AS lat,
          COUNT(*)::int AS count,
          ARRAY_AGG(id) AS store_ids
        FROM "Store"
        WHERE location && ST_MakeEnvelope(${swLonNum}, ${swLatNum}, ${neLonNum}, ${neLatNum}, 4326)
        GROUP BY ST_SnapToGrid(location::geometry, ${grid}, ${grid})
      `;
    } else {
  // Intersection filter: store must have ALL requested flavors (available=1)
      rows = await prisma.$queryRaw`
        SELECT 
          ST_X(ST_Centroid(ST_Collect(s.location::geometry))) AS lon,
          ST_Y(ST_Centroid(ST_Collect(s.location::geometry))) AS lat,
          COUNT(*)::int AS count,
          ARRAY_AGG(s.id) AS store_ids
        FROM "Store" s
        WHERE s.location && ST_MakeEnvelope(${swLonNum}, ${swLatNum}, ${neLonNum}, ${neLatNum}, 4326)
          AND (
            SELECT COUNT(DISTINCT sf."flavorName")
            FROM "StoreFlavor" sf
            WHERE sf."storeId" = s.id
              AND sf."available" = 1
              AND sf."flavorName" = ANY(${flavorList})
          ) = ${flavorList.length}
        GROUP BY ST_SnapToGrid(s.location::geometry, ${grid}, ${grid})
      `;
    }

    res.json(rows.map(r => ({
      lat: Number(r.lat),
      lon: Number(r.lon),
      count: Number(r.count),
      storeIds: r.store_ids.map(id => Number(id))
    })));
  } catch (e) {
    console.error(e);
  res.status(500).json({ error: "clustering error" });
  }
});

// GET stores in bounds (individual points) with intersection flavor filter
app.get("/stores/in-bounds", async (req, res) => {
  try {
    const { swLat, swLon, neLat, neLon } = req.query;
    if (!swLat || !swLon || !neLat || !neLon)
      return res.status(400).json({ error: "missing bounds params" });

    const flavorList = parseFlavorQuery(req);
    const whereBase = {
      lat: { gte: parseFloat(swLat), lte: parseFloat(neLat) },
      lon: { gte: parseFloat(swLon), lte: parseFloat(neLon) }
    };

    let where = whereBase;
    if (flavorList.length) {
      where = {
        ...whereBase,
        AND: flavorList.map(f => ({
          storeFlavors: {
            some: {
              flavorName: f,
              available: 1
            }
          }
        }))
      };
    }

    const stores = await prisma.store.findMany({
      where,
      include: {
        storeFlavors: { include: { flavor: true } }
      }
    });

    res.json(stores);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur in-bounds" });
  }
});

// Create store / flavor / storeFlavor

app.post("/stores", async (req, res) => {
  const { name, address, lat, lon } = req.body;
  try {
    const store = await prisma.store.create({
      data: { name, address, lat, lon }
    });
    res.json(store);
  } catch (err) {
    console.error(err);
  res.status(500).json({ error: "store create error" });
  }
});

app.post("/flavors", async (req, res) => {
  const { name, image } = req.body;
  try {
    const flavor = await prisma.flavor.create({
      data: { name, image }
    });
    res.json(flavor);
  } catch (err) {
    console.error(err);
  res.status(500).json({ error: "flavor create error" });
  }
});

app.post("/store/:storeId/add-flavor/:flavorName", async (req, res) => {
  const { storeId, flavorName } = req.params;
  try {
    const storeFlavor = await prisma.storeFlavor.create({
      data: {
        storeId: parseInt(storeId),
        flavorName
      }
    });
    res.json(storeFlavor);
  } catch (err) {
    console.error(err);
  res.status(500).json({ error: "add flavor error" });
  }
});

// Store info

// Alias legacy /store/:id maintained for compatibility
app.get("/stores/:id", async (req, res) => {
  return handleGetStore(req, res);
});
app.get("/store/:id", async (req, res) => {
  return handleGetStore(req, res);
});

async function handleGetStore(req, res) {
  try {
    const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "invalid id" });
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        storeFlavors: {
          include: { flavor: true }
        }
      }
    });
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  } catch (err) {
    console.error(err);
  res.status(500).json({ error: "server error" });
  }
}

// Server start

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// GET /flavors
app.get("/flavors", async (req, res) => {
  try {
    const flavors = await prisma.flavor.findMany();
    res.json(flavors);
  } catch (e) {
    console.error(e);
  res.status(500).json({ error: "flavors error" });
  }
});

// GET /stores with intersection flavor filter
app.get("/stores", async (req, res) => {
  try {
    const flavorList = parseFlavorQuery(req);
    let where = {};
    if (flavorList.length) {
      where = {
        AND: flavorList.map(f => ({
          storeFlavors: {
            some: {
              flavorName: f,
              available: 1
            }
          }
        }))
      };
    }
    const stores = await prisma.store.findMany({
      where,
      include: {
        storeFlavors: { include: { flavor: true } }
      }
    });
    res.json(stores);
  } catch (e) {
    console.error(e);
  res.status(500).json({ error: "stores error" });
  }
});

// PATCH /stores/:storeId/flavors/:flavorName
// Body: { availability: 0|1|2 }
// Returns updated StoreFlavor with Flavor relation
app.patch("/stores/:storeId/flavors/:flavorName", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const flavorName = String(req.params.flavorName);
    const { availability } = req.body ?? {};
    if (Number.isNaN(storeId)) {
  return res.status(400).json({ error: "invalid storeId" });
    }
    if (!flavorName) {
  return res.status(400).json({ error: "flavorName required" });
    }
    if (![0, 1, 2].includes(availability)) {
  return res.status(400).json({ error: "availability must be 0,1 or 2" });
    }

  // Ensure store exists (avoid orphan)
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
  return res.status(404).json({ error: "Store not found" });
    }

  // Ensure flavor exists
    const flavor = await prisma.flavor.findUnique({ where: { name: flavorName } });
    if (!flavor) {
  return res.status(404).json({ error: "Flavor not found" });
    }

  // Upsert on composite unique (storeId, flavorName)
    const storeFlavor = await prisma.storeFlavor.upsert({
      where: {
        storeId_flavorName: {
          storeId,
          flavorName
        }
      },
      update: { available: availability },
      create: {
        storeId,
        flavorName,
        available: availability
      },
      include: { flavor: true }
    });
    res.json(storeFlavor);
  } catch (e) {
  // Composite mismatch fallback
    if (e.code === "P2025") {
  return res.status(404).json({ error: "StoreFlavor not found" });
    }
    console.error("PATCH /stores/:storeId/flavors/:flavorName error", e);
  res.status(500).json({ error: "update error" });
  }
});

// POST /updates - write an availability update log
app.post("/updates", async (req, res) => {
  try {
    const { storeId, flavorName, availability, sessionId } = req.body || {};

    if (storeId == null || Number.isNaN(Number(storeId))) {
  return res.status(400).json({ error: "invalid storeId" });
    }
    if (!flavorName || typeof flavorName !== "string") {
  return res.status(400).json({ error: "flavorName required" });
    }
    if (![0,1,2].includes(availability)) {
  return res.status(400).json({ error: "availability must be 0,1 or 2" });
    }

    const store = await prisma.store.findUnique({ where: { id: Number(storeId) } });
  if (!store) return res.status(404).json({ error: "Store not found" });

    const flavor = await prisma.flavor.findUnique({ where: { name: flavorName } });
  if (!flavor) return res.status(404).json({ error: "Flavor not found" });

    const log = await prisma.updateLog.create({
      data: {
        storeId: Number(storeId),
        flavorName,
        availability,
        sessionId: sessionId || null
      }
    });

    res.status(201).json(log);
  } catch (e) {
    console.error("POST /updates error", e);
  res.status(500).json({ error: "log create error" });
  }
});
