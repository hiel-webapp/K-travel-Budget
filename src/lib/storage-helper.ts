import {
  TripDraft,
  TripDraftStorageEnvelope,
  DEFAULT_TRIP_DRAFT,
  validateTripDraft,
  migrateLegacyState,
} from "./trip-domain";

const NEW_STORAGE_KEY = "hypeheritage_trip_draft";
const LEGACY_STORAGE_KEY = "k_travel_state";

export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * TripDraft를 로컬스토리지에 envelope 형식으로 안전하게 저장합니다.
 */
export function saveTripDraft(draft: TripDraft): boolean {
  if (!isClient()) return false;

  try {
    const validation = validateTripDraft(draft);
    if (!validation.success) {
      return false;
    }

    const envelope: TripDraftStorageEnvelope = {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      tripDraft: draft,
    };

    localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/**
 * 로컬스토리지로부터 TripDraft를 우선 로드하며, 필요 시 기존 레거시 상태를 마이그레이션합니다.
 * 모두 실패할 경우 DEFAULT_TRIP_DRAFT를 반환합니다.
 */
export function loadTripDraft(): TripDraft {
  if (!isClient()) {
    return DEFAULT_TRIP_DRAFT;
  }

  // 1. 신규 스키마 로드 시도
  try {
    const rawNew = localStorage.getItem(NEW_STORAGE_KEY);
    if (rawNew) {
      const envelope = JSON.parse(rawNew) as TripDraftStorageEnvelope;
      if (
        envelope &&
        envelope.schemaVersion === 1 &&
        envelope.tripDraft
      ) {
        const validation = validateTripDraft(envelope.tripDraft);
        if (validation.success) {
          return envelope.tripDraft;
        }
      }
    }
  } catch {
    // 디코딩 실패 등 오류 무시 후 다음 단계 진행
  }

  // 2. 레거시 스키마 마이그레이션 시도
  try {
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawLegacy) {
      const legacyObj = JSON.parse(rawLegacy);
      const migrated = migrateLegacyState(legacyObj);
      if (migrated) {
        // 이관 성공 시 새 저장소에 envelope 형태로 기록하되, 기존 k_travel_state는 삭제하지 않고 유지합니다.
        saveTripDraft(migrated);
        return migrated;
      }
    }
  } catch {
    // 무시하고 기본값 fallback
  }

  return DEFAULT_TRIP_DRAFT;
}
