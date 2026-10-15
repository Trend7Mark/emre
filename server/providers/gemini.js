import { GoogleGenAI } from "@google/genai";
import { HABER_SEMASI } from "../prompt.js";

const istemciler = new Map();

export async function uret({ sistem, kullanici, anahtar, model }) {
  if (!istemciler.has(anahtar)) istemciler.set(anahtar, new GoogleGenAI({ apiKey: anahtar }));
  const client = istemciler.get(anahtar);

  let yanit;
  try {
    yanit = await client.models.generateContent({
      model,
      contents: kullanici,
      config: {
        systemInstruction: sistem,
        responseMimeType: "application/json",
        responseJsonSchema: HABER_SEMASI,
      },
    });
  } catch (err) {
    const durum = err.status ?? err.code;
    if (durum === 400 || durum === 401 || durum === 403) {
      throw new Error(`Gemini isteği reddetti (${durum}). Ayarlar > Yapay Zekâ bölümünden anahtarı ve modeli kontrol edin.`);
    }
    if (durum === 429) throw new Error("Gemini kullanım sınırına ulaşıldı. Biraz bekleyip tekrar deneyin.");
    throw new Error(`Gemini'ye bağlanılamadı: ${err.message}`);
  }
  if (!yanit.text) throw new Error("Gemini boş yanıt döndürdü. Tekrar deneyin.");
  const u = yanit.usageMetadata || {};
  return {
    haber: JSON.parse(yanit.text),
    model,
    kullanim: { girdi: u.promptTokenCount ?? 0, cikti: u.candidatesTokenCount ?? 0, onbellek: u.cachedContentTokenCount ?? 0 },
  };
}
