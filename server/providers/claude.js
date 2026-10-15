import Anthropic from "@anthropic-ai/sdk";
import { HABER_SEMASI } from "../prompt.js";

const istemciler = new Map();

export async function uret({ sistem, kullanici, anahtar, model }) {
  if (!istemciler.has(anahtar)) istemciler.set(anahtar, new Anthropic({ apiKey: anahtar }));
  const client = istemciler.get(anahtar);

  let yanit;
  try {
    yanit = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      // Güvenlik sınıflandırıcısı isteği reddederse sunucu tarafında uygun modele düşer.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      cache_control: { type: "ephemeral" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: HABER_SEMASI },
      },
      system: sistem,
      messages: [{ role: "user", content: kullanici }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error("Claude API anahtarı geçersiz. Ayarlar > Yapay Zekâ bölümünden anahtarı kontrol edin.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error("Claude API kullanım sınırına ulaşıldı. Biraz bekleyip tekrar deneyin.");
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new Error("Claude API'ye bağlanılamadı. İnternet bağlantısını kontrol edin.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(`Claude API hatası (${err.status}): ${err.message}`);
    }
    throw err;
  }

  if (yanit.stop_reason === "refusal") {
    throw new Error("Model bu isteği işlemeyi reddetti. Notları gözden geçirip tekrar deneyin.");
  }
  if (yanit.stop_reason === "max_tokens") {
    throw new Error("Yanıt uzunluk sınırına takıldı. Notları kısaltıp tekrar deneyin.");
  }
  const metin = yanit.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return {
    haber: JSON.parse(metin),
    model: yanit.model,
    kullanim: { girdi: yanit.usage.input_tokens, cikti: yanit.usage.output_tokens, onbellek: yanit.usage.cache_read_input_tokens ?? 0 },
  };
}
