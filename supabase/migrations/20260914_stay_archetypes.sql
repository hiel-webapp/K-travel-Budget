-- ==============================================================================
-- Migration: Define & UPSERT 4-Tier Accommodation Archetypes in hype_catalog_items
-- ==============================================================================

-- 1. Ensure unique constraint on (area_code, main_category, sub_category) or content_id
-- We use content_id as the stable archetype key (e.g. 'stay_archetype_1_hostel')

INSERT INTO public.hype_catalog_items (
    budget_partition,
    area_code,
    main_category,
    sub_category,
    content_id,
    title_en,
    desc_en,
    price_krw,
    image_url,
    deep_link_template
)
VALUES
-- SEOUL (area_code = 1)
(
    'CITY_SPECIFIC',
    1,
    'Stay',
    'Hostel_Guesthouse',
    'stay_archetype_1_hostel',
    'K-Vibe Hostel & Guesthouse',
    'Social dorms and cozy guesthouses for budget backpackers.',
    40000,
    '/assets/stays/hostel.jpg',
    'https://www.agoda.com/search?city={city_id}&priceCur=KRW&maxPrice=55000&tag=hypeheritage'
),
(
    'CITY_SPECIFIC',
    1,
    'Stay',
    'Business_Hotel',
    'stay_archetype_1_business',
    'Urban Business & Modern Hotel',
    'Clean, private, and transit-accessible standard hotel rooms.',
    120000,
    '/assets/stays/business_hotel.jpg',
    'https://www.agoda.com/search?city={city_id}&priceCur=KRW&minPrice=80000&maxPrice=160000&tag=hypeheritage'
),
(
    'CITY_SPECIFIC',
    1,
    'Stay',
    'Hanok_Boutique',
    'stay_archetype_1_hanok',
    'K-Heritage Hanok & Boutique Stay',
    'Authentic traditional hanok architecture or trendy boutique rooms.',
    240000,
    '/assets/stays/hanok.jpg',
    'https://www.airbnb.com/s/{city_name}/homes?property_type_id=hanok&tag=hypeheritage'
),
(
    'CITY_SPECIFIC',
    1,
    'Stay',
    'Luxury_Skyline',
    'stay_archetype_1_luxury',
    'Luxury & Skyline 5-Star Hotel',
    'World-class hospitality, premium wellness, and panoramic skyline views.',
    450000,
    '/assets/stays/luxury.jpg',
    'https://www.agoda.com/search?city={city_id}&priceCur=KRW&minPrice=350000&tag=hypeheritage'
),

-- BUSAN (area_code = 6)
(
    'CITY_SPECIFIC',
    6,
    'Stay',
    'Hostel_Guesthouse',
    'stay_archetype_6_hostel',
    'Busan Beachside Hostel & Guesthouse',
    'Social dorms and cozy guesthouses near Haeundae and Gwangalli.',
    35000,
    '/assets/stays/hostel.jpg',
    'https://www.agoda.com/search?city={city_id}&priceCur=KRW&maxPrice=50000&tag=hypeheritage'
),
(
    'CITY_SPECIFIC',
    6,
    'Stay',
    'Business_Hotel',
    'stay_archetype_6_business',
    'Busan Urban Business & Ocean View Hotel',
    'Clean, private hotel rooms near metro stations and beaches.',
    110000,
    '/assets/stays/business_hotel.jpg',
    'https://www.agoda.com/search?city={city_id}&priceCur=KRW&minPrice=75000&maxPrice=150000&tag=hypeheritage'
),
(
    'CITY_SPECIFIC',
    6,
    'Stay',
    'Hanok_Boutique',
    'stay_archetype_6_hanok',
    'Coastal Boutique & Heritage Pension',
    'Unique coastal boutique stays and private heritage villas.',
    220000,
    '/assets/stays/hanok.jpg',
    'https://www.airbnb.com/s/{city_name}/homes?tag=hypeheritage'
),
(
    'CITY_SPECIFIC',
    6,
    'Stay',
    'Luxury_Skyline',
    'stay_archetype_6_luxury',
    'Haeundae Luxury Ocean 5-Star Resort',
    'World-class hospitality with panoramic sea and skyline views.',
    420000,
    '/assets/stays/luxury.jpg',
    'https://www.agoda.com/search?city={city_id}&priceCur=KRW&minPrice=300000&tag=hypeheritage'
),

-- JEJU (area_code = 39)
(
    'CITY_SPECIFIC',
    39,
    'Stay',
    'Hostel_Guesthouse',
    'stay_archetype_39_hostel',
    'Jeju Olle Trail Guesthouse & Hostel',
    'Cozy island guesthouses and social dorms for nature lovers.',
    35000,
    '/assets/stays/hostel.jpg',
    'https://www.agoda.com/search?city={city_id}&priceCur=KRW&maxPrice=50000&tag=hypeheritage'
),
(
    'CITY_SPECIFIC',
    39,
    'Stay',
    'Business_Hotel',
    'stay_archetype_39_business',
    'Jeju City & Seogwipo Tourist Hotel',
    'Accessible standard hotel rooms convenient for island travel.',
    105000,
    '/assets/stays/business_hotel.jpg',
    'https://www.agoda.com/search?city={city_id}&priceCur=KRW&minPrice=70000&maxPrice=140000&tag=hypeheritage'
),
(
    'CITY_SPECIFIC',
    39,
    'Stay',
    'Hanok_Boutique',
    'stay_archetype_39_hanok',
    'Jeju Stone Hanok & Private Pool Villa',
    'Traditional Jeju stone cottages and aesthetic boutique pensions.',
    250000,
    '/assets/stays/hanok.jpg',
    'https://www.airbnb.com/s/{city_name}/homes?tag=hypeheritage'
),
(
    'CITY_SPECIFIC',
    39,
    'Stay',
    'Luxury_Skyline',
    'stay_archetype_39_luxury',
    'Jeju Luxury 5-Star Island Resort',
    'Premium wellness, infinity pools, and ocean panoramic views.',
    460000,
    '/assets/stays/luxury.jpg',
    'https://www.agoda.com/search?city={city_id}&priceCur=KRW&minPrice=350000&tag=hypeheritage'
)
ON CONFLICT (content_id) DO UPDATE SET
    budget_partition = EXCLUDED.budget_partition,
    area_code = EXCLUDED.area_code,
    main_category = EXCLUDED.main_category,
    sub_category = EXCLUDED.sub_category,
    title_en = EXCLUDED.title_en,
    desc_en = EXCLUDED.desc_en,
    price_krw = EXCLUDED.price_krw,
    image_url = EXCLUDED.image_url,
    deep_link_template = EXCLUDED.deep_link_template;
