// Servidor mínim amb autenticació bàsica per al tauler de la retornada.
// No té dependències: només el Node que Render ja porta.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = process.env.PORT || 10000;
const USUARI = process.env.AUTH_USER || "";
const CONTRASENYA = process.env.AUTH_PASS || "";
const ARREL = path.join(__dirname, "public");

const TIPUS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// Comparació en temps constant: no revela la contrasenya pel temps de resposta.
function igual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) {
    crypto.timingSafeEqual(x, x);
    return false;
  }
  return crypto.timingSafeEqual(x, y);
}

function autoritzat(req) {
  const capçalera = req.headers.authorization || "";
  if (!capçalera.startsWith("Basic ")) return false;
  const [usuari, ...resta] = Buffer.from(capçalera.slice(6), "base64").toString("utf8").split(":");
  const clau = resta.join(":");
  return igual(usuari, USUARI) && igual(clau, CONTRASENYA);
}

function demanaClau(res) {
  res.writeHead(401, {
    "WWW-Authenticate": 'Basic realm="La retornada", charset="UTF-8"',
    "Content-Type": "text/plain; charset=utf-8",
  });
  res.end("Cal identificar-se.");
}

const servidor = http.createServer((req, res) => {
  // Render consulta aquesta ruta per saber si el servei és viu.
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("ok");
  }

  if (!USUARI || !CONTRASENYA) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Falten les variables AUTH_USER i AUTH_PASS.");
  }
  if (!autoritzat(req)) return demanaClau(res);

  let ruta = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (ruta === "/") ruta = "/index.html";

  const fitxer = path.join(ARREL, path.normalize(ruta));
  if (!fitxer.startsWith(ARREL)) {
    res.writeHead(403);
    return res.end();
  }

  fs.readFile(fitxer, (err, dades) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("No s'ha trobat la pàgina.");
    }
    res.writeHead(200, {
      "Content-Type": TIPUS[path.extname(fitxer).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });
    res.end(dades);
  });
});

servidor.listen(PORT, () => console.log("El tauler escolta al port " + PORT));
