// Basit dosya tabanlı depolama. Veriler DATA_DIR altında JSON olarak tutulur.
// İleride çok kurumlu (il/ilçe) kullanıma geçildiğinde bu modül bir veritabanı
// katmanıyla değiştirilecek; bu yüzden tüm kayıtlar şimdiden `kurumId` taşır.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { VARSAYILAN_AYARLAR, VARSAYILAN_ORNEKLER } from "./defaults.js";

const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");

function dosya(ad) {
  return path.join(DATA_DIR, `${ad}.json`);
}

function oku(ad, varsayilan) {
  try {
    return JSON.parse(fs.readFileSync(dosya(ad), "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return structuredClone(varsayilan);
    throw err;
  }
}

function yaz(ad, veri) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const hedef = dosya(ad);
  const gecici = `${hedef}.${process.pid}.tmp`;
  fs.writeFileSync(gecici, JSON.stringify(veri, null, 2), "utf8");
  fs.renameSync(gecici, hedef);
}

export const yeniId = () => crypto.randomUUID();
const simdi = () => new Date().toISOString();

// ---- Kurum ayarları ----
export function ayarlariGetir() {
  return { ...structuredClone(VARSAYILAN_AYARLAR), ...oku("ayarlar", VARSAYILAN_AYARLAR) };
}

export function ayarlariKaydet(ayarlar) {
  const kayit = { ...ayarlariGetir(), ...ayarlar, guncelleme: simdi() };
  yaz("ayarlar", kayit);
  return kayit;
}

// ---- Üslup örnekleri ----
export function ornekleriGetir() {
  return oku("ornekler", VARSAYILAN_ORNEKLER);
}

export function ornekEkle({ baslik, metin, kaynak = "" }) {
  const liste = ornekleriGetir();
  const kayit = { id: yeniId(), kurumId: ayarlariGetir().kurumId, baslik, metin, kaynak, eklenme: simdi() };
  liste.unshift(kayit);
  yaz("ornekler", liste);
  return kayit;
}

export function ornekSil(id) {
  const liste = ornekleriGetir();
  const kalan = liste.filter((o) => o.id !== id);
  yaz("ornekler", kalan);
  return kalan.length !== liste.length;
}

// ---- Haber arşivi ----
export function arsiviGetir() {
  return oku("arsiv", []);
}

export function haberGetir(id) {
  return arsiviGetir().find((h) => h.id === id) || null;
}

export function haberKaydet(haber) {
  const liste = arsiviGetir();
  const i = liste.findIndex((h) => h.id === haber.id);
  if (i === -1) {
    const kayit = { id: yeniId(), kurumId: ayarlariGetir().kurumId, olusturma: simdi(), ...haber };
    kayit.guncelleme = kayit.olusturma;
    liste.unshift(kayit);
    yaz("arsiv", liste);
    return kayit;
  }
  liste[i] = { ...liste[i], ...haber, guncelleme: simdi() };
  yaz("arsiv", liste);
  return liste[i];
}

export function haberSil(id) {
  const liste = arsiviGetir();
  const kalan = liste.filter((h) => h.id !== id);
  yaz("arsiv", kalan);
  return kalan.length !== liste.length;
}
