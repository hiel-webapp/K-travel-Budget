"use client";

import React, { useState, useEffect } from "react";
import { FoodItemDefinition } from "../../features/budget/domain/types";
import { SupportedCity, ALL_SUPPORTED_CITIES, CITY_KOREAN_NAMES } from "../../lib/trip-domain";
import { PlacementScope } from "../../lib/admin/admin-store";
import CompactReorderModal, { ReorderItem } from "./CompactReorderModal";

export default function FoodCatalogPanel() {
  const [foods, setFoods] = useState<FoodItemDefinition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState<SupportedCity | "NATIONAL" | "ALL">("ALL");
  const [selectedScope, setSelectedScope] = useState<PlacementScope | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isReorderModalOpen, setIsReorderModalOpen] = useState<boolean>(false);

  // Edit/Add modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFood, setEditingFood] = useState<FoodItemDefinition | null>(null);

  // Form fields
  const [id, setId] = useState<string>("");
  const [scope, setScope] = useState<"NATIONAL" | "CITY_LOCAL">("CITY_LOCAL");
  const [cityCode, setCityCode] = useState<SupportedCity>("SEOUL");
  const [nameKo, setNameKo] = useState<string>("");
  const [nameEn, setNameEn] = useState<string>("");
  const [descKo, setDescKo] = useState<string>("");
  const [descEn, setDescEn] = useState<string>("");
  const [categoryTag, setCategoryTag] = useState<any>("MEAL");
  const [unitPriceKrw, setUnitPriceKrw] = useState<number>(15000);
  const [priceMinKrw, setPriceMinKrw] = useState<number>(12000);
  const [priceMaxKrw, setPriceMaxKrw] = useState<number>(18000);
  const [targetScope, setTargetScope] = useState<PlacementScope>("BOTH");
  const [sortOrder, setSortOrder] = useState<number>(100);
  const [isMustEatTop3, setIsMustEatTop3] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  const fetchFoods = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", "FOOD");
      params.set("includeInactive", "true");
      if (selectedCity !== "ALL") params.set("city", selectedCity);
      if (selectedScope !== "ALL") params.set("scope", selectedScope);

      const res = await fetch(`/api/admin/catalog?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFoods(data.foods || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, [selectedCity, selectedScope]);

  const handleToggleActive = async (food: FoodItemDefinition) => {
    const nextStatus = food.isActive === false ? true : false;
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FOOD",
          data: { ...food, isActive: nextStatus },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFoods(foods.map((f) => (f.id === food.id ? { ...f, isActive: nextStatus } : f)));
      } else {
        alert(`상태 변경 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    }
  };

  const handleToggleMustEat = async (food: FoodItemDefinition) => {
    const nextMustEat = !food.isMustEatTop3;
    // 낙관적 UI 업데이트 (지연 없이 즉시 반영)
    setFoods((prev) =>
      prev.map((f) => (f.id === food.id ? { ...f, isMustEatTop3: nextMustEat } : f))
    );

    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FOOD",
          data: { ...food, isMustEatTop3: nextMustEat },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        // 실패 시 롤백
        setFoods((prev) =>
          prev.map((f) => (f.id === food.id ? { ...f, isMustEatTop3: food.isMustEatTop3 } : f))
        );
        alert(`Must-Eat 상태 변경 실패: ${data.error}`);
      }
    } catch (err: any) {
      setFoods((prev) =>
        prev.map((f) => (f.id === food.id ? { ...f, isMustEatTop3: food.isMustEatTop3 } : f))
      );
      alert(`오류 발생: ${err.message}`);
    }
  };

  const handleOpenAdd = () => {
    setEditingFood(null);
    setId(`food_${Date.now().toString().slice(-6)}`);
    setScope("CITY_LOCAL");
    setCityCode(selectedCity !== "ALL" && selectedCity !== "NATIONAL" ? selectedCity : "SEOUL");
    setNameKo("");
    setNameEn("");
    setDescKo("");
    setDescEn("");
    setCategoryTag("MEAL");
    setUnitPriceKrw(15000);
    setPriceMinKrw(12000);
    setPriceMaxKrw(18000);
    setTargetScope("BOTH");
    setSortOrder(100);
    setIsMustEatTop3(false);
    setImageUrl("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (food: FoodItemDefinition) => {
    setEditingFood(food);
    setId(food.id);
    setScope(food.scope);
    setCityCode(food.cityCode || "SEOUL");
    setNameKo(food.nameKo);
    setNameEn(food.nameEn);
    setDescKo(food.descKo);
    setDescEn(food.descEn);
    setCategoryTag(food.categoryTag);
    setUnitPriceKrw(food.unitPriceKrw);
    setPriceMinKrw(food.priceMinKrw || food.unitPriceKrw);
    setPriceMaxKrw(food.priceMaxKrw || food.unitPriceKrw);
    setTargetScope(food.targetScope || "BOTH");
    setSortOrder(food.sortOrder ?? 100);
    setIsMustEatTop3(!!food.isMustEatTop3);
    setImageUrl(food.imageUrl || "");
    setIsActive(food.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !nameKo) {
      alert("아이디와 한국어 음식명은 필수입니다.");
      return;
    }

    const payload: FoodItemDefinition = {
      id,
      scope,
      cityCode: scope === "NATIONAL" ? undefined : cityCode,
      nameKo,
      nameEn: nameEn || nameKo,
      descKo,
      descEn: descEn || descKo,
      categoryTag,
      unitPriceKrw,
      priceMinKrw,
      priceMaxKrw,
      targetScope,
      sortOrder,
      isMustEatTop3,
      imageUrl,
      isActive,
    };

    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "FOOD", data: payload }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchFoods();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    }
  };

  const handleDelete = async (food: FoodItemDefinition) => {
    if (!confirm(`음식 "${food.nameKo}" (${food.id})을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/catalog?type=FOOD&id=${food.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setFoods(foods.filter((f) => f.id !== food.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFoodReorder = async (orderedIds: string[]) => {
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "REORDER_FOOD",
        orderedIds,
        city: selectedCity !== "ALL" && selectedCity !== "NATIONAL" ? selectedCity : undefined,
        setCustomRule: true,
      }),
    });
    const data = await res.json();
    if (data.success) {
      fetchFoods();
    } else {
      throw new Error(data.error || "순서 저장 실패");
    }
  };

  const handleMoveFood = async (foodId: string, direction: "top" | "up" | "down") => {
    const currentList = [...foods];
    const index = currentList.findIndex((f) => f.id === foodId);
    if (index === -1) return;

    if (direction === "top") {
      if (index === 0) return;
      const [moved] = currentList.splice(index, 1);
      currentList.unshift(moved);
    } else if (direction === "up") {
      if (index === 0) return;
      const temp = currentList[index];
      currentList[index] = currentList[index - 1];
      currentList[index - 1] = temp;
    } else if (direction === "down") {
      if (index === currentList.length - 1) return;
      const temp = currentList[index];
      currentList[index] = currentList[index + 1];
      currentList[index + 1] = temp;
    }

    setFoods(currentList);
    try {
      await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "REORDER_FOOD",
          orderedIds: currentList.map((f) => f.id),
          city: selectedCity !== "ALL" && selectedCity !== "NATIONAL" ? selectedCity : undefined,
          setCustomRule: true,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFoods = foods.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.nameKo.toLowerCase().includes(q) ||
      f.nameEn.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-sm" style={{ color: "#ffffff" }}>
            <span>🍲</span> 음식 카탈로그 관리
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-200">
            총 {foods.length}개 메뉴 등록됨 (활성: {foods.filter((f) => f.isActive !== false).length}개, 숨김: {foods.filter((f) => f.isActive === false).length}개) · 플래너 도시 탭 및 K-스팟에 지정된 대상과 정렬 규칙으로 노출됩니다.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <input
            type="text"
            placeholder="음식명 또는 ID 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border border-slate-600 bg-slate-800 px-3.5 py-2 text-xs font-medium text-white placeholder-slate-400 w-full md:w-48 focus:border-indigo-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsReorderModalOpen(true)}
            className="rounded-xl border border-indigo-500/50 bg-indigo-600/25 px-3.5 py-2 text-xs font-bold text-indigo-200 hover:bg-indigo-600/40 hover:text-white transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
          >
            <span>⠿</span>
            <span>
              {selectedCity !== "ALL"
                ? `${selectedCity === "NATIONAL" ? "전국" : CITY_KOREAN_NAMES[selectedCity as SupportedCity] || selectedCity} 순서 정렬`
                : "순서 정렬 (드래그)"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all flex-shrink-0"
          >
            + 새 음식 추가
          </button>
        </div>
      </div>

      {/* Scope and City Filters */}
      <div className="flex flex-col gap-3">
        {/* Placement Scope Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-200 flex-shrink-0">노출 대상:</span>
          {[
            { key: "ALL", label: "전체" },
            { key: "CITY_PLANNER", label: "🏙️ 도시 탭 전용" },
            { key: "K_SPOT", label: "🧭 K-스팟 전용" },
            { key: "BOTH", label: "🌐 도시탭 + K-스팟 (둘 다)" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedScope(item.key as any)}
              className={`rounded-lg px-3 py-1.5 font-bold transition-all flex-shrink-0 ${
                selectedScope === item.key
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-200 flex-shrink-0">지역 필터:</span>
          <button
            onClick={() => setSelectedCity("ALL")}
            className={`rounded-lg px-3 py-1.5 font-bold flex-shrink-0 transition-all ${
              selectedCity === "ALL" ? "bg-slate-100 text-slate-950 font-black shadow" : "border border-slate-600 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700"
            }`}
          >
            전체 지역
          </button>
          <button
            onClick={() => setSelectedCity("NATIONAL")}
            className={`rounded-lg px-3 py-1.5 font-bold flex-shrink-0 transition-all ${
              selectedCity === "NATIONAL" ? "bg-slate-100 text-slate-950 font-black shadow" : "border border-slate-600 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700"
            }`}
          >
            전국 시그니처 (NATIONAL)
          </button>
          {ALL_SUPPORTED_CITIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCity(c)}
              className={`rounded-lg px-3 py-1.5 font-bold flex-shrink-0 transition-all ${
                selectedCity === c ? "bg-slate-100 text-slate-950 font-black shadow" : "border border-slate-600 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700"
              }`}
            >
              {CITY_KOREAN_NAMES[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Foods Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 bg-slate-800/90 text-slate-100 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">사진</th>
                  <th className="p-3.5">음식명 / ID</th>
                  <th className="p-3.5">상태</th>
                  <th className="p-3.5 text-center">Must-Eat 추천</th>
                  <th className="p-3.5">지역 / 카테고리</th>
                  <th className="p-3.5">기준 단가</th>
                  <th className="p-3.5">노출 대상</th>
                  <th className="p-3.5">우선순위</th>
                  <th className="p-3.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-100 font-medium">
                {filteredFoods.map((food) => {
                  const scopeType = food.targetScope || "BOTH";
                  const isItemActive = food.isActive !== false;
                  return (
                    <tr
                      key={food.id}
                      className={`transition-all ${
                        isItemActive
                          ? "hover:bg-slate-800/60"
                          : "hover:bg-slate-900/80 bg-slate-950/50 opacity-60"
                      }`}
                    >
                      <td className="p-3.5">
                        {food.imageUrl ? (
                          <img
                            src={food.imageUrl}
                            alt={food.nameKo}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-600"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-base border border-slate-700">
                            🍽️
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>{food.nameKo}</span>
                          {food.isMustEatTop3 && (
                            <span
                              onClick={() => handleToggleMustEat(food)}
                              className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[10px] text-rose-300 font-bold border border-rose-500/40 cursor-pointer hover:bg-rose-500/30"
                              title="클릭하여 추천 해제"
                            >
                              🔥 Top3
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-300">{food.nameEn}</div>
                        <div className="font-mono text-[10px] text-indigo-300 mt-0.5">{food.id}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                            isItemActive
                              ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                              : "bg-slate-800 border-slate-700 text-slate-400"
                          }`}
                        >
                          {isItemActive ? "노출 중" : "숨김"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleMustEat(food)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-all cursor-pointer shadow-sm ${
                            food.isMustEatTop3
                              ? "bg-rose-500/25 border border-rose-400 text-rose-200 hover:bg-rose-500/40 hover:scale-105 shadow-rose-500/20"
                              : "bg-slate-800/80 border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-700/60"
                          }`}
                          title={food.isMustEatTop3 ? "클릭하여 Must-Eat 추천 해제" : "클릭하여 외국인 필수 추천(Must-Eat) 지정"}
                        >
                          <span className={food.isMustEatTop3 ? "text-rose-400 animate-pulse" : "text-slate-500"}>
                            {food.isMustEatTop3 ? "🔥" : "☆"}
                          </span>
                          <span>{food.isMustEatTop3 ? "Must-Eat" : "추천"}</span>
                        </button>
                      </td>
                      <td className="p-3.5">
                        <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-bold text-slate-200">
                          {food.scope === "NATIONAL" ? "전국 대표" : CITY_KOREAN_NAMES[food.cityCode!] || food.cityCode}
                        </span>
                        <div className="text-[11px] font-medium text-slate-300 mt-1">{food.categoryTag}</div>
                      </td>
                      <td className="p-3.5 font-extrabold text-emerald-300 text-sm">
                        ₩{food.unitPriceKrw?.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        {scopeType === "CITY_PLANNER" && (
                          <span className="rounded-full bg-blue-950/70 px-2.5 py-0.5 text-[11px] font-bold text-blue-300 border border-blue-500/40">
                            🏙️ 도시 탭
                          </span>
                        )}
                        {scopeType === "K_SPOT" && (
                          <span className="rounded-full bg-purple-950/70 px-2.5 py-0.5 text-[11px] font-bold text-purple-300 border border-purple-500/40">
                            🧭 K-스팟
                          </span>
                        )}
                        {scopeType === "BOTH" && (
                          <span className="rounded-full bg-emerald-950/70 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/40">
                            🌐 둘 다
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-slate-200 text-xs min-w-[20px]">
                            {food.sortOrder ?? 100}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveFood(food.id, "top")}
                              className="rounded px-1 py-0.5 text-[10px] font-black text-indigo-300 hover:bg-indigo-900/50 hover:text-white"
                              title="맨 위로 (1위) 이동"
                            >
                              Top
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveFood(food.id, "up")}
                              className="rounded px-1 py-0.5 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
                              title="한 칸 위로"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveFood(food.id, "down")}
                              className="rounded px-1 py-0.5 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
                              title="한 칸 아래로"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(food)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                            isItemActive
                              ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                              : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                          }`}
                        >
                          {isItemActive ? "숨기기" : "노출하기"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(food)}
                          className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(food)}
                          className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/25"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Food Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingFood ? "음식 정보 수정" : "새 음식 등록"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-200">음식 고유 ID *</label>
                  <input
                    type="text"
                    value={id}
                    disabled={!!editingFood}
                    onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200">소속 범위 *</label>
                  <select
                    value={scope}
                    onChange={(e: any) => setScope(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="CITY_LOCAL">도시 지역 음식 (CITY_LOCAL)</option>
                    <option value="NATIONAL">전국 대표 음식 (NATIONAL)</option>
                  </select>
                </div>

                {scope === "CITY_LOCAL" && (
                  <div>
                    <label className="text-xs font-bold text-slate-200">소속 도시 *</label>
                    <select
                      value={cityCode}
                      onChange={(e: any) => setCityCode(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none"
                    >
                      {ALL_SUPPORTED_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {CITY_KOREAN_NAMES[c]} ({c})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-200">카테고리 태그</label>
                  <select
                    value={categoryTag}
                    onChange={(e: any) => setCategoryTag(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="MEAL">식사 (MEAL)</option>
                    <option value="BBQ_FEAST">K-바베큐 / 구이 (BBQ_FEAST)</option>
                    <option value="STREET_SNACK">길거리 간식 / 야시장 (STREET_SNACK)</option>
                    <option value="DESSERT_CAFE">디저트 / 감성카페 (DESSERT_CAFE)</option>
                    <option value="SEAFOOD">해산물 요리 (SEAFOOD)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200">음식명 (한국어) *</label>
                  <input
                    type="text"
                    value={nameKo}
                    onChange={(e) => setNameKo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200">음식명 (영어)</label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200">기준 단가 (KRW) *</label>
                  <input
                    type="number"
                    value={unitPriceKrw}
                    onChange={(e) => setUnitPriceKrw(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                {/* PLACEMENT SCOPE SELECTOR */}
                <div className="rounded-xl border border-indigo-400/50 bg-indigo-950/40 p-3 sm:col-span-2">
                  <label className="text-xs font-bold text-indigo-300 block mb-1">
                    🎯 노출 대상 위치 (Placement Scope) *
                  </label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { val: "CITY_PLANNER", label: "🏙️ 도시 탭 전용", desc: "플래너 식비 바스켓에만 노출" },
                      { val: "K_SPOT", label: "🧭 K-스팟 전용", desc: "K-가이드 탐색 페이지에만 노출" },
                      { val: "BOTH", label: "🌐 둘 다 노출", desc: "플래너 도시탭 & K-스팟 모두 노출" },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        className={`flex flex-col p-2.5 rounded-lg border cursor-pointer transition-all ${
                          targetScope === opt.val
                            ? "border-indigo-400 bg-indigo-500/25 text-white shadow-sm"
                            : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <input
                            type="radio"
                            name="food_targetScope"
                            checked={targetScope === opt.val}
                            onChange={() => setTargetScope(opt.val as any)}
                            className="accent-indigo-500"
                          />
                          <span>{opt.label}</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-300 mt-1">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200">정렬 우선순위 (숫자 작을수록 상단)</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="foodIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <label htmlFor="foodIsActive" className="text-xs font-bold text-emerald-400 cursor-pointer">
                    서비스에 노출 (체크 해제 시 숨김 처리)
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="mustEat"
                    checked={isMustEatTop3}
                    onChange={(e) => setIsMustEatTop3(e.target.checked)}
                    className="h-4 w-4 rounded accent-rose-500"
                  />
                  <label htmlFor="mustEat" className="text-xs font-semibold text-rose-400 cursor-pointer">
                    외국인 필수 추천 (Must-Eat Top3) 뱃지 부여
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-200">
                      대표 사진 URL 및 실시간 미리보기
                    </label>
                    {imageUrl && (
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                      >
                        원본 사진 새 탭 열기 ↗
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start gap-3 mt-1">
                    <div className="w-full flex-1">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        음식 사진 URL을 입력하면 우측에 실시간으로 이미지가 표시됩니다.
                      </p>
                    </div>
                    {/* 실시간 이미지 미리보기 박스 */}
                    <div className="h-20 w-28 sm:w-32 flex-shrink-0 overflow-hidden rounded-xl border border-slate-600 bg-slate-950 flex items-center justify-center shadow-inner relative group">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="미리보기"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector(".fallback-text")) {
                              const fallback = document.createElement("div");
                              fallback.className = "fallback-text p-1 text-center text-[10px] text-rose-400 font-bold";
                              fallback.innerText = "URL 오류";
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="p-2 text-center text-[10px] font-semibold text-slate-500">
                          사진 없음
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">상세 설명 (한국어)</label>
                  <textarea
                    rows={2}
                    value={descKo}
                    onChange={(e) => setDescKo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500"
                >
                  {editingFood ? "수정사항 저장" : "새 음식 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compact Reorder Modal */}
      <CompactReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        title={
          selectedCity !== "ALL"
            ? `${selectedCity === "NATIONAL" ? "전국 대표" : CITY_KOREAN_NAMES[selectedCity as SupportedCity] || selectedCity} 음식 노출 순서 정렬`
            : "음식 카탈로그 노출 순서 정렬"
        }
        categoryIcon="🍲"
        items={foods.map((f) => ({
          id: f.id,
          titleKo: f.nameKo,
          titleEn: f.nameEn,
          subtitle: `${f.scope === "NATIONAL" ? "전국" : CITY_KOREAN_NAMES[f.cityCode!] || f.cityCode} · ₩${f.unitPriceKrw?.toLocaleString()}`,
          imageUrl: f.imageUrl,
          badge: f.isMustEatTop3 ? "Must-Eat" : undefined,
        }))}
        onSave={handleSaveFoodReorder}
        noticeText="저장 시 선택된 지역의 정렬 규칙이 커스텀 순서(CUSTOM_ORDER)로 자동 적용됩니다."
      />
    </div>
  );
}
