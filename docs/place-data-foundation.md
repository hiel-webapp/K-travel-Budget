# Place Data Foundation Document (1차 및 2차 구현 완료)

## 1. Place DB의 목적 및 역할

HypeHeritage 프로젝트의 기본 원칙은 **"Plan by type first. Choose a specific place later."** 입니다.

- **Budget Engine과의 분리 원칙:** 여행 예산 산출(Budget Engine)은 1인/1박당 기준 금액(Basket Representative Price) 기반으로 독립 계산되며, 실제 장소 DB(Place DB)의 수집 여부가 예산 산출 로직을 직접 변경하지 않습니다.
- **Place DB의 역할:** 사용자가 예산 플랜을 생성한 후, 또는 상세 리포트(Paid One-Stop Report)에서 예산대별 실제 숙소·음식점·관광지·문화시설 후보를 탐색하고 비교할 수 있도록 신뢰할 수 있는 장소 데이터를 저장 및 수집하는 역할을 담당합니다.

---

## 2. 관광공사 OpenAPI (KTO) 국문/영문 역할 분리

HypeHeritage는 다국어(한국어/영어) 사용자 환경을 지원하므로 한국관광공사(KTO) Tour API를 국문과 영문으로 나누어 수집 및 연동합니다.

1. **KorService2 (국문 관광정보 API)**
   - 역할: 국내 원천 장소명(`title`), 주소(`addr1`), 국문 개요(`overview`), 상세 정보 및 원본 분류 정보 수집 (`areaBasedList2`, `detailCommon2`)
   - 원천 식별자: `KTO_KOR`

2. **EngService2 (영문 관광정보 API)**
   - 역할: 해외 여행자를 위한 영문 장소명(`title`), 영문 주소(`addr1`), 영문 개요(`overview`) 수집 (`detailCommon2`)
   - 원천 식별자: `KTO_ENG`
   - 매핑 방식: 동일한 `contentid`를 기반으로 `places` 마스터 테이블과 `place_translations` (`locale: 'en'`) 테이블에 연동 저장

---

## 3. 환경변수 및 보안 가이드

서버 전용 환경변수를 참조하며 브라우저에 절대로 노출되거나 클라이언트 묶음에 포함되지 않습니다.

- `SUPABASE_URL`: Supabase 프로젝트 접속 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase PostgREST 서버 전용 Service Role Key
- `KTO_API_KEY`: 한국관광공사 OpenAPI Decoding 공통 일반 인증키
- `KTO_MOBILE_APP`: 관광공사 API 호출 시 전달할 앱 식별자 (`HypeHeritage`)

> **[보안 주의사항]**
> `KTO_API_KEY` 및 `SUPABASE_SERVICE_ROLE_KEY`는 절대로 Git 저장소, 소스코드, 커밋 로그, 채팅창에 노출해서는 안 되며, 오직 프로젝트 루트의 `.env.local` 파일에서만 보관해야 합니다.

---

## 4. 초기 수집 대상 및 서비스 카테고리 범주

- **초기 대상 도시:** `SEOUL` (서울, areacode=1), `BUSAN` (부산, areacode=6)
- **수집 대상 카테고리:**
  - `ACCOMMODATION` (숙소: KOR 32 / ENG 32)
  - `RESTAURANT` (음식점: KOR 39 / ENG 39)
  - `CAFE` (카페: cat3 소분류 `A05020900` 등 또는 장소명에 카페 키워드 포함 시 판별)
  - `ATTRACTION` (관광지: KOR 12 / ENG 76)
  - `CULTURE` (문화시설: KOR 14 / ENG 78)

---

## 5. 데이터 정규화 및 멱등성 (Idempotency)

- **수집 제외 (Exclude):** 장소명(`title`) 또는 콘텐츠 ID(`contentid`)가 없거나, 서울·부산 이외의 지역 데이터는 수집에서 제외합니다.
- **품질 상태 (Quality Status):**
  - `READY`: 장소명, 대표 이미지, 좌표(위경도), 개요 설명이 모두 정상 등록된 데이터
  - `INCOMPLETE`: 좌표, 이미지, 설명 중 일부분이 누락된 데이터 (수집에서 즉시 삭제하지 않고 상태 기록)
  - `REVIEW_REQUIRED`: 분류(음식점 vs 카페)가 확실하지 않거나 자동 매핑 검토가 필요한 데이터
