import { NextRequest, NextResponse } from "next/server";
import {
  getAdminPresets,
  createAdminPreset,
  updateAdminPreset,
  deleteAdminPreset,
  reorderAdminPresets,
  resetAdminPresets,
} from "../../../../lib/admin/admin-store";
import { TravelPreset } from "../../../../lib/presets/travel-presets";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") !== "false";
    const presets = await getAdminPresets(includeInactive);
    return NextResponse.json({ success: true, presets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "REORDER") {
      const { orderedIds } = body;
      if (!Array.isArray(orderedIds)) {
        return NextResponse.json({ success: false, error: "orderedIds must be an array" }, { status: 400 });
      }
      const presets = await reorderAdminPresets(orderedIds);
      return NextResponse.json({ success: true, presets });
    }

    if (action === "RESET") {
      const presets = await resetAdminPresets();
      return NextResponse.json({ success: true, presets });
    }

    if (action === "CLONE") {
      const { sourcePresetId, newId, newTitleKo, newTitleEn } = body;
      const presets = await getAdminPresets(true);
      const source = presets.find((p) => p.id === sourcePresetId);
      if (!source) {
        return NextResponse.json({ success: false, error: "Source preset not found" }, { status: 404 });
      }

      const clonedPreset: TravelPreset = {
        ...JSON.parse(JSON.stringify(source)),
        id: newId || `${sourcePresetId}_COPY_${Date.now().toString().slice(-4)}`,
        titleKo: newTitleKo || `${source.titleKo} (사본)`,
        titleEn: newTitleEn || `${source.titleEn} (Copy)`,
        order: presets.length + 1,
        isActive: true,
        isCustom: true,
      };

      const created = await createAdminPreset(clonedPreset);
      return NextResponse.json({ success: true, preset: created });
    }

    // Default: CREATE
    const { preset } = body;
    if (!preset || !preset.id || !preset.titleKo) {
      return NextResponse.json({ success: false, error: "Invalid preset payload" }, { status: 400 });
    }

    const created = await createAdminPreset(preset);
    return NextResponse.json({ success: true, preset: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, updates } = body;
    if (!id || !updates) {
      return NextResponse.json({ success: false, error: "Missing id or updates" }, { status: 400 });
    }

    const updated = await updateAdminPreset(id, updates);
    return NextResponse.json({ success: true, preset: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const hard = searchParams.get("hard") === "true";

    if (!id) {
      return NextResponse.json({ success: false, error: "Preset ID is required" }, { status: 400 });
    }

    await deleteAdminPreset(id, hard);
    return NextResponse.json({ success: true, message: `Preset ${id} removed` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
