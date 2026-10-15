import { GoogleGenAI } from "@google/genai";
import { HABER_SEMASI } from "../prompt.js";

let client;

export async function uret({ sistem, kullanici }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY tanımlı değil. .env dosyasına Google AI Studio anahtarınızı ekleyin.");
  }
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || "gemini-2.5-pro";

  const yanit = await client.models.generateContent({
    model,
    contents: kullanici,
    config: {
      systemInstruction: sistem,
      responseMimeType: "application/json",
      responseJsonSchema: HABER_SEMASI,
    },
  });
  if (!yanit.text) throw new Error("Gemini boş yanıt döndürdü. Tekrar deneyin.");
  const u = yanit.usageMetadata || {};
  return {
    haber: JSON.parse(yanit.text),
    model,
    kullanim: { girdi: u.promptTokenCount ?? 0, cikti: u.candidatesTokenCount ?? 0, onbellek: u.cachedContentTokenCount ?? 0 },
  };
}
