// Masaüstü programı. Ağ portu açmaz: arayüz ve API, "app://" adlı özel bir
// protokol üzerinden doğrudan program içinde sunulur. Bu sayede kurum
// bilgisayarlarındaki proxy/güvenlik duvarı ayarlarından etkilenmez.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { app, BrowserWindow, dialog, Menu, net, protocol, safeStorage, shell } from "electron";
import updater from "electron-updater";

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
  // Yapay zekâ istekleri Chromium ağ katmanından gider: Windows proxy ayarlarını ve
  // kurumun SSL denetim sertifikalarını (Windows sertifika deposu) kullanır. Node'un kendi
  // fetch'i bunları görmediği için kurum ağlarında bağlantı kurulamıyordu.
  const sistemFetch = (girdi, ayar) => net.fetch(girdi instanceof URL ? girdi.toString() : girdi, ayar);
  globalThis.fetch = sistemFetch; // Gemini kütüphanesi küresel fetch'i kullanır
  const api = apiOlustur(anahtarDeposu({ ...sifreleme, gomulu }), { fetch: sistemFetch });

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
    title: `Basın Masası ${app.getVersion()}`,
    backgroundColor: "#f4f5f7",
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  pencere.once("ready-to-show", () => pencere.show());
  // Pencere başlığında sürüm numarası kalsın (sayfa başlığı üzerine yazmasın).
  pencere.on("page-title-updated", (e) => e.preventDefault());
  // Dış bağlantılar (ör. API anahtarı alma sayfası) varsayılan tarayıcıda açılır.
  pencere.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  pencere.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("app://")) e.preventDefault();
  });
  await pencere.loadURL("app://basin/index.html");
  guncellemeleriDenetle();
}

// Otomatik güncelleme: açılışta GitHub'daki indirme sayfasına bakar, yeni sürümü arka planda
// indirir ve yeniden başlatmayı sorar. Yalnızca kurulum (Kurulum-….exe) sürümünde çalışır.
function guncellemeleriDenetle() {
  if (!app.isPackaged || process.env.PORTABLE_EXECUTABLE_DIR) return;
  const { autoUpdater } = updater;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("error", (err) => console.error("[güncelleme]", err?.message || err));
  autoUpdater.on("update-downloaded", async (bilgi) => {
    const { response } = await dialog.showMessageBox(pencere, {
      type: "info",
      title: "Güncelleme hazır",
      message: `Basın Masası'nın yeni sürümü (${bilgi.version}) indirildi.`,
      detail: "Şimdi yeniden başlatılsın mı? Daha sonra derseniz program kapatılınca güncellenir.",
      buttons: ["Yeniden başlat", "Daha sonra"],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.checkForUpdates().catch((err) => console.error("[güncelleme]", err?.message || err));
}

app.on("second-instance", () => {
  if (pencere) {
    if (pencere.isMinimized()) pencere.restore();
    pencere.focus();
  }
});
app.whenReady().then(baslat);
app.on("window-all-closed", () => app.quit());
