import fs from "fs";
import path from "path";
import { Transform } from "stream";

import streamChain from "stream-chain";
import streamJson from "stream-json";
import pickModule from "stream-json/filters/Pick.js";
import streamArrayModule from "stream-json/streamers/StreamArray.js";

const { chain } = streamChain;
const { parser } = streamJson;
const { pick } = pickModule;
const { streamArray } = streamArrayModule;

const filePath = "C:/Users/antoi/Downloads/export.geojson";

function rawBrand(raw) {
  const v = (raw && String(raw).trim()) || "";
  return v === "" ? null : v;
}
function brandKeyOf(raw) {
  const b = rawBrand(raw);
  return (b || "SansMarque").toLowerCase();
}
function sanitizeForFile(name) {
  return name.replace(/[^\w\d_-]/g, "_");
}

// Filtre: ne laisse passer que shop=supermarket
function supermarketFilter() {
  return new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      if (chunk?.value?.properties?.shop === "supermarket") {
        this.push(chunk);
      }
      cb();
    }
  });
}

async function firstPass() {
  return new Promise((resolve, reject) => {
    // Map brandKey -> { label: "Première forme rencontrée", count }
    const brandMap = new Map();
    let totalShops = 0;
    let totalFeatures = 0;
    let withProps = 0;

    const pipeline = chain([
      fs.createReadStream(filePath, { encoding: "utf-8" }),
      parser(),
      pick({ filter: "features" }),
      streamArray()
    ]);

    pipeline.on("data", ({ value }) => {
      totalFeatures++;
      const props = value?.properties;
      if (props) withProps++;

      if (props?.shop === "supermarket") {
        totalShops++;
        const key = brandKeyOf(props.brand);
        if (!brandMap.has(key)) {
          // label canonique : première graphie rencontrée ou clé capitalisée simple
            const label = rawBrand(props.brand) || "SansMarque";
          brandMap.set(key, { label, count: 1 });
        } else {
          brandMap.get(key).count++;
        }
      }
    });

    pipeline.on("end", () => {
      console.log(`DEBUG features=${totalFeatures}, withProperties=${withProps}, supermarkets=${totalShops}, brands=${brandMap.size}`);
      resolve({ brandMap, totalShops });
    });
    pipeline.on("error", reject);
  });
}

async function writeBrandFile(brandKey, label) {
  return new Promise((resolve, reject) => {
    const safe = sanitizeForFile(brandKey);
    const outPath = path.join("stores", `stores_${safe}.json`);
    const out = fs.createWriteStream(outPath, { encoding: "utf-8" });
    let first = true;

    out.write("[");

    const pipeline = chain([
      fs.createReadStream(filePath, { encoding: "utf-8" }),
      parser(),
      pick({ filter: "features" }),
      streamArray(),
      supermarketFilter()
    ]);

    pipeline.on("data", ({ value }) => {
      const props = value.properties;
      const currentKey = brandKeyOf(props.brand);
      if (currentKey !== brandKey) return;

      const name = props.name || "Nom inconnu";

      // Adresses: gérer variantes addr:*
      const city = props.addrcity || props["addr:city"] || null;
      const postcode = props.postcode || props["addr:postcode"] || null;
      const street = props.street || props["addr:street"] || null;
      const housenumber = props.housenumber || props["addr:housenumber"] || null;

      let address = null;
      if (street || housenumber || postcode || city) {
        const part1 = [housenumber, street].filter(Boolean).join(" ").trim();
        const part2 = [postcode, city].filter(Boolean).join(" ").trim();
        address = [part1, part2].filter(Boolean).join(", ") || null;
      }

      const [lon, lat] = value.geometry?.coordinates || [null, null];
      const shopObj = { name, brand: label, city, address, lat, lon };

      if (!first) out.write(",\n"); else out.write("\n");
      first = false;
      out.write(JSON.stringify(shopObj));
    });

    pipeline.on("end", () => {
      out.end(first ? "]" : "\n]");
      console.log(`Fichier généré: ${outPath}`);
      resolve();
    });
    pipeline.on("error", err => {
      out.destroy();
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(filePath)) {
    console.error("Fichier introuvable:", filePath);
    process.exit(1);
  }
  fs.mkdirSync("stores", { recursive: true });

  console.log("Passage 1 (analyse)...");
  const { brandMap, totalShops } = await firstPass();
  console.log(`Total supermarkets: ${totalShops}`);
  for (const [k, v] of brandMap.entries()) {
    console.log(`  - ${v.label} (key=${k}) : ${v.count}`);
  }

  console.log("\nPassage 2 (écriture fichiers)...");
  for (const [k, v] of brandMap.entries()) {
    await writeBrandFile(k, v.label);
  }
  console.log("\nTerminé.");
}

main().catch(err => {
  console.error("Erreur:", err);
  process.exit(1);
});