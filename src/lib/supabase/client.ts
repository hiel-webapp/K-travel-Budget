export interface SupabaseEnv {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

/**
 * Supabase 서버 전용 환경변수를 검증하고 반환합니다.
 * 키 값 자체나 URL 비밀정보를 에러 메시지에 노출하지 않습니다.
 */
export function validateSupabaseEnv(): SupabaseEnv {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing: string[] = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    throw new Error(
      `[SUPABASE_CLIENT_ERROR] Missing required server environment variable(s): ${missing.join(", ")}`
    );
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabaseServiceRoleKey: supabaseServiceRoleKey!,
  };
}

export interface SupabaseFetchOptions extends RequestInit {
  prefer?: string;
  query?: Record<string, string>;
}

/**
 * Node 내장 fetch를 사용하여 Supabase PostgREST API를 서버 전용으로 호출합니다.
 * 클라이언트(브라우저)에서 호출 시 안전하게 차단되며, 인증키 정보가 노출되지 않도록 조치되었습니다.
 */
export async function supabaseFetch<T>(
  path: string,
  options: SupabaseFetchOptions = {}
): Promise<T> {
  if (typeof window !== "undefined") {
    throw new Error(
      "[SUPABASE_CLIENT_ERROR] Supabase server client cannot be invoked in browser."
    );
  }

  const { supabaseUrl, supabaseServiceRoleKey } = validateSupabaseEnv();

  const url = new URL(`${supabaseUrl}/rest/v1/${path}`);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      url.searchParams.append(k, v);
    }
  }

  const headers: Record<string, string> = {
    apikey: supabaseServiceRoleKey,
    Authorization: `Bearer ${supabaseServiceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: options.prefer || "return=representation",
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url.toString(), {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {
        errorText = "Failed to parse error response";
      }

      // 키나 URL 비밀정보가 노출되지 않도록 HTTP 상태코드 및 정제된 에러 메시지 반환
      throw new Error(
        `[SUPABASE_REST_ERROR] Request to table '${path.split("?")[0]}' failed with HTTP ${response.status}. Details: ${errorText.substring(0, 200)}`
      );
    }

    if (response.status === 204) {
      return [] as unknown as T;
    }

    const text = await response.text();
    if (!text || text.trim() === "") {
      return [] as unknown as T;
    }

    try {
      const data: T = JSON.parse(text);
      return data;
    } catch {
      return [] as unknown as T;
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith("[SUPABASE_")) {
      throw err;
    }
    throw new Error(
      `[SUPABASE_NETWORK_ERROR] Network request failed for PostgREST endpoint: '${path.split("?")[0]}'`
    );
  }
}
