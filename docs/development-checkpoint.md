# HypeHeritage 마이그레이션 다음 작업 체크포인트 (Development Checkpoint)

HypeHeritage Next.js App Router 전환 마이그레이션 프로젝트의 오늘 개발 작업을 안전하게 마감하고, 다음 개발자가 작업을 이어서 재개할 수 있도록 핵심 체크포인트 상태를 기록합니다.

---

## 1. 기본 정보 (Basic Information)
*   **작성일**: 2026-07-16
*   **현재 작업 Branch**: `migration-nextjs`
*   **현재 커밋 HEAD**: `b7f086f958dfa771107fc3d5630610cf23c50f31`
*   **현재 기술 스택 (Tech Stack)**:
    *   Next.js 16.2.10 (App Router)
    *   React 19.2.4
    *   TypeScript 5.x (Strict Mode)
    *   Tailwind CSS 4.x
    *   ESLint 9.x (Strict React & Hooks Lint)

---

## 2. 완료한 단계 및 주요 기능 (Completed Milestones)

1.  **Next.js migration foundation**:
    *   기존 정적 HTML 리소스를 `legacy_prototype/`에 안전하게 보존하고 Next.js 최신 개발/빌드 환경을 구축 완료했습니다.
2.  **Localized AppShell**:
    *   한국어(`ko`) 및 영어(`en`) 로캘 SSR 라우팅 시스템과 [locales.ts](file:///c:/Users/TEST/Desktop/K-travel%20Budget/src/lib/i18n/locales.ts) 유틸, 타입 안정성을 보장하는 다국어 번역 사전(`ko.ts`, `en.ts`)을 구현했습니다.
    *   내비게이션이 viewport 전체 기준 절대 중앙에 정렬되는 Header와 Footer AppShell을 연계했습니다.
3.  **Minimal Landing**:
    *   구글 검색 홈 스타일처럼 넉넉한 여백과 화이트 카드를 활용한 세로 중심 정렬의 심플한 랜딩 레이아웃을 이식했습니다.
4.  **English fixed Mad-libs**:
    *   모든 로캘 환경에서 영어 문법 구조와 셀렉터 레이블이 고정되는 Mad-libs 입력 폼을 연동했습니다. (BUDGET 등급 시 `on a Budget plan.`, 그 외 `with a ... budget.` 문법 매핑 처리 완료)
5.  **TripDraft**:
    *   도메인 모델 스펙([trip-domain.ts](file:///c:/Users/TEST/Desktop/K-travel%20Budget/src/lib/trip-domain.ts))을 작성하여 숙박일(3/5/7), 인원(1~4), 도시 및 자동 균등 배분(서울/부산 동시 선택 시 올림/내림 배분), 예산 등급, 고정 목표 예산(₩3,000,000)을 엄격히 정의하고 검증 로직을 무결히 바인딩했습니다.
6.  **versioned localStorage**:
    *   `schemaVersion: 1`, `savedAt` 타임스탬프를 적용하는 `hypeheritage_trip_draft` 로컬스토리지 envelope 포맷을 탑재했습니다.
7.  **legacy state migration**:
    *   브라우저에 기존 `k_travel_state` 가 있을 경우 사용자 입력값을 새 스키마 형식으로 자동 이관하며, 원본 legacy 데이터는 삭제하지 않고 유지합니다. (flightCost 등 파생 비용은 이관에서 엄격히 차단)

---

## 3. 로컬 실행 및 검증 명령어 (Execution Commands)
*   의존성 패키지 설치: `npm install`
*   로컬 개발 서버 구동: `npm run dev`
*   정적 코드 린트 분석: `npm run lint`
*   TypeScript 타입 체크: `npm run typecheck`
*   프로덕션 최적화 빌드: `npm run build`

---

## 4. 라우팅 구조 및 데이터 스토리지 (Route & Storage)
*   **지원하는 Route 목록**:
    *   `/` ➔ `/ko` 로 Next.js 엔진 레벨 308 영구 리다이렉트 포워딩
    *   `/[locale]` (미니멀 랜딩 폼)
    *   `/[locale]/planner` (로컬스토리지 조건 미존재 시 랜딩 복귀 복원 링크 및 조건 요약 제공)
    *   `/[locale]/trend` (다국어 대응 placeholder)
    *   `/[locale]/guide` (다국어 대응 placeholder)
    *   `/[locale]/saved-trips` (다국어 대응 placeholder)
*   **로컬스토리지 Key**:
    *   신규 규격 Key: `hypeheritage_trip_draft`
    *   레거시 규격 Key: `k_travel_state`

---

## 5. 현재 알려진 제한사항 (Known Constraints)
1.  **Hydration Gate에 의한 초기 렌더링 시프트**:
    *   서버 렌더와 클라이언트 Hydration mismatch를 막기 위해 `useSyncExternalStore` 기반 Hydration Gate 패턴을 도입하여 마운트 전에는 정적 비활성 기본 폼을 보이고 마운트 완료 후 로컬스토리지 데이터를 바인딩합니다. 이 과정에서 화면 데이터가 미세하게 로컬 상태로 스왑되는 동작이 관찰될 수 있습니다.
2.  **Cloudflare Adapter 미확정**:
    *   `@opennextjs/cloudflare` 와 Workers가 유력 타겟이나 공식 가이드 URL의 404 반환에 따라 호환성 및 어댑터 버전은 배포 단계에서 검증이 더 필요합니다.
3.  **Supabase 미연결**: 인증 및 DB 스키마 바인딩은 대기 상태입니다.
4.  **Planner 플레이스홀더 상태**: 플래너 뷰는 마이그레이션된 조건 요약 및 랜딩 유도 링크만 들어있는 플레이스홀더 상태입니다.
5.  **실제 가격 데이터 미연결**: Budget Basket을 계산하기 위한 카탈로그 정보 및 환율 연동이 없습니다.

---

## 6. 다음 시작 작업 및 핵심 원칙 (Next Milestone)
*   **다음 작업**: `6단계 Budget Basket 계산 엔진` 마이그레이션
*   **핵심 원칙**:
    *   UI 레이아웃 구축을 진행하기 전에 **순수 계산 엔진 비즈니스 로직(Calculation Engine)**을 우선 구현하고 테스트합니다.
    *   사용될 카탈로그 정보는 목데이터(`MOCK`)임을 코드 내에 명확히 주석/상수 명시합니다.
    *   항공비(`flightCost`)는 계산에서 철저히 제외합니다.
    *   도시별 예산 소계(seoul total, busan total) + 도시 간 KTX 이동 비용 + 전체 공통 비용 = 전체 합계(finalTotal)가 도출되도록 계산 불변식을 통제합니다.
    *   작업 진행 중 임의로 자동 commit, push, merge, deploy를 수행하지 않습니다.

---

## 7. 재개 전 확인 절차 (Pre-resume Checklist)
1.  `git checkout migration-nextjs` 브랜치 확인
2.  `git pull`을 자동 실행하기 전 `git status` 및 원격 remote 상태부터 확인
3.  로컬 working tree가 깨끗한 상태(clean)인지 확인
4.  `npm install` 을 구동해 최신 패키지 무결성 확보
5.  `npm run lint`, `npm run typecheck`, `npm run build`를 순서대로 실행해 기초 빌드가 깨끗하게 성공하는지 선검증
