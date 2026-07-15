# Cloudflare Deployment Plan (Cloudflare 배포 계획)

HypeHeritage Next.js 애플리케이션을 Cloudflare 인프라에 배포하기 위해 2026년 공식 가이드라인을 근거로 조사한 배포 아키텍처 및 설정 계획입니다.

---

## 1. 프로젝트 요구사항 및 Static Export 부적합성

HypeHeritage는 장기적으로 다음 요구사항들을 충족해야 합니다:
*   **Supabase SSR Authentication**: 쿠키 및 세션 정보가 실시간으로 서버(Edge) 측에서 유효성 검증을 거쳐야 함.
*   **Server-side Entitlement Verification**: 사용자의 유료 리포트(Paid One-Stop Report) 구매 여부를 서버 단에서 차단/인가해야 함.
*   **Dynamic Shared Report Routes**: `/[locale]/report/[tripId]` 경로 등 동적 tripId 세그먼트에 따른 SSR 보고서 생성.
*   **API or Server Endpoints / Payment Callback Handling**: 외부 결제 콜백 웹훅 수신 및 데이터베이스 검증 처리.
*   **Affiliate Redirect and Analytics**: 서버 단에서의 리다이렉트 제어 및 분석 로깅.

따라서 빌드 시점에 정적 HTML/CSS/JS 파일만 빌드하는 **Static Export (SSG) 방식은 위 요구사항을 전혀 충족할 수 없으므로 부적합**하며, 반드시 Edge Runtime 상에서 실행되는 동적 SSR 빌드 어댑터가 요구됩니다.

---

## 2. Cloudflare 공식 배포 방식 조사 결과 (2026년 기준)

*   **공식 출처**: [Cloudflare Next.js Framework Guide](https://developers.cloudflare.com/workers/framework-guides/web-applications/nextjs/)
*   **확인일**: 2026-07-15
*   **최종 권장 배포 아키텍처**: **`@opennextjs/cloudflare` 어댑터 + Cloudflare Workers 타겟 배포**

### 이전 권장안 (@cloudflare/next-on-pages)의 정정
*   과거에 사용되던 `@cloudflare/next-on-pages`는 Vercel Build Output API 규격을 파싱하여 Pages로 매핑하는 구조였으나 Edge 환경에서의 Node.js API 제약이 컸습니다.
*   2026년 현재 Cloudflare의 공식 표준 가이드는 오픈소스 프로젝트인 **OpenNext의 Cloudflare 어댑터 (`@opennextjs/cloudflare`)**를 활용하여 **Cloudflare Workers**로 올리는 구조를 단독 표준으로 제시하고 있습니다. 이에 따라 이전 보고서의 `@cloudflare/next-on-pages` 권장을 공식적으로 **정정**합니다.

### Next.js 16.2.10 호환성 수준
*   `@opennextjs/cloudflare`는 App Router, Server Actions, Partial Prerendering(PPR) 등 최신 Next.js 15, 16 명세를 전방위적으로 지원하기 위해 Cloudflare 공식 인프라 팀과 커뮤니티가 긴밀히 협력해 고도화하고 있습니다.
*   Node.js 호환성 요구사항 해결을 위해 `wrangler.toml` (또는 `wrangler.json`) 내에 `compatibility_flags = [ "nodejs_compat" ]` 플래그 설정이 필수적입니다.

---

## 3. 향후 적용을 위한 설치 및 Fallback 전략

이번 단계에서는 Cloudflare 관련 어떠한 패키지(`wrangler`, `@opennextjs/cloudflare` 등)도 설치하지 않으며 설정 파일도 생성하지 않습니다. 추후 단계 돌입 시 다음 순서로 구축을 시작합니다:

### 다음 배포 구축 단계
1.  프로젝트 루트에 wrangler 구성 파일 생성.
2.  `@opennextjs/cloudflare` 개발 의존성 설치.
3.  `package.json` 내에 wrangler 로컬 프록시 테스트 및 빌드 스크립트 결합.
    ```json
    "build:cloudflare": "opennextjs-cloudflare",
    "preview:cloudflare": "wrangler dev"
    ```

### 미확정 위험 및 Fallback 전략
*   **위험**: Next.js 16의 일부 마이너 패치 릴리즈 시점과 OpenNext AST 파서의 불일치로 인한 빌드 타임 컴파일 오류 위험이 잔존합니다.
*   **Fallback 전략**:
    1.  빌드 타입 이슈 발생 시 빌드가 완전 보장되는 직전 안정 마이너 버전(예: Next.js 15.x LATEST)으로 package.json 버전을 고정하여 롤백합니다.
    2.  서버리스 제한으로 인한 edge computing 실패 영역이 발생할 경우, 해당 특정 로직만 Supabase Edge Functions(Deno base) 또는 독립 Webhook 서버로 격리하여 배포 아웃풋 크기를 낮춥니다.
