import Anthropic from "@anthropic-ai/sdk";

const istemciler = new Map();

// `fetch`: masaüstü programında Windows ağ ayarlarını (proxy, kurum sertifikaları) kullanan
// Electron net.fetch verilir; verilmezse Node'un kendi fetch'i kullanılır.
// `calismaAlani`: kullanıcı anahtarları (sk-ant-usr-…) bir çalışma alanına bağlı olmadığı için
// her istekte anthropic-workspace-id başlığıyla hangi çalışma alanının kullanılacağı belirtilir.
function istemci(anahtar, fetch, calismaAlani = "") {
  const kimlik = `${anahtar}|${calismaAlani}`;
  if (!istemciler.has(kimlik)) {
    istemciler.set(
      kimlik,
      new Anthropic({
        apiKey: anahtar,
        maxRetries: 2,
        ...(fetch ? { fetch } : {}),
        ...(calismaAlani ? { defaultHeaders: { "anthropic-workspace-id": calismaAlani } } : {}),
      }),
    );
  }
  return istemciler.get(kimlik);
}

function hataCevir(err) {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new Error("Claude API anahtarı geçersiz ya da yetkisiz. Ayarlar > Yapay Zekâ bölümünden anahtarı kontrol edin.");
  }
  if (err instanceof Anthropic.BadRequestError && /anthropic-workspace-id|scoped to a workspace/i.test(err.message)) {
    return new Error(
      "Bu Claude anahtarı bir kullanıcı anahtarı (sk-ant-usr-…) ve bir çalışma alanına bağlı değil. " +
        "Çözüm: console.anthropic.com > Settings > Workspaces bölümünde bir çalışma alanı oluşturun (program kimliği kendisi bulur) " +
        "ya da çalışma alanının kimliğini (wrkspc_… ile başlar; API anahtarı değil) Ayarlar > Yapay Zekâ bölümündeki \"Çalışma alanı kimliği\" kutusuna yazın.",
    );
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
export async function cagir({ sistem, kullanici, anahtar, model, sema, efor = "medium", fetch, calismaAlani }) {
  let yanit;
  try {
    yanit = await istemci(anahtar, fetch, calismaAlani).beta.messages.create({
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

/**
 * Kullanıcı anahtarları (sk-ant-usr-…) için kuruluştaki ilk etkin çalışma alanının kimliğini bulur.
 * Varsayılan çalışma alanı bu listede yer almaz; bulunamazsa boş döner.
 */
export async function calismaAlaniBul({ anahtar, fetch }) {
  try {
    const yanit = await istemci(anahtar, fetch).get("/v1/organizations/workspaces", { query: { limit: 20 } });
    return (yanit?.data || []).find((w) => !w.archived_at)?.id || "";
  } catch {
    return "";
  }
}

/** Anahtar, model ve ağ bağlantısını ücretsiz bir istekle sınar. */
export async function sina({ anahtar, model, fetch, calismaAlani }) {
  try {
    const c = istemci(anahtar, fetch, calismaAlani);
    const m = await c.models.retrieve(model);
    // Model listesi çalışma alanı istemez; gerçek bir isteği (1 token) de deneyerek
    // anahtarın haber üretmek için gerçekten kullanılabildiğini sınar.
    await c.messages.create({ model, max_tokens: 16, messages: [{ role: "user", content: "Yalnızca TAMAM yaz." }] });
    return `Claude bağlantısı çalışıyor (${m.display_name || model}).`;
  } catch (err) {
    throw hataCevir(err);
  }
}
