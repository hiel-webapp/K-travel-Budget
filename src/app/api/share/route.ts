import { NextResponse } from "next/server";

// 서버 글로벌 캐시 (동일 인스턴스/Worker 내 메모리 보관)
const globalShareCache = new Map<string, { draft: any; preferences: any; createdAt: number }>();

function generateShortId(length = 6): string {
  const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { draft, preferences } = body;

    if (!draft) {
      return NextResponse.json({ success: false, error: "Missing draft" }, { status: 400 });
    }

    // 6자리 단축 ID 생성
    let shareId = generateShortId(6);
    let attempts = 0;
    while (globalShareCache.has(shareId) && attempts < 5) {
      shareId = generateShortId(6);
      attempts++;
    }

    globalShareCache.set(shareId, {
      draft,
      preferences: preferences || null,
      createdAt: Date.now(),
    });

    // 캐시 정리: 10,000개 초과 시 오래된 항목 제거
    if (globalShareCache.size > 10000) {
      const oldestKey = globalShareCache.keys().next().value;
      if (oldestKey) globalShareCache.delete(oldestKey);
    }

    return NextResponse.json({
      success: true,
      shareId,
    });
  } catch (err: any) {
    console.error("[API/Share] POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("id");

    if (!shareId) {
      return NextResponse.json({ success: false, error: "Missing shareId" }, { status: 400 });
    }

    const data = globalShareCache.get(shareId);
    if (!data) {
      return NextResponse.json({ success: false, error: "Share not found or expired" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        draft: data.draft,
        preferences: data.preferences,
      },
    });
  } catch (err: any) {
    console.error("[API/Share] GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
