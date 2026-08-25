-- HypeHeritage Phase 1: 교통(Transit) 정보 및 AREX 공항철도 운임 DB Schema
-- Supabase PostgreSQL 전용 스키마 정의

-- 1. transits 테이블 생성
CREATE TABLE IF NOT EXISTS transits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL, -- e.g. AREX_EXPRESS, AREX_ALL_STOP
    category VARCHAR(32) NOT NULL CHECK (category IN ('AIRPORT_TRAIN', 'AIRPORT_BUS', 'SUBWAY', 'CITY_BUS', 'INTERCITY_TRAIN', 'PASS', 'TAXI')),
    billing_type VARCHAR(32) NOT NULL DEFAULT 'PER_TRIP' CHECK (billing_type IN ('PER_TRIP', 'PER_DAY', 'PASS')),
    city VARCHAR(32) NOT NULL DEFAULT 'SEOUL',
    price_krw INT NOT NULL DEFAULT 0,
    duration_mins INT DEFAULT NULL,
    official_url TEXT DEFAULT NULL,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. transit_translations 테이블 생성 (국문 / 영문)
CREATE TABLE IF NOT EXISTS transit_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transit_id UUID NOT NULL REFERENCES transits(id) ON DELETE CASCADE,
    locale VARCHAR(8) NOT NULL CHECK (locale IN ('ko', 'en', 'ja', 'zh')),
    name VARCHAR(255) NOT NULL,
    route_info TEXT NOT NULL,
    description TEXT NOT NULL,
    tips TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(transit_id, locale)
);

-- 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_transits_category_city ON transits (category, city);
CREATE INDEX IF NOT EXISTS idx_transits_code ON transits (code);

-- 3. Row Level Security (RLS) 정책
ALTER TABLE transits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for transits" ON transits;
CREATE POLICY "Public read access for transits" ON transits
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for transit_translations" ON transit_translations;
CREATE POLICY "Public read access for transit_translations" ON transit_translations
    FOR SELECT USING (true);

-- 4. 초기 AREX 및 교통 기본 데이터 적재
-- 4.1 AREX 직통열차
INSERT INTO transits (code, category, billing_type, city, price_krw, duration_mins, official_url, tags, is_featured)
VALUES (
    'AREX_EXPRESS',
    'AIRPORT_TRAIN',
    'PER_TRIP',
    'SEOUL',
    11000,
    43,
    'https://www.airportrailroad.com/train/express/introduce',
    ARRAY['공항철도', '직통열차', '서울역', '논스톱', '도심공항'],
    true
) ON CONFLICT (code) DO UPDATE SET
    price_krw = EXCLUDED.price_krw,
    duration_mins = EXCLUDED.duration_mins,
    official_url = EXCLUDED.official_url;

-- 4.2 AREX 일반열차
INSERT INTO transits (code, category, billing_type, city, price_krw, duration_mins, official_url, tags, is_featured)
VALUES (
    'AREX_ALL_STOP',
    'AIRPORT_TRAIN',
    'PER_TRIP',
    'SEOUL',
    4450,
    59,
    'https://www.airportrailroad.com/train/normal/fare',
    ARRAY['공항철도', '일반열차', '홍대입구', '티머니', '환승할인'],
    true
) ON CONFLICT (code) DO UPDATE SET
    price_krw = EXCLUDED.price_krw,
    duration_mins = EXCLUDED.duration_mins,
    official_url = EXCLUDED.official_url;
