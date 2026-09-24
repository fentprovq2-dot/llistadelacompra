// Servidor mínim amb autenticació bàsica per al tauler de la retornada.
// No té dependències: només el Node que Render ja porta.
//
// Credencials: la variable AUTH_USERS conté la llista de persones amb accés,
// en format "usuari:contrasenya" separades per comes o per salts de línia.
//   AUTH_USERS="anna:2Gv8xR4pQm,marc:7Lk3wTzB9d,berta:Xq5nV2rHt8"
// Per retirar l'accés a algú, esborra la seva entrada i torna a desplegar.
// També s'accepta la parella única AUTH_USER / AUTH_PASS.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = process.env.PORT || 10000;
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

// Llista de credencials, indexades per usuari.
const COMPTES = new Map();
for (const parella of (process.env.AUTH_USERS || "").split(/[,\n]/)) {
  const net = parella.trim();
  if (!net) continue;
  const tall = net.indexOf(":");
  if (tall < 1) continue;
  COMPTES.set(net.slice(0, tall).trim(), net.slice(tall + 1));
}
if (process.env.AUTH_USER && process.env.AUTH_PASS) {
  COMPTES.set(process.env.AUTH_USER, process.env.AUTH_PASS);
}

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

// Retorna el nom de qui entra, o null si les credencials no són bones.
function qui(req) {
  const capçalera = req.headers.authorization || "";
  if (!capçalera.startsWith("Basic ")) return null;
  const desxifrat = Buffer.from(capçalera.slice(6), "base64").toString("utf8");
  const tall = desxifrat.indexOf(":");
  if (tall < 0) return null;
  const usuari = desxifrat.slice(0, tall);
  const clau = desxifrat.slice(tall + 1);
  const guardada = COMPTES.get(usuari);
  // Sempre es fa una comparació, hi hagi usuari o no, per no delatar quins existeixen.
  const bona = igual(clau, guardada === undefined ? crypto.randomUUID() : guardada);
  return guardada !== undefined && bona ? usuari : null;
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

  if (!COMPTES.size) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Falta la variable AUTH_USERS.");
  }

  const usuari = qui(req);
  if (!usuari) {
    console.log("acces denegat", req.method, req.url);
    return demanaClau(res);
  }

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
    if (ruta === "/index.html") console.log("entrada de", usuari);
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

servidor.listen(PORT, () =>
  console.log("El tauler escolta al port " + PORT + " amb " + COMPTES.size + " comptes"),
);
