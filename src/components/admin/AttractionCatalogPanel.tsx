"use client";

import React, { useState, useEffect } from "react";
import { AttractionSpot } from "../../features/budget/catalog/attraction-spots";
import { SupportedCity, ALL_SUPPORTED_CITIES, CITY_KOREAN_NAMES } from "../../lib/trip-domain";
import { PlacementScope } from "../../lib/admin/admin-store";

export default function AttractionCatalogPanel() {
  const [attractions, setAttractions] = useState<AttractionSpot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState<SupportedCity | "ALL">("ALL");
  const [selectedScope, setSelectedScope] = useState<PlacementScope | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit/Add modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSpot, setEditingSpot] = useState<AttractionSpot | null>(null);

  // Form fields
  const [id, setId] = useState<string>("");
  const [cityCode, setCityCode] = useState<SupportedCity>("SEOUL");
  const [nameKo, setNameKo] = useState<string>("");
  const [nameEn, setNameEn] = useState<string>("");
  const [descKo, setDescKo] = useState<string>("");
  const [descEn, setDescEn] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [categoryType, setCategoryType] = useState<any>("명소");
  const [targetScope, setTargetScope] = useState<PlacementScope>("BOTH");
  const [sortOrder, setSortOrder] = useState<number>(100);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [subwayInfo, setSubwayInfo] = useState<string>("");
  const [openingHours, setOpeningHours] = useState<string>("");
  const [officialUrl, setOfficialUrl] = useState<string>("");

  const fetchAttractions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", "ATTRACTION");
      if (selectedCity !== "ALL") params.set("city", selectedCity);
      if (selectedScope !== "ALL") params.set("scope", selectedScope);

      const res = await fetch(`/api/admin/catalog?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAttractions(data.attractions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttractions();
  }, [selectedCity, selectedScope]);

  const handleOpenAdd = () => {
    setEditingSpot(null);
    setId(`spot_${Date.now().toString().slice(-6)}`);
    setCityCode(selectedCity !== "ALL" ? selectedCity : "SEOUL");
    setNameKo("");
    setNameEn("");
    setDescKo("");
    setDescEn("");
    setPrice(0);
    setCategoryType("명소");
    setTargetScope("BOTH");
    setSortOrder(100);
    setImageUrl("");
    setSubwayInfo("");
    setOpeningHours("");
    setOfficialUrl("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (spot: AttractionSpot) => {
    setEditingSpot(spot);
    setId(spot.id);
    setCityCode(spot.cityCode);
    setNameKo(spot.nameKo);
    setNameEn(spot.nameEn);
    setDescKo(spot.descKo);
    setDescEn(spot.descEn);
    setPrice(spot.price);
    setCategoryType(spot.categoryType || "명소");
    setTargetScope(spot.targetScope || "BOTH");
    setSortOrder(spot.sortOrder ?? 100);
    setImageUrl(spot.imageUrl || "");
    setSubwayInfo(spot.subwayInfo || spot.subwayInfoKo || "");
    setOpeningHours(spot.openingHours || spot.openingHoursKo || "");
    setOfficialUrl(spot.officialUrl || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !nameKo) {
      alert("아이디와 한국어 명소명은 필수입니다.");
      return;
    }

    const payload: AttractionSpot = {
      id,
      cityCode,
      nameKo,
      nameEn: nameEn || nameKo,
      descKo,
      descEn: descEn || descKo,
      price,
      priceStatus: price === 0 ? "FREE" : "PAID",
      categoryType,
      targetScope,
      sortOrder,
      imageUrl,
      subwayInfo,
      subwayInfoKo: subwayInfo,
      openingHours,
      openingHoursKo: openingHours,
      officialUrl,
      tag: `#${categoryType}`,
      emoji: "📍",
      gradientBg: "from-purple-500 to-indigo-600",
      isFeatured: false,
      isActive: true,
    };

    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ATTRACTION", data: payload }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchAttractions();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    }
  };

  const handleDelete = async (spot: AttractionSpot) => {
    if (!confirm(`관광지 "${spot.nameKo}" (${spot.id})을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/catalog?type=ATTRACTION&id=${spot.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAttractions(attractions.filter((s) => s.id !== spot.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSpots = attractions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.nameKo.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-sm" style={{ color: "#ffffff" }}>
            <span>🏛️</span> 관광지 & 명소 카탈로그 관리
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-200">
            총 {attractions.length}개 명소 등록됨 · 플래너 도시 탭 및 K-스팟에 지정된 대상과 정렬 규칙으로 노출됩니다.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="명소명 또는 ID 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border border-slate-600 bg-slate-800 px-3.5 py-2 text-xs font-medium text-white placeholder-slate-400 w-full md:w-60 focus:border-purple-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleOpenAdd}
            className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition-all flex-shrink-0"
          >
            + 새 명소 추가
          </button>
        </div>
      </div>

      {/* Scope and City Filters */}
      <div className="flex flex-col gap-3">
        {/* Scope selector */}
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
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
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

      {/* Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 bg-slate-800/90 text-slate-100 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">사진</th>
                  <th className="p-3.5">명소명 / ID</th>
                  <th className="p-3.5">도시 / 구분</th>
                  <th className="p-3.5">입장료</th>
                  <th className="p-3.5">노출 대상</th>
                  <th className="p-3.5">우선순위</th>
                  <th className="p-3.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-100 font-medium">
                {filteredSpots.map((spot) => {
                  const scopeType = spot.targetScope || "BOTH";
                  return (
                    <tr key={spot.id} className="hover:bg-slate-800/60 transition-all">
                      <td className="p-3.5">
                        {spot.imageUrl ? (
                          <img
                            src={spot.imageUrl}
                            alt={spot.nameKo}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-600"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-base border border-slate-700">
                            🏛️
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{spot.nameKo}</div>
                        <div className="text-[11px] font-semibold text-slate-300">{spot.nameEn}</div>
                        <div className="font-mono text-[10px] text-purple-300 mt-0.5">{spot.id}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-bold text-slate-200">
                          {CITY_KOREAN_NAMES[spot.cityCode] || spot.cityCode}
                        </span>
                        <div className="text-[11px] font-medium text-slate-300 mt-1">{spot.categoryType || "명소"}</div>
                      </td>
                      <td className="p-3.5">
                        {spot.price === 0 ? (
                          <span className="rounded-full bg-emerald-950/70 border border-emerald-500/50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                            무료 (FREE)
                          </span>
                        ) : (
                          <span className="font-extrabold text-purple-300 text-sm">
                            ₩{spot.price.toLocaleString()}
                          </span>
                        )}
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
                      <td className="p-3.5 font-mono font-bold text-slate-300">
                        {spot.sortOrder ?? 100}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(spot)}
                          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(spot)}
                          className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/25"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingSpot ? "관광 명소 수정" : "새 관광 명소 등록"}
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
                  <label className="text-xs font-bold text-slate-200">명소 고유 ID *</label>
                  <input
                    type="text"
                    value={id}
                    disabled={!!editingSpot}
                    onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-purple-400 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200">소속 도시 *</label>
                  <select
                    value={cityCode}
                    onChange={(e: any) => setCityCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-purple-400 focus:outline-none"
                  >
                    {ALL_SUPPORTED_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {CITY_KOREAN_NAMES[c]} ({c})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200">명소명 (한국어) *</label>
                  <input
                    type="text"
                    value={nameKo}
                    onChange={(e) => setNameKo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200">명소명 (영어)</label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200">카테고리 구분</label>
                  <select
                    value={categoryType}
                    onChange={(e: any) => setCategoryType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="명소">랜드마크 / 명소</option>
                    <option value="자연">자연 / 힐링</option>
                    <option value="엔터">엔터테인먼트 / K-컬처</option>
                    <option value="쇼핑">쇼핑 / 스트리트</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200">입장료 (KRW, 0이면 무료)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* PLACEMENT SCOPE SELECTOR */}
                <div className="rounded-xl border border-purple-400/50 bg-purple-950/40 p-3 sm:col-span-2">
                  <label className="text-xs font-bold text-purple-300 block mb-1">
                    🎯 노출 대상 위치 (Placement Scope) *
                  </label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { val: "CITY_PLANNER", label: "🏙️ 도시 탭 전용", desc: "플래너 관광 바스켓에만 노출" },
                      { val: "K_SPOT", label: "🧭 K-스팟 전용", desc: "K-가이드 탐색 페이지에만 노출" },
                      { val: "BOTH", label: "🌐 둘 다 노출", desc: "플래너 도시탭 & K-스팟 모두 노출" },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        className={`flex flex-col p-2 rounded-lg border cursor-pointer transition-all ${
                          targetScope === opt.val
                            ? "border-purple-500 bg-purple-500/20 text-white"
                            : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <input
                            type="radio"
                            name="attraction_targetScope"
                            checked={targetScope === opt.val}
                            onChange={() => setTargetScope(opt.val as any)}
                            className="accent-purple-500"
                          />
                          <span>{opt.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">정렬 우선순위 (숫자 작을수록 상단)</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">지하철/교통편 정보</label>
                  <input
                    type="text"
                    value={subwayInfo}
                    onChange={(e) => setSubwayInfo(e.target.value)}
                    placeholder="예: 2호선 성수역 4번 출구 도보 5분"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">대표 사진 URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">운영 시간 및 휴무일</label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="예: 09:00 - 18:00 (매주 화요일 휴무)"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
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
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500"
                >
                  {editingSpot ? "수정사항 저장" : "새 명소 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
