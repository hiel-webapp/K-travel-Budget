import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPin, updateAdminPin } from "../../../../lib/admin/admin-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, pin, currentPin, newPin } = body;

    // 1. PIN 검증 (로그인 시)
    if (action === "VERIFY") {
      if (!pin) {
        return NextResponse.json({ success: false, error: "PIN 번호를 입력해주세요." }, { status: 400 });
      }

      const isValid = await verifyAdminPin(pin);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "관리자 PIN 번호가 일치하지 않습니다." }, { status: 401 });
      }

      return NextResponse.json({ success: true });
    }

    // 2. PIN 변경
    if (action === "CHANGE_PIN") {
      if (!currentPin || !newPin) {
        return NextResponse.json({ success: false, error: "현재 PIN과 새 PIN을 모두 입력해주세요." }, { status: 400 });
      }

      const isCurrentValid = await verifyAdminPin(currentPin);
      if (!isCurrentValid) {
        return NextResponse.json({ success: false, error: "현재 PIN 번호가 일치하지 않습니다." }, { status: 401 });
      }

      if (newPin.trim().length < 4) {
        return NextResponse.json({ success: false, error: "새 PIN 번호는 최소 4자리 이상이어야 합니다." }, { status: 400 });
      }

      await updateAdminPin(newPin.trim());
      return NextResponse.json({ success: true, message: "관리자 PIN 코드가 성공적으로 변경되었습니다." });
    }

    return NextResponse.json({ success: false, error: "유효하지 않은 요청(action)입니다." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "서버 오류" }, { status: 500 });
  }
}