- **멱등성 보장:** `places` 테이블의 `(content_id, source_name)` 유니크 제약 조건을 통해 동일 장소를 여러 번 수집하더라도 중복 등록되지 않고 안전하게 업데이트됩니다.

---

## 6. 수집 스크립트 실행 명령 가이드

수집 실행 전 프로젝트 루트 `.env.local` 파일 생성이 완료되어 있어야 합니다.
PowerShell 환경에서는 `--env-file=.env.local` 옵션과 `npx.cmd tsx`를 사용하는 것을 권장합니다.

### 1) 첫 시뮬레이션 (Dry-Run) 명령 (반드시 첫 실호출 전 먼저 실행)
실제 Supabase DB에 쓰기를 하지 않고 수집 및 정규화 건수만 시뮬레이션합니다. 첫 수집 전 반드시 Dry-run을 실행하여 API 키 설정과 파라미터 조합이 정상 작동하는지 먼저 점검합니다.
```powershell
# Windows PowerShell (Dry-run 권장)
$env:KTO_INGEST_DRY_RUN="true"; $env:KTO_INGEST_CITY="SEOUL"; $env:KTO_INGEST_LIMIT="10"; npx.cmd tsx --env-file=.env.local scripts/ingest-kto-places.ts
```

### 2) 진단 (Debug) Dry-Run 명령 (0건 수집 시 원인 분석용)
수집 건수가 0건으로 나오거나 응답 구조 및 응답 상태를 상세히 확인해야 할 때 실행합니다. `serviceKey`, API 키, 전체 URL query string, 원본 Body 등 보안 비밀값은 노출하지 않고 안전한 파라미터와 HTTP/KTO 상태 정보만 콘솔에 출력합니다.
```powershell
# Windows PowerShell (진단 모드 Dry-run)
$env:KTO_INGEST_DRY_RUN="true"; $env:KTO_INGEST_DEBUG="true"; $env:KTO_INGEST_CITY="SEOUL"; $env:KTO_INGEST_LIMIT="10"; npx.cmd tsx --env-file=.env.local scripts/ingest-kto-places.ts
```

### 3) 첫 실제 수집 명령
기본 설정(서울, 카테고리별 최대 10개)으로 실제 관광공사 API를 호출하여 Supabase DB에 수집합니다.
> **주의:** 4개 카테고리 모두 0건이 반환되는 경고가 표시될 경우, 실제 수집 명령을 실행하지 말고 위의 진단(Debug) Dry-run 결과를 먼저 확인하십시오.

```powershell
# Windows PowerShell
$env:KTO_INGEST_DRY_RUN="false"; $env:KTO_INGEST_CITY="SEOUL"; $env:KTO_INGEST_LIMIT="10"; npx.cmd tsx --env-file=.env.local scripts/ingest-kto-places.ts
```

---

## 7. 수집 오류 및 보안 문제 대응 지침

1. **오류 트러블슈팅 및 디버그 실행 시 키 절대 공유 금지**
   - KTO API 호출 실패(HTTP 500, 4xx, 공공데이터 포털 에러 등) 또는 0건 수집 트러블슈팅 시 `KTO_API_KEY`나 `.env.local`의 키 값을 절대로 공개 채널, 로그, 커밋 메시지, 이슈 트래커에 공유하지 마십시오.
   - `KTO_INGEST_DEBUG=true` 디버그 출력 로그는 `serviceKey`, API 키, 전체 URL, 원문 응답 Body를 노출하지 않도록 안전하게 정제되어 제공됩니다.
   - 오류 로그에 출력되는 **안전한 오류 코드(`Code: XX`) 및 메시지(`Msg: ...`)** 정보만 확인하고 대응하십시오.

2. **수집 완료 후 Supabase Table Editor 확인 항목**
   - **`places`**: `city` ('SEOUL'), `category`, `quality_status`, `content_id` 등록 여부 확인
   - **`place_translations`**: 동일한 `place_id`에 대해 `locale` ('ko', 'en') 별 장소명 및 설명 입력 여부 확인
   - **`ingestion_runs`**: `status` ('COMPLETED' / 'FAILED'), `total_fetched`, `total_inserted`, `total_updated`, `error_message` 처리 이력 확인
