import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

/* Util: parse query flavors (flavor=single OR flavors=csv) */
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

/* Helper: calc grid size selon zoom envoyé par le front (optionnel) */
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

/* Route clusters (intersection stricte de toutes les saveurs demandées) */
app.get("/clusters", async (req, res) => {
  try {
    console.log("Received /clusters with query:", req.query);
    const { swLat, swLon, neLat, neLon, cellSize, zoom } = req.query;
    if (!swLat || !swLon || !neLat || !neLon)
      return res.status(400).json({ error: "swLat, swLon, neLat, neLon requis" });

    const flavorList = parseFlavorQuery(req); // [] si pas de filtre
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
      // Intersection: le magasin doit posséder TOUTES les saveurs demandées (available=1)
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
    res.status(500).json({ error: "Erreur clustering" });
  }
});

/* Stores dans bounds (points individuels) - intersection stricte */
app.get("/stores/in-bounds", async (req, res) => {
  try {
    const { swLat, swLon, neLat, neLon } = req.query;
    if (!swLat || !swLon || !neLat || !neLon)
      return res.status(400).json({ error: "swLat, swLon, neLat, neLon requis" });

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

// =====================
// Création store / flavor / storeFlavor (ajout du préfixe /api pour cohérence)
// =====================

app.post("/stores", async (req, res) => {
  const { name, address, lat, lon } = req.body;
  try {
    const store = await prisma.store.create({
      data: { name, address, lat, lon }
    });
    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création store" });
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
    res.status(500).json({ error: "Erreur création flavor" });
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
    res.status(500).json({ error: "Erreur ajout flavor au store" });
  }
});

// =====================
// Infos magasin
// =====================

// Alias REST plus cohérent /stores/:id (garde l'ancien pour compat)
app.get("/stores/:id", async (req, res) => {
  return handleGetStore(req, res);
});
app.get("/store/:id", async (req, res) => {
  return handleGetStore(req, res);
});

async function handleGetStore(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id invalide" });
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
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// =====================
// Lancement serveur
// =====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});

// GET /flavors (manquait => 404)
app.get("/flavors", async (req, res) => {
  try {
    const flavors = await prisma.flavor.findMany();
    res.json(flavors);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur flavors" });
  }
});

// GET /stores (liste simple) - intersection stricte
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
    res.status(500).json({ error: "Erreur stores" });
  }
});

/**
 * PATCH /stores/:storeId/flavors/:flavorName
 * Body: { availability: 0|1|2 }
 * Règle du front: 0/2 -> 1, 1 -> 2 (le front calcule déjà le prochain état)
 *
 * Retourne l'objet StoreFlavor (avec la Flavor incluse) après mise à jour.
 */
app.patch("/stores/:storeId/flavors/:flavorName", async (req, res) => {
  try {
    console.log("Received PATCH /stores/:storeId/flavors/:flavorName", req.params, req.body);
    const storeId = parseInt(req.params.storeId);
    const flavorName = String(req.params.flavorName);
    const { availability } = req.body ?? {};
    console.log(`PATCH storeId=${storeId} flavor=${flavorName} availability=${availability}`);
    if (Number.isNaN(storeId)) {
      return res.status(400).json({ error: "storeId invalide" });
    }
    if (!flavorName) {
      return res.status(400).json({ error: "flavorName requis" });
    }
    if (![0, 1, 2].includes(availability)) {
      return res.status(400).json({ error: "availability doit être 0, 1 ou 2" });
    }

    // Vérif existence store (évite création orpheline)
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return res.status(404).json({ error: "Store introuvable" });
    }

    // Vérif existence flavor (optionnel mais utile)
    const flavor = await prisma.flavor.findUnique({ where: { name: flavorName } });
    if (!flavor) {
      return res.status(404).json({ error: "Flavor introuvable" });
    }

    // Upsert sur la relation storeFlavor
    // Adapte 'storeId_flavorName' si ton schema diffère (composite unique attendu)
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
    console.log("Updated storeFlavor:", storeFlavor);
    res.json(storeFlavor);
  } catch (e) {
    // Si le champ composite diffère, fallback update/create manuel
    if (e.code === "P2025") {
      return res.status(404).json({ error: "StoreFlavor introuvable" });
    }
    console.error("PATCH /stores/:storeId/flavors/:flavorName error", e);
    res.status(500).json({ error: "Erreur mise à jour disponibilité" });
  }
});

/**
 * POST /updates
 * Body: { storeId:number, flavorName:string, availability:0|1|2, sessionId?:string }
 * Stocke un log de mise à jour (ne modifie pas l'état, c'est déjà fait ailleurs).
 */
app.post("/updates", async (req, res) => {
  try {
    const { storeId, flavorName, availability, sessionId } = req.body || {};

    if (storeId == null || Number.isNaN(Number(storeId))) {
      return res.status(400).json({ error: "storeId invalide" });
    }
    if (!flavorName || typeof flavorName !== "string") {
      return res.status(400).json({ error: "flavorName requis" });
    }
    if (![0,1,2].includes(availability)) {
      return res.status(400).json({ error: "availability doit être 0,1 ou 2" });
    }

    const store = await prisma.store.findUnique({ where: { id: Number(storeId) } });
    if (!store) return res.status(404).json({ error: "Store introuvable" });

    const flavor = await prisma.flavor.findUnique({ where: { name: flavorName } });
    if (!flavor) return res.status(404).json({ error: "Flavor introuvable" });

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
    res.status(500).json({ error: "Erreur création log" });
  }
});
