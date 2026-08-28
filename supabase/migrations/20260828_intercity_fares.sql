-- =========================================================================
-- 도시 간 교통 요금 및 소요시간 관리 테이블 (TAGO API 실시간 동기화용)
-- =========================================================================

CREATE TABLE IF NOT EXISTS intercity_transport_fares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_key VARCHAR(50) NOT NULL,              -- 예: 'SEOUL-BUSAN', 'SEOUL-JEONJU'
  from_city VARCHAR(30) NOT NULL,               -- 예: 'SEOUL'
  to_city VARCHAR(30) NOT NULL,                 -- 예: 'BUSAN'
  mode VARCHAR(30) NOT NULL,                    -- 예: 'KTX', 'EXPRESS_BUS', 'FLIGHT', 'SRT'
  name_ko VARCHAR(100) NOT NULL,                -- 예: 'KTX 고속철도 (서울역)'
  name_en VARCHAR(100) NOT NULL,                -- 예: 'KTX Express Train (Seoul Stn)'
  one_way_price_krw INTEGER NOT NULL,           -- 예: 59800
  duration_text_ko VARCHAR(50) NOT NULL,        -- 예: '2시간 37분'
  duration_text_en VARCHAR(50) NOT NULL,        -- 예: '2h 37m'
  is_default BOOLEAN DEFAULT FALSE,             -- 추천 여부
  badge_text_ko VARCHAR(50),                    -- 예: '최단시간', '가성비'
  badge_text_en VARCHAR(50),
  source_type VARCHAR(50) DEFAULT 'TAGO_OFFICIAL', -- 'TAGO_OFFICIAL', 'KOBUS', 'KORAIL', 'FLIGHT'
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_route_mode UNIQUE (route_key, mode, name_ko)
);

-- 빠른 조회를 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_intercity_fares_route_key ON intercity_transport_fares(route_key);
CREATE INDEX IF NOT EXISTS idx_intercity_fares_cities ON intercity_transport_fares(from_city, to_city);

-- RLS (Row Level Security) 설정: 전 세계 누구나 읽기 가능(Public Read), Service Role만 쓰기 가능
ALTER TABLE intercity_transport_fares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on intercity_transport_fares"
  ON intercity_transport_fares
  FOR SELECT
  TO public
  USING (true);
