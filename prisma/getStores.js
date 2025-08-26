import fs from "fs";

async function main() {
// Récupère le chemin du fichier en argument
const filePath = "C:/Users/antoi/Downloads/export.geojson"

if (!filePath) {
  console.error("Usage: node listSupermarkets.js <chemin_vers_geojson>");
  process.exit(1);
}

// Lire le fichier
let rawData;
try {
  rawData = fs.readFileSync(filePath, "utf-8");
} catch (err) {
  console.error("Erreur lors de la lecture du fichier :", err.message);
  process.exit(1);
}

// Parser le JSON
let geojson;
try {
  geojson = JSON.parse(rawData);
} catch (err) {
  console.error("Erreur lors du parsing JSON :", err.message);
  process.exit(1);
}

// Filtrer uniquement les supermarkets
const supermarkets = geojson.features;

// Dictionnaire des shops par brand
const shopsByBrand = {};

// Afficher chaque supermarché
supermarkets.forEach(f => {
  const name = f.properties.name || "Nom inconnu";
  const brand = f.properties.brand || "SansMarque";
  const cityName = f.properties.addrcity;
  const postcode = f.properties.postcode;
  const street = f.properties.street;
  const housenumber = f.properties.housenumber;
  let address = null;
  if (street && housenumber && postcode && cityName) {
    address = `${housenumber} ${street}, ${postcode} ${cityName}`.trim();
  }
  let city = null
  if (cityName)
   city = cityName.trim();

  const lon = f.geometry.coordinates[0];
  const lat = f.geometry.coordinates[1];

  const shop = { name, city, address, lat, lon };

  if (!shopsByBrand[brand]) {
    shopsByBrand[brand] = [];
  }
  shopsByBrand[brand].push(shop);
});

  // Générer un fichier par brand
  Object.entries(shopsByBrand).forEach(([brand, shops]) => {
    const safeBrand = brand.replace(/[^\w\d_-]/g, "_");
    fs.writeFileSync(`stores_${safeBrand}.json`, JSON.stringify(shops, null, 2), "utf-8");
    console.log(`Fichier généré : stores_${safeBrand}.json (${shops.length} magasins)`);
  });

  console.log(`\nTotal de brands trouvés : ${Object.keys(shopsByBrand).length}`);
}

main()
  .catch(console.error)