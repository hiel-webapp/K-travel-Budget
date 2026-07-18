export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * Locale을 변경하면서 현재 경로, 쿼리, 해시를 유지하는 URL을 생성합니다.
 */
export function getLocalizedPath(
  currentPath: string,
  targetLocale: Locale,
  searchParams?: string,
  hash?: string
): string {
  const segments = currentPath.split("/");
  
  // 첫 번째 세그먼트가 지원되는 locale(ko, en) 중 하나인지 확인하고 교체
  if (segments.length > 1 && (segments[1] === "ko" || segments[1] === "en")) {
    segments[1] = targetLocale;
  } else {
    // locale 세그먼트가 없는 경로인 경우 (예: /)
    segments.splice(1, 0, targetLocale);
  }
  
  let newPath = segments.join("/") || "/";
  
  // 쿼리 매개변수 유지
  if (searchParams) {
    const cleanParams = searchParams.startsWith("?") ? searchParams : `?${searchParams}`;
    newPath += cleanParams;
  }
  
  // 해시값 유지
  if (hash) {
    const cleanHash = hash.startsWith("#") ? hash : `#${hash}`;
    newPath += cleanHash;
  }
  
  return newPath;
}
