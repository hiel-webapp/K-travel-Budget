# Localization Policy (다국어화 및 로컬라이제이션 정책)

HypeHeritage는 글로벌 사용자를 대상으로 다국어 환경을 제공하며, 비즈니스 신뢰성을 위해 엄격하고 통일된 로컬라이제이션 규칙을 준수합니다.

---

## 1. 기본 정책

1.  **지원 Locale**: `ko` (한국어), `en` (영어)
2.  **기본 Locale**: `ko`
3.  **번역 딕셔너리 구조**:
    *   외부 i18n 패키지 의존성 없이 TypeScript 사전 파일(`src/lib/i18n/dictionaries/ko.ts`, `en.ts`)을 이용해 정적 타입을 보장합니다.
    *   컴파일 타임에 모든 번역 키의 1:1 대응 관계를 엄격히 감시하며, 번역 누락 시 조용히 빈 문자열을 노출하지 않고 타입 에러를 통해 배포 전 발견하도록 강제합니다.
4.  **UI 문자열과 비즈니스 데이터 분리**:
    *   각 번역 사전은 UI 프레젠테이션 텍스트만 관리합니다.
    *   데이터베이스 테이블 구조, API 필드, 비즈니스 예산 계산 로직에서 반환되는 고유 식별자나 DB 데이터는 번역 사전에 저장하지 않고 원형을 유지합니다.

---

## 2. 라우팅 및 URL Helper 규칙

1.  **Locale Path 규칙**:
    *   모든 로케일별 화면은 `src/app/[locale]/` 하위에 구성됩니다.
    *   `/` 경로 진입 시 Next.js 리다이렉션을 통하여 기본값인 `/ko`로 강제 이동합니다.
    *   지원하지 않는 로케일 세그먼트가 감지될 경우, 핸들러에서 안전하게 Next.js `notFound()` 404 처리를 수행합니다.
    *   **Root Redirect 방식 (308 Permanent Redirect)**:
        *   현재 `next.config.ts` 설정을 기반으로 루트 경로(`/`)에 진입 시 default locale인 `/ko`로 즉각 리다이렉트 시키며, `permanent: true`를 선언하여 **308 Permanent Redirect** 응답 코드를 반환합니다.
        *   이는 검색 엔진 크롤러에게 로케일 경로가 캐노니컬 소스(Canonical Source)임을 명시하여 검색 지수 및 SEO 점수를 정적이고 강력하게 축적하기에 이상적인 구조입니다.
        *   **향후 과제 (재검토 대상)**: 차후 브라우저 기본 언어 감지(Browser-Language Detection) 또는 쿠키/DB 기반 저장 로캘(Saved-locale) 분기 정책을 도입할 시, 브라우저가 `/` 접속 결과를 308 캐싱해 버리는 오작동을 피하기 위해 `permanent: false` (307 Temporary Redirect)로 완화하거나, `middleware.ts` 레벨에서의 동적 제어 방식으로 전면 리팩토링이 필요합니다.
2.  **Locale Switcher URL 보존**:
    *   언어 스위치(KO / EN) 클릭 시 현재 페이지의 라우트 경로와 Query String을 안전하게 보존하여 언어만 부드럽게 교체합니다.
    *   이를 전담하는 [locales.ts](file:///c:/Users/TEST/Desktop/K-travel%20Budget/src/lib/i18n/locales.ts)의 `getLocalizedPath` 함수를 전역 Helper로 공용합니다.
    *   `Locale switching currently preserves the pathname and query string. Hash preservation is deferred until a page requires hash-based navigation.`
    *   *(한국어 요약)* 현재 언어 전환 헬퍼는 경로명과 쿼리 스트링의 완벽한 유지를 보장합니다. 해시(Hash)값은 SSR 단계와의 정합성 및 복잡성을 고려하여, 향후 해시 기반의 인 페이지 내비게이션 요구사항이 구체화될 때까지 보존 처리를 유예합니다.

---

## 3. Mad-libs 영어 고정 예외 규칙 (Mad-libs Localization Exception)

HypeHeritage 랜딩 페이지의 핵심 UI인 Mad-libs 입력 필드에는 글로벌 UX 브랜딩 및 자연스러운 조건 구성을 위해 특별한 번역 예외 규칙을 부여합니다.

1.  **영어 문장 구조 고정 및 딕셔너리 분리**:
    *   랜딩 페이지의 Mad-libs 문장의 영문법 구조는 **어떤 로케일(한국어 설정 포함)에서도 영어로 고정**합니다.
    *   이 문장의 문법적 뼈대(Sentence Shell) 및 옵션들의 영문 노출 레이블은 일반 다국어 번역 딕셔너리(`ko.ts`, `en.ts`)에서 명시적으로 제외되며, 하드코딩되지 않는 도메인 모델 상수 매핑 구조(`src/lib/trip-domain.ts` 등)를 통해 런타임에 직접 조합됩니다.
    *   선택된 도시, 숙박일, 인원, 예산 등급 등의 내부 상태(Enum 값)와 영문 표시 레이블(display label)을 확실히 분리하여 영문법 상의 단수/복수 규칙(`1 adult` / `2 adults`), 형용사화(`5-night`) 등을 정확히 준수합니다.
2.  **고정 영문 뼈대**:
    > `I'm planning a [nights]-night trip for [people] adults to [cities] with a [budgetType] budget.`
3.  **UI 레이블과 데이터 값의 분리**:
    *   문장 속 드롭다운 목록이나 입력 제어기 내의 선택 항목은 로케일에 따라 적절한 레이블을 보여줄 수 있으나, 컨트롤 외부의 문장 구조 자체는 영어 문법 형식을 변함없이 유지해야 합니다.
    *   일반 랜딩 페이지의 타이틀, 설명 문구, 안내 헬퍼 텍스트, 예산 생성 버튼 등은 로케일에 맞춰 정상 번역됩니다.

---

## 4. 숫자, 통화, 날짜 포맷터 원칙

각 로케일에 따라 사용자가 가격과 날짜를 오해하지 않도록 브라우저 표준 API인 `Intl` 객체를 기반으로 통화 및 날짜 형식을 제공합니다.

1.  **원화 (KRW) 표시**:
    *   한국어(`ko`): `15,000원` 형식 사용 (Intl 포맷 또는 수동 원 템플릿 사용)
    *   영어(`en`): `₩15,000` 또는 `15,000 KRW` 명시 (글로벌 여행자가 가격 단위를 혼동하지 않도록 함)
2.  **달러화 (USD) 표시**:
    *   한국어(`ko`): `$10.50` 또는 `10.50 USD` 표시
    *   영어(`en`): `$10.50` 표시
3.  **날짜 형식 (Date Formatting)**:
    *   한국어(`ko`): `YYYY년 MM월 DD일`
    *   영어(`en`): `MMM DD, YYYY` (예: `Jul 15, 2026`)
