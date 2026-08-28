import { supabaseFetch } from "./client";
import { IntercityFareInfo } from "../transport/intercity-fares";

export interface DbIntercityFareRow {
  id?: string;
  route_key: string;
  from_city: string;
  to_city: string;
  mode: string;
  name_ko: string;
  name_en: string;
  one_way_price_krw: number;
  duration_text_ko: string;
  duration_text_en: string;
  is_default: boolean;
  badge_text_ko?: string | null;
  badge_text_en?: string | null;
  source_type?: string;
  last_synced_at?: string;
}

/**
 * Supabase DB에서 특정 구간 또는 전체 요금 목록을 가져옵니다.
 */
export async function getFaresFromDb(routeKey?: string): Promise<Record<string, IntercityFareInfo[]>> {
  try {
    const query: Record<string, string> = {
      select: "*",
      order: "id.asc",
    };
    if (routeKey) {
      query.route_key = `eq.${routeKey}`;
    }

    const data = await supabaseFetch<DbIntercityFareRow[]>("intercity_transport_fares", {
      method: "GET",
      query,
    });

    if (!data || !Array.isArray(data)) {
      return {};
    }

    const result: Record<string, IntercityFareInfo[]> = {};
    for (const row of data) {
      if (!result[row.route_key]) {
        result[row.route_key] = [];
      }
      result[row.route_key].push({
        mode: row.mode as any,
        nameKo: row.name_ko,
        nameEn: row.name_en,
        oneWayPriceKrw: row.one_way_price_krw,
        durationTextKo: row.duration_text_ko,
        durationTextEn: row.duration_text_en,
        isDefault: row.is_default,
        badgeTextKo: row.badge_text_ko || undefined,
        badgeTextEn: row.badge_text_en || undefined,
      });
    }

    return result;
  } catch (err: any) {
    console.warn("[Supabase] 요금 조회 예외 (로컬 백업 캐시 사용):", err.message);
    return {};
  }
}

/**
 * 요금 테이블 전체를 Supabase DB에 일괄 저장(UPSERT)합니다.
 */
export async function upsertAllFaresToDb(
  fareTable: Record<string, IntercityFareInfo[]>
): Promise<{ success: boolean; count: number; error?: string }> {
  const rows: DbIntercityFareRow[] = [];

  for (const [routeKey, options] of Object.entries(fareTable)) {
    const [fromCity, toCity] = routeKey.split("-");
    for (const opt of options) {
      rows.push({
        route_key: routeKey,
        from_city: fromCity,
        to_city: toCity,
        mode: opt.mode,
        name_ko: opt.nameKo,
        name_en: opt.nameEn,
        one_way_price_krw: opt.oneWayPriceKrw,
        duration_text_ko: opt.durationTextKo,
        duration_text_en: opt.durationTextEn,
        is_default: !!opt.isDefault,
        badge_text_ko: opt.badgeTextKo || null,
        badge_text_en: opt.badgeTextEn || null,
        source_type: "TAGO_OFFICIAL",
        last_synced_at: new Date().toISOString(),
      });
    }
  }

  try {
    await supabaseFetch<any>("intercity_transport_fares", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      query: {
        on_conflict: "route_key,mode,name_ko",
      },
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rows),
    });

    return { success: true, count: rows.length };
  } catch (e: any) {
    return { success: false, count: 0, error: e.message };
  }
}
