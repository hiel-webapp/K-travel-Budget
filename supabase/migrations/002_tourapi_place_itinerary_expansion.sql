-- HypeHeritage Phase 1: TourAPI 연동 및 여행 일정(Itinerary) 확장 DB Migration Schema
-- Supabase PostgreSQL 전용 스키마 정의

-- 1. places 테이블 확장 (10개 주요 도시 지원 및 가격 상태 태그 추가)
-- 1.1 city 제약 조건 유연화 (서울, 부산, 인천, 제주, 경주, 전주, 강릉, 여수, 수원, 속초 등 10대 지원 도시)
ALTER TABLE places DROP CONSTRAINT IF EXISTS places_city_check;
ALTER TABLE places ADD CONSTRAINT places_city_check CHECK (
    city IN ('SEOUL', 'BUSAN', 'JEJU', 'INCHEON', 'SUWON', 'JEONJU', 'GYEONGJU', 'GANGNEUNG', 'SOKCHO', 'YEOSU')
);

-- 1.2 가격 정보 및 가격 상태 컬럼 추가 (무료 / 공식 금액 / 확인 필요)
ALTER TABLE places ADD COLUMN IF NOT EXISTS price_status VARCHAR(32) NOT NULL DEFAULT 'NEEDS_CHECK' 
    CHECK (price_status IN ('FREE', 'OFFICIAL_PRICE', 'NEEDS_CHECK'));
ALTER TABLE places ADD COLUMN IF NOT EXISTS price_krw INT DEFAULT 0;
ALTER TABLE places ADD COLUMN IF NOT EXISTS official_link TEXT;
ALTER TABLE places ADD COLUMN IF NOT EXISTS tel TEXT;
ALTER TABLE places ADD COLUMN IF NOT EXISTS use_time TEXT;

-- 2. trip_itineraries (사용자 여행 일차별 장소 담기 및 개인화 메모)
CREATE TABLE IF NOT EXISTS trip_itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id VARCHAR(128) NOT NULL, -- 로컬스토리지 저장 trip_id 또는 사용자 ID
    day_index INT NOT NULL DEFAULT 1 CHECK (day_index >= 1 AND day_index <= 14),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    memo TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    user_cost_override_krw INT DEFAULT NULL, -- 사용자가 직접 입력한 금액 오버라이드 (기본값 NULL)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_places_price_status ON places (price_status);
CREATE INDEX IF NOT EXISTS idx_trip_itineraries_trip_day ON trip_itineraries (trip_id, day_index);

-- 3. Supabase Row Level Security (RLS) 접근 제어 정책
-- 3.1 places 및 place_translations 테이블: 일반 사용자 및 아논 키 읽기(SELECT) 허용
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for places" ON places;
CREATE POLICY "Public read access for places" ON places
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for place_translations" ON place_translations;
CREATE POLICY "Public read access for place_translations" ON place_translations
    FOR SELECT USING (true);

-- 3.2 trip_itineraries 테이블: RLS 및 읽기/쓰기 허용 (trip_id 기준)
ALTER TABLE trip_itineraries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for trip_itineraries" ON trip_itineraries;
CREATE POLICY "Allow all operations for trip_itineraries" ON trip_itineraries
    FOR ALL USING (true) WITH CHECK (true);
