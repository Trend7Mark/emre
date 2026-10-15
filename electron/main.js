// Masaüstü programı. Ağ portu açmaz: arayüz ve API, "app://" adlı özel bir
// protokol üzerinden doğrudan program içinde sunulur. Bu sayede kurum
// bilgisayarlarındaki proxy/güvenlik duvarı ayarlarından etkilenmez.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { app, BrowserWindow, Menu, net, protocol, safeStorage, shell } from "electron";

const kok = path.dirname(fileURLToPath(import.meta.url));
const ARAYUZ = path.join(kok, "..", "public");

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// Aynı anda yalnızca bir pencere: ikinci kez açılırsa mevcut pencere öne gelir.
if (!app.requestSingleInstanceLock()) app.quit();

let pencere;

async function baslat() {
  // Veriler: %APPDATA%\Basın Masası\veri
  process.env.DATA_DIR = path.join(app.getPath("userData"), "veri");
  const { apiOlustur } = await import("../server/api.js");
  const { anahtarDeposu } = await import("../server/anahtarlar.js");

  // Programla birlikte derlenen anahtar (electron/gomulu-anahtar.json); depoda yer almaz.
  let gomulu = {};
  try {
    gomulu = JSON.parse(fs.readFileSync(path.join(kok, "gomulu-anahtar.json"), "utf8"));
  } catch {
    // dosya yoksa kullanıcı anahtarını Ayarlar'dan girer
  }

  const sifreleme = safeStorage.isEncryptionAvailable()
    ? {
        sifrele: (s) => safeStorage.encryptString(s).toString("base64"),
        coz: (s) => safeStorage.decryptString(Buffer.from(s, "base64")),
      }
    : {};
  const api = apiOlustur(anahtarDeposu({ ...sifreleme, gomulu }));

  protocol.handle("app", async (istek) => {
    const url = new URL(istek.url);
    if (url.pathname.startsWith("/api/")) {
      const govde = ["POST", "PUT"].includes(istek.method) ? await istek.json().catch(() => ({})) : undefined;
      const { durum, govde: yanit } = await api.isle(istek.method, url.pathname, govde);
      return new Response(yanit === null ? null : JSON.stringify(yanit), {
        status: durum,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
    // Statik dosyalar; public klasörünün dışına çıkılamaz.
    const dosya = path.normalize(path.join(ARAYUZ, decodeURIComponent(url.pathname)));
    if (!dosya.startsWith(ARAYUZ)) return new Response("Yasak", { status: 403 });
    return net.fetch(pathToFileURL(dosya === ARAYUZ + path.sep ? path.join(ARAYUZ, "index.html") : dosya).toString());
  });

  Menu.setApplicationMenu(null);
  pencere = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "Basın Masası",
    backgroundColor: "#f4f5f7",
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  pencere.once("ready-to-show", () => pencere.show());
  // Dış bağlantılar (ör. API anahtarı alma sayfası) varsayılan tarayıcıda açılır.
  pencere.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  pencere.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("app://")) e.preventDefault();
  });
  await pencere.loadURL("app://basin/index.html");
}

app.on("second-instance", () => {
  if (pencere) {
    if (pencere.isMinimized()) pencere.restore();
    pencere.focus();
  }
});
app.whenReady().then(baslat);
app.on("window-all-closed", () => app.quit());
