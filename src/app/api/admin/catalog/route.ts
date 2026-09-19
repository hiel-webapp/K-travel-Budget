import { NextRequest, NextResponse } from "next/server";
import {
  getAdminFoods,
  saveAdminFood,
  saveAdminFoodsBatch,
  deleteAdminFood,
  getAdminAttractions,
  saveAdminAttraction,
  saveAdminAttractionsBatch,
  deleteAdminAttraction,
  getAdminThemeActivities,
  saveAdminThemeActivity,
  saveAdminThemeActivitiesBatch,
  deleteAdminThemeActivity,
  getAdminTourCourses,
  saveAdminTourCourse,
  deleteAdminTourCourse,
  getAdminSortingRules,
  saveAdminSortingRule,
  getAdminGuides,
  getAdminBilingualGuide,
  saveAdminGuide,
  setHeroGuide,
  deleteAdminGuide,
  getAdminFaqs,
  saveAdminFaq,
  deleteAdminFaq,
  getAdminGuideCards,
  saveAdminGuideCard,
  deleteAdminGuideCard,
  resetAdminGuideCards,
  reorderAdminFoods,
  reorderAdminAttractions,
  reorderAdminTourCourses,
  reorderAdminGuides,
  reorderAdminGuideCards,
  PlacementScope,
  SortingRuleType,
} from "../../../../lib/admin/admin-store";
import { SupportedCity } from "../../../../lib/trip-domain";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "ALL";
    const city = (searchParams.get("city") as SupportedCity | "NATIONAL" | "ALL") || "ALL";
    const scope = (searchParams.get("scope") as PlacementScope | "ALL") || "ALL";
    const includeInactive = searchParams.get("includeInactive") !== "false";

    const responseData: Record<string, any> = { success: true };

    if (type === "FOOD" || type === "ALL") {
      responseData.foods = await getAdminFoods({ city, scope, includeInactive });
    }

    if (type === "ATTRACTION" || type === "ALL") {
      const attractionCity = city === "NATIONAL" ? "ALL" : (city as SupportedCity | "ALL");
      responseData.attractions = await getAdminAttractions({
        city: attractionCity,
        scope,
        includeInactive,
      });
    }

    if (type === "COURSE" || type === "ALL") {
      const courseCity = city === "NATIONAL" ? "ALL" : (city as SupportedCity | "ALL");
      responseData.courses = await getAdminTourCourses(courseCity, includeInactive);
    }

    if (type === "THEME_ACTIVITY" || type === "ACTIVITY" || type === "ALL") {
      const activityCity = city === "NATIONAL" ? "ALL" : (city as SupportedCity | "ALL");
      responseData.activities = await getAdminThemeActivities({
        city: activityCity,
        includeInactive,
      });
    }

    if (type === "SORTING" || type === "ALL") {
      responseData.sortingRules = await getAdminSortingRules();
    }

    if (type === "GUIDE" || type === "GUIDE_CARDS" || type === "ALL") {
      responseData.guidesKo = await getAdminGuides("ko");
      responseData.guidesEn = await getAdminGuides("en");
      responseData.guideCards = await getAdminGuideCards();
    }

    if (type === "FAQ" || type === "ALL") {
      responseData.faqs = await getAdminFaqs();
    }

    if (type === "GUIDE_BILINGUAL") {
      const guideId = searchParams.get("id");
      if (guideId) {
        responseData.guide = await getAdminBilingualGuide(guideId);
      }
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data, city, rule, id, orderedIds, setCustomRule } = body;

    // 일괄 순서 재배열 (Reorder)
    if (type === "REORDER_FOOD") {
      if (!Array.isArray(orderedIds)) {
        return NextResponse.json({ success: false, error: "orderedIds array is required" }, { status: 400 });
      }
      await reorderAdminFoods(orderedIds, setCustomRule ? city : undefined);
      return NextResponse.json({ success: true, message: "Food order updated" });
    }

    if (type === "REORDER_ATTRACTION") {
      if (!Array.isArray(orderedIds)) {
        return NextResponse.json({ success: false, error: "orderedIds array is required" }, { status: 400 });
      }
      await reorderAdminAttractions(orderedIds, setCustomRule ? city : undefined);
      return NextResponse.json({ success: true, message: "Attraction order updated" });
    }

    if (type === "REORDER_COURSE") {
      if (!Array.isArray(orderedIds)) {
        return NextResponse.json({ success: false, error: "orderedIds array is required" }, { status: 400 });
      }
      await reorderAdminTourCourses(orderedIds);
      return NextResponse.json({ success: true, message: "Tour course order updated" });
    }

    if (type === "REORDER_GUIDE") {
      if (!Array.isArray(orderedIds)) {
        return NextResponse.json({ success: false, error: "orderedIds array is required" }, { status: 400 });
      }
      await reorderAdminGuides(orderedIds);
      return NextResponse.json({ success: true, message: "Guide order updated" });
    }

    if (type === "REORDER_GUIDE_CARD") {
      if (!Array.isArray(orderedIds)) {
        return NextResponse.json({ success: false, error: "orderedIds array is required" }, { status: 400 });
      }
      await reorderAdminGuideCards(orderedIds);
      return NextResponse.json({ success: true, message: "GuideCard order updated" });
    }

    if (type === "SORTING_RULE") {
      if (!city || !rule) {
        return NextResponse.json({ success: false, error: "city and rule are required" }, { status: 400 });
      }
      await saveAdminSortingRule(city, rule as SortingRuleType);
      return NextResponse.json({ success: true, sortingRules: await getAdminSortingRules() });
    }

    if (type === "FOOD") {
      if (!data || !data.id || !data.nameKo) {
        return NextResponse.json({ success: false, error: "Invalid food data" }, { status: 400 });
      }
      const saved = await saveAdminFood(data);
      return NextResponse.json({ success: true, item: saved });
    }

    if (type === "BATCH_FOOD") {
      const items = body.items;
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: "items array is required" }, { status: 400 });
      }
      const saved = await saveAdminFoodsBatch(items);
      return NextResponse.json({ success: true, count: saved.length });
    }

    if (type === "ATTRACTION") {
      if (!data || !data.id || !data.nameKo) {
        return NextResponse.json({ success: false, error: "Invalid attraction data" }, { status: 400 });
      }
      const saved = await saveAdminAttraction(data);
      return NextResponse.json({ success: true, item: saved });
    }

    if (type === "BATCH_ATTRACTION") {
      const items = body.items;
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: "items array is required" }, { status: 400 });
      }
      const saved = await saveAdminAttractionsBatch(items);
      return NextResponse.json({ success: true, count: saved.length });
    }

    if (type === "THEME_ACTIVITY" || type === "ACTIVITY") {
      if (!data || !data.id || !data.nameKo) {
        return NextResponse.json({ success: false, error: "Invalid activity data" }, { status: 400 });
      }
      const saved = await saveAdminThemeActivity(data);
      return NextResponse.json({ success: true, item: saved });
    }

    if (type === "BATCH_THEME_ACTIVITY") {
      const items = body.items;
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: "items array is required" }, { status: 400 });
      }
      const saved = await saveAdminThemeActivitiesBatch(items);
      return NextResponse.json({ success: true, count: saved.length });
    }

    if (type === "COURSE") {
      if (!data || !data.id || !data.nameKo) {
        return NextResponse.json({ success: false, error: "Invalid course data" }, { status: 400 });
      }
      const saved = await saveAdminTourCourse(data);
      return NextResponse.json({ success: true, item: saved });
    }

    if (type === "GUIDE") {
      if (!data || (!data.ko && !data.id)) {
        return NextResponse.json({ success: false, error: "Invalid guide data" }, { status: 400 });
      }
      const guideKo = data.ko || data;
      const guideEn = data.en;
      await saveAdminGuide(guideKo, guideEn);
      return NextResponse.json({ success: true, message: `Guide ${guideKo.id} saved` });
    }

    if (type === "GUIDE_CARD") {
      if (!data || !data.id || !data.titleEn || !data.titleKo) {
        return NextResponse.json({ success: false, error: "Invalid guide card data" }, { status: 400 });
      }
      await saveAdminGuideCard(data);
      return NextResponse.json({ success: true, message: `GuideCard ${data.id} saved` });
    }

    if (type === "RESET_GUIDE_CARDS") {
      const resetList = await resetAdminGuideCards();
      return NextResponse.json({ success: true, guideCards: resetList });
    }

    if (type === "GUIDE_HERO") {
      if (!id) {
        return NextResponse.json({ success: false, error: "Guide ID required for hero setting" }, { status: 400 });
      }
      await setHeroGuide(id);
      return NextResponse.json({ success: true, message: `Hero guide set to ${id}` });
    }

    if (type === "FAQ") {
      if (!data || !data.id) {
        return NextResponse.json({ success: false, error: "Invalid FAQ data" }, { status: 400 });
      }
      await saveAdminFaq(data);
      return NextResponse.json({ success: true, message: `FAQ ${data.id} saved` });
    }

    return NextResponse.json({ success: false, error: `Unknown type: ${type}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ success: false, error: "type and id are required" }, { status: 400 });
    }

    if (type === "FOOD") {
      await deleteAdminFood(id);
      return NextResponse.json({ success: true, message: `Food ${id} removed` });
    }

    if (type === "ATTRACTION") {
      await deleteAdminAttraction(id);
      return NextResponse.json({ success: true, message: `Attraction ${id} removed` });
    }

    if (type === "THEME_ACTIVITY" || type === "ACTIVITY") {
      await deleteAdminThemeActivity(id);
      return NextResponse.json({ success: true, message: `Theme Activity ${id} removed` });
    }

    if (type === "COURSE") {
      await deleteAdminTourCourse(id);
      return NextResponse.json({ success: true, message: `Course ${id} removed` });
    }

    if (type === "GUIDE") {
      await deleteAdminGuide(id);
      return NextResponse.json({ success: true, message: `Guide ${id} removed` });
    }

    if (type === "GUIDE_CARD") {
      await deleteAdminGuideCard(id);
      return NextResponse.json({ success: true, message: `GuideCard ${id} removed` });
    }

    if (type === "FAQ") {
      await deleteAdminFaq(id);
      return NextResponse.json({ success: true, message: `FAQ ${id} removed` });
    }

    return NextResponse.json({ success: false, error: `Unknown type: ${type}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
