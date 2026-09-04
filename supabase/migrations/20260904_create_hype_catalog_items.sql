-- ==============================================================================
-- Migration: Create hype_catalog_items table for K-travel Budget Planner
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.hype_catalog_items (
    item_id BIGSERIAL PRIMARY KEY,
    budget_partition VARCHAR(20) NOT NULL DEFAULT 'CITY_SPECIFIC', -- 'CITY_SPECIFIC' | 'COMMON'
    area_code INT NOT NULL,                                         -- 1: 서울, 6: 부산, 39: 제주 등
    main_category VARCHAR(50) NOT NULL DEFAULT 'Sightseeing',      -- 'Sightseeing', 'Food', etc.
    sub_category VARCHAR(50) NOT NULL DEFAULT 'Attraction',        -- 'Attraction', 'Heritage', 'Market', etc.
    content_id VARCHAR(50) UNIQUE,                                 -- KTO OpenAPI contentid 중복 방지 고유키
    title_en VARCHAR(255) NOT NULL,
    desc_en TEXT NOT NULL,
    price_krw INT NOT NULL DEFAULT 0,                              -- 무료 명소는 0
    image_url TEXT NOT NULL DEFAULT '/assets/default-place.jpg',
    deep_link_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 설정 (빠른 도시/카테고리별 조회 및 0.1초 인스턴트 로드 보장)
CREATE INDEX IF NOT EXISTS idx_hype_catalog_items_city_cat 
ON public.hype_catalog_items (area_code, main_category, budget_partition);

CREATE INDEX IF NOT EXISTS idx_hype_catalog_items_content_id 
ON public.hype_catalog_items (content_id);

-- RLS (Row Level Security) 설정 및 조회 권한 부여
ALTER TABLE public.hype_catalog_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hype_catalog_items' AND policyname = 'Allow public read access on hype_catalog_items'
  ) THEN
    CREATE POLICY "Allow public read access on hype_catalog_items" 
    ON public.hype_catalog_items 
    FOR SELECT 
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hype_catalog_items' AND policyname = 'Allow service_role full access on hype_catalog_items'
  ) THEN
    CREATE POLICY "Allow service_role full access on hype_catalog_items" 
    ON public.hype_catalog_items 
    FOR ALL 
    USING (auth.role() = 'service_role');
  END IF;
END $$;
