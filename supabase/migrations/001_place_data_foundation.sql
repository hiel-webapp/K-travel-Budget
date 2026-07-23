-- HypeHeritage Place Data Foundation 1차 DB Migration Schema
-- Supabase PostgreSQL 전용 스키마 정의
-- Note: 실제 사용자 인증(Auth) 연동 및 RLS(Row Level Security) 접근 제어 정책은
--      향후 데이터 수집 및 서비스 연동 단계에서 적용 예정입니다. (임의의 공개 쓰기 정책을 부여하지 않습니다.)

-- 1. places (장소 기본 정보)
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id VARCHAR(64) NOT NULL,
    source_name VARCHAR(32) NOT NULL DEFAULT 'KTO',
    city VARCHAR(16) NOT NULL CHECK (city IN ('SEOUL', 'BUSAN')),
    category VARCHAR(32) NOT NULL CHECK (category IN ('ACCOMMODATION', 'RESTAURANT', 'CAFE', 'ATTRACTION', 'CULTURE')),
    address TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    rep_image_url TEXT,
    quality_status VARCHAR(32) NOT NULL DEFAULT 'INCOMPLETE' CHECK (quality_status IN ('READY', 'INCOMPLETE', 'REVIEW_REQUIRED')),
    raw_updated_at TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_places_content_source UNIQUE (content_id, source_name)
);

CREATE INDEX IF NOT EXISTS idx_places_city_category ON places (city, category);
CREATE INDEX IF NOT EXISTS idx_places_quality_status ON places (quality_status);

-- 2. place_translations (국문/영문 다국어 정보)
CREATE TABLE IF NOT EXISTS place_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    locale VARCHAR(8) NOT NULL CHECK (locale IN ('ko', 'en')),
    title VARCHAR(256) NOT NULL,
    description TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_place_translations_place_locale UNIQUE (place_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_place_translations_place_id ON place_translations (place_id);

-- 3. place_images (장소 추가 이미지)
CREATE TABLE IF NOT EXISTS place_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    origin_url TEXT,
    caption TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_place_images_place_id ON place_images (place_id);

-- 4. place_tags (장소 태그 마스터)
CREATE TABLE IF NOT EXISTS place_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL UNIQUE,
    category VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. place_tag_links (장소-태그 매핑)
CREATE TABLE IF NOT EXISTS place_tag_links (
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES place_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (place_id, tag_id)
);

-- 6. place_sources (원천 OpenAPI 수집 로우 데이터 보관)
CREATE TABLE IF NOT EXISTS place_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    source_name VARCHAR(32) NOT NULL,
    source_content_id VARCHAR(64) NOT NULL,
    raw_data JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_place_sources_source_content UNIQUE (source_name, source_content_id)
);

CREATE INDEX IF NOT EXISTS idx_place_sources_place_id ON place_sources (place_id);

-- 7. ingestion_runs (수집 실행 이력 트래킹)
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(32) NOT NULL,
    city VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
    total_fetched INT NOT NULL DEFAULT 0,
    total_inserted INT NOT NULL DEFAULT 0,
    total_updated INT NOT NULL DEFAULT 0,
    total_skipped INT NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
