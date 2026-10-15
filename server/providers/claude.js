import Anthropic from "@anthropic-ai/sdk";

const istemciler = new Map();

// `fetch`: masaüstü programında Windows ağ ayarlarını (proxy, kurum sertifikaları) kullanan
// Electron net.fetch verilir; verilmezse Node'un kendi fetch'i kullanılır.
function istemci(anahtar, fetch) {
  if (!istemciler.has(anahtar)) {
    istemciler.set(anahtar, new Anthropic({ apiKey: anahtar, maxRetries: 2, ...(fetch ? { fetch } : {}) }));
  }
  return istemciler.get(anahtar);
}

function hataCevir(err) {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new Error("Claude API anahtarı geçersiz ya da yetkisiz. Ayarlar > Yapay Zekâ bölümünden anahtarı kontrol edin.");
  }
  if (err instanceof Anthropic.NotFoundError) {
    return new Error("Claude modeli bulunamadı. Ayarlar > Yapay Zekâ > Gelişmiş bölümündeki model adını kontrol edin.");
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new Error("Claude API kullanım sınırına ulaşıldı ya da hesapta bakiye yok. Biraz bekleyip tekrar deneyin; sürerse console.anthropic.com'dan bakiyeyi kontrol edin.");
  }
  if (err instanceof Anthropic.APIConnectionError) {
    const ayrinti = err.cause?.message || err.message;
    return new Error(`Claude API'ye bağlanılamadı. İnternet bağlantısını ya da kurum ağının api.anthropic.com adresine izin verip vermediğini kontrol edin. (Ayrıntı: ${ayrinti})`);
  }
  if (err instanceof Anthropic.APIError) {
    return new Error(`Claude API hatası (${err.status}): ${err.message}`);
  }
  return err;
}

/** Yapılandırılmış (JSON şemalı) yanıt üretir. */
export async function cagir({ sistem, kullanici, anahtar, model, sema, efor = "medium", fetch }) {
  let yanit;
  try {
    yanit = await istemci(anahtar, fetch).beta.messages.create({
      model,
      max_tokens: 16000,
      // Güvenlik sınıflandırıcısı isteği reddederse sunucu tarafında uygun modele düşer.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      cache_control: { type: "ephemeral" },
      output_config: { effort: efor, format: { type: "json_schema", schema: sema } },
      system: sistem,
      messages: [{ role: "user", content: kullanici }],
    });
  } catch (err) {
    throw hataCevir(err);
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
    veri: JSON.parse(metin),
    model: yanit.model,
    kullanim: { girdi: yanit.usage.input_tokens, cikti: yanit.usage.output_tokens, onbellek: yanit.usage.cache_read_input_tokens ?? 0 },
  };
}

/** Anahtar, model ve ağ bağlantısını ücretsiz bir istekle sınar. */
export async function sina({ anahtar, model, fetch }) {
  try {
    const m = await istemci(anahtar, fetch).models.retrieve(model);
    return `Claude bağlantısı çalışıyor (${m.display_name || model}).`;
  } catch (err) {
    throw hataCevir(err);
  }
}
