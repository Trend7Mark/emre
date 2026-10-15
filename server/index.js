// Web/sunucu kipi: uygulamayı tarayıcıdan kullanmak için (ileride kurum sunucusu).
// Masaüstü programı bu dosyayı kullanmaz; bkz. electron/main.js
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { apiOlustur } from "./api.js";
import { anahtarDeposu } from "./anahtarlar.js";

const api = apiOlustur(anahtarDeposu());
const app = express();
const kok = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(kok, "..", "public")));

app.all("/api/*", async (req, res) => {
  const { durum, govde } = await api.isle(req.method, req.path, req.body);
  if (govde === null) return res.status(durum).end();
  res.status(durum).json(govde);
});

const PORT = Number(process.env.PORT) || 3000;
const ADRES = `http://127.0.0.1:${PORT}`;
// Yalnızca bu bilgisayardan erişilebilir.
const sunucu = app.listen(PORT, "127.0.0.1", () => {
  console.log(`\nBasın Masası (web kipi) çalışıyor: ${ADRES}  (yapay zekâ: ${api.aktifSaglayici().ad})\n`);
});
sunucu.on("error", (err) => {
  console.error(err.code === "EADDRINUSE" ? `\nHATA: ${PORT} numaralı port kullanımda.\n` : `\nSunucu başlatılamadı: ${err.message}\n`);
  process.exit(1);
});
