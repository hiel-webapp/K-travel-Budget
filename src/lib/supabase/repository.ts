import { NormalizedPlaceInput } from "../kto/types";
import { supabaseFetch } from "./client";
import {
  DbIngestionRun,
  DbPlace,
  DbPlaceImage,
  DbPlaceSource,
  DbPlaceTranslation,
} from "./types";

export async function createIngestionRun(
  run: Omit<DbIngestionRun, "id" | "started_at">
): Promise<DbIngestionRun> {
  const payload: Partial<DbIngestionRun> = {
    ...run,
    started_at: new Date().toISOString(),
  };

  const res = await supabaseFetch<DbIngestionRun[]>("ingestion_runs", {
    method: "POST",
    body: JSON.stringify(payload),
    prefer: "return=representation",
  });

  return res[0];
}

export async function updateIngestionRun(
  id: string,
  update: Partial<DbIngestionRun>
): Promise<DbIngestionRun> {
  const payload: Partial<DbIngestionRun> = {
    ...update,
    ...(update.status === "COMPLETED" || update.status === "FAILED"
      ? { completed_at: new Date().toISOString() }
      : {}),
  };

  const res = await supabaseFetch<DbIngestionRun[]>(
    `ingestion_runs?id=eq.${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      prefer: "return=representation",
    }
  );

  return res[0];
}

export async function upsertPlace(
  input: NormalizedPlaceInput
): Promise<{ placeId: string; isNew: boolean }> {
  const placePayload: DbPlace = {
    content_id: input.contentId,
    source_name: input.sourceName,
    city: input.city,
    category: input.category,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    rep_image_url: input.repImageUrl,
    quality_status: input.qualityStatus,
    raw_updated_at: input.rawUpdatedAt,
    updated_at: new Date().toISOString(),
  };

  const res = await supabaseFetch<DbPlace[]>(
    "places?on_conflict=content_id,source_name",
    {
      method: "POST",
      body: JSON.stringify(placePayload),
      prefer: "resolution=merge-duplicates,return=representation",
    }
  );

  const saved = res[0];
  if (!saved || !saved.id) {
    throw new Error(
      `[SUPABASE_REPO_ERROR] Failed to obtain place ID after upsert for content_id: ${input.contentId}`
    );
  }

  // inserted_at과 updated_at이 거의 동일한 경우 new로 판별
  const ingestedAt = saved.ingested_at ? new Date(saved.ingested_at).getTime() : 0;
  const updatedAt = saved.updated_at ? new Date(saved.updated_at).getTime() : 0;
  const isNew = Math.abs(updatedAt - ingestedAt) < 1000;

  return { placeId: saved.id, isNew };
}

export async function upsertPlaceTranslation(
  translation: DbPlaceTranslation
): Promise<void> {
  const payload = {
    ...translation,
    updated_at: new Date().toISOString(),
  };

  await supabaseFetch<DbPlaceTranslation[]>(
    "place_translations?on_conflict=place_id,locale",
    {
      method: "POST",
      body: JSON.stringify(payload),
      prefer: "resolution=merge-duplicates,return=representation",
    }
  );
}

export async function upsertPlaceSource(
  source: DbPlaceSource
): Promise<void> {
  const payload = {
    ...source,
    fetched_at: new Date().toISOString(),
  };

  await supabaseFetch<DbPlaceSource[]>(
    "place_sources?on_conflict=source_name,source_content_id",
    {
      method: "POST",
      body: JSON.stringify(payload),
      prefer: "resolution=merge-duplicates,return=representation",
    }
  );
}

export async function replacePlaceImages(
  placeId: string,
  images: Array<{ imageUrl: string; originUrl?: string; caption?: string; sortOrder: number }>
): Promise<void> {
  // 기존 이미지 삭제 후 신규 이미지 추가
  await supabaseFetch(`place_images?place_id=eq.${placeId}`, {
    method: "DELETE",
  });

  if (images.length === 0) return;

  const payloads: DbPlaceImage[] = images.map((img) => ({
    place_id: placeId,
    image_url: img.imageUrl,
    origin_url: img.originUrl,
    caption: img.caption,
    sort_order: img.sortOrder,
  }));

  await supabaseFetch<DbPlaceImage[]>("place_images", {
    method: "POST",
    body: JSON.stringify(payloads),
    prefer: "return=representation",
  });
}
