import { GoogleGenAI } from "@google/genai";

const istemciler = new Map();

function istemci(anahtar) {
  if (!istemciler.has(anahtar)) istemciler.set(anahtar, new GoogleGenAI({ apiKey: anahtar }));
  return istemciler.get(anahtar);
}

function hataCevir(err) {
  const durum = err.status ?? err.code;
  if (durum === 400 || durum === 401 || durum === 403) {
    return new Error(`Gemini isteği reddetti (${durum}). Ayarlar > Yapay Zekâ bölümünden anahtarı ve modeli kontrol edin.`);
  }
  if (durum === 404) return new Error("Gemini modeli bulunamadı. Ayarlar > Yapay Zekâ > Gelişmiş bölümündeki model adını kontrol edin.");
  if (durum === 429) return new Error("Gemini kullanım sınırına ulaşıldı. Biraz bekleyip tekrar deneyin.");
  return new Error(`Gemini'ye bağlanılamadı. İnternet bağlantısını ya da kurum ağını kontrol edin. (Ayrıntı: ${err.cause?.message || err.message})`);
}

/** Yapılandırılmış (JSON şemalı) yanıt üretir. */
export async function cagir({ sistem, kullanici, anahtar, model, sema }) {
  let yanit;
  try {
    yanit = await istemci(anahtar).models.generateContent({
      model,
      contents: kullanici,
      config: {
        systemInstruction: sistem,
        responseMimeType: "application/json",
        responseJsonSchema: sema,
      },
    });
  } catch (err) {
    throw hataCevir(err);
  }
  if (!yanit.text) throw new Error("Gemini boş yanıt döndürdü. Tekrar deneyin.");
  const u = yanit.usageMetadata || {};
  return {
    veri: JSON.parse(yanit.text),
    model,
    kullanim: { girdi: u.promptTokenCount ?? 0, cikti: u.candidatesTokenCount ?? 0, onbellek: u.cachedContentTokenCount ?? 0 },
  };
}

export async function sina({ anahtar, model }) {
  try {
    await istemci(anahtar).models.get({ model });
    return `Gemini bağlantısı çalışıyor (${model}).`;
  } catch (err) {
    throw hataCevir(err);
  }
}
