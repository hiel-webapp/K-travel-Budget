"use client";

import React, { useState, useEffect, useRef } from "react";
import { ThemeActivityItem } from "../../features/budget/catalog/theme-activities";
import { AttractionSpot } from "../../features/budget/catalog/attraction-spots";
import { SupportedCity, ALL_SUPPORTED_CITIES, CITY_KOREAN_NAMES } from "../../lib/trip-domain";

export default function ThemeActivityCatalogPanel() {
  const [activities, setActivities] = useState<ThemeActivityItem[]>([]);
  const [attractions, setAttractions] = useState<AttractionSpot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState<SupportedCity | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit/Add modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<ThemeActivityItem | null>(null);

  // Form fields
  const [id, setId] = useState<string>("");
  const [cityCode, setCityCode] = useState<SupportedCity>("SEOUL");
  const [relatedSpotKey, setRelatedSpotKey] = useState<string>("");
  const [relatedSpotNameKo, setRelatedSpotNameKo] = useState<string>("");
  const [relatedSpotNameEn, setRelatedSpotNameEn] = useState<string>("");
  const [nameKo, setNameKo] = useState<string>("");
  const [nameEn, setNameEn] = useState<string>("");
  const [descKo, setDescKo] = useState<string>("");
  const [descEn, setDescEn] = useState<string>("");
  const [priceKrw, setPriceKrw] = useState<number>(25000);
  const [categoryType, setCategoryType] = useState<"엔터" | "명소" | "자연" | "쇼핑">("엔터");
  const [tag, setTag] = useState<string>("K-컬처/인기");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [durationTextKo, setDurationTextKo] = useState<string>("2시간");
  const [durationTextEn, setDurationTextEn] = useState<string>("2 hours");
  const [bookingTipKo, setBookingTipKo] = useState<string>("");
  const [bookingTipEn, setBookingTipEn] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  // Batch updates queue to protect Cloudflare Worker
  const pendingUpdatesRef = useRef<Map<string, ThemeActivityItem>>(new Map());
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", "THEME_ACTIVITY");
      params.set("includeInactive", "true");
      if (selectedCity !== "ALL") params.set("city", selectedCity);

      const res = await fetch(`/api/admin/catalog?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttractions = async () => {
    try {
      const res = await fetch("/api/admin/catalog?type=ATTRACTION&includeInactive=true");
      const data = await res.json();
      if (data.success) {
        setAttractions(data.attractions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [selectedCity]);

  useEffect(() => {
    fetchAttractions();
  }, []);

  const flushBatchUpdates = async () => {
    if (pendingUpdatesRef.current.size === 0) return;
    const itemsToSave = Array.from(pendingUpdatesRef.current.values());
    pendingUpdatesRef.current.clear();
    setIsSyncing(true);

    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "BATCH_THEME_ACTIVITY",
          items: itemsToSave,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Batch activity update failed:", data.error);
        fetchActivities();
      }
    } catch (err) {
      console.error("Batch activity update error:", err);
      fetchActivities();
    } finally {
      setIsSyncing(false);
      if (pendingUpdatesRef.current.size > 0) {
        syncTimerRef.current = setTimeout(flushBatchUpdates, 200);
      }
    }
  };

  const handleToggleActive = (activity: ThemeActivityItem) => {
    const nextStatus = activity.isActive === false ? true : false;
    const updated = { ...activity, isActive: nextStatus };

    setActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? updated : a))
    );

    pendingUpdatesRef.current.set(activity.id, updated);
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(flushBatchUpdates, 300);
  };

  const handleOpenAdd = () => {
    setEditingActivity(null);
    const initialCity = selectedCity !== "ALL" ? selectedCity : "SEOUL";
    setId(`act_${initialCity.toLowerCase()}_${Date.now().toString().slice(-5)}`);
    setCityCode(initialCity);
    setRelatedSpotKey("");
    setRelatedSpotNameKo("");
    setRelatedSpotNameEn("");
    setNameKo("");
    setNameEn("");
    setDescKo("");
    setDescEn("");
    setPriceKrw(25000);
    setCategoryType("엔터");
    setTag("K-컬처/인기");
    setImageUrl("");
    setDurationTextKo("2시간");
    setDurationTextEn("2 hours");
    setBookingTipKo("");
    setBookingTipEn("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (act: ThemeActivityItem) => {
    setEditingActivity(act);
    setId(act.id);
    setCityCode(act.cityCode);
    setRelatedSpotKey(act.relatedSpotKey || "");
    setRelatedSpotNameKo(act.relatedSpotNameKo || "");
    setRelatedSpotNameEn(act.relatedSpotNameEn || "");
    setNameKo(act.nameKo);
    setNameEn(act.nameEn);
    setDescKo(act.descKo);
    setDescEn(act.descEn);
    setPriceKrw(act.priceKrw);
    setCategoryType(act.categoryType || "엔터");
    setTag(act.tag);
    setImageUrl(act.imageUrl || "");
    setDurationTextKo(act.durationTextKo || "");
    setDurationTextEn(act.durationTextEn || "");
    setBookingTipKo(act.bookingTipKo || "");
    setBookingTipEn(act.bookingTipEn || "");
    setIsActive(act.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSelectRelatedAttraction = (spotId: string) => {
    if (!spotId) {
      setRelatedSpotKey("");
      setRelatedSpotNameKo("");
      setRelatedSpotNameEn("");
      return;
    }
    const spot = attractions.find((s) => s.id === spotId);
    if (spot) {
      setRelatedSpotKey(spot.id);
      setRelatedSpotNameKo(spot.nameKo);
      setRelatedSpotNameEn(spot.nameEn);
      if (!nameKo) {
        setNameKo(`${spot.nameKo} 특별 체험`);
        setNameEn(`${spot.nameEn} Special Experience`);
      }
    } else {
      setRelatedSpotKey(spotId);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !nameKo) {
      alert("아이디와 한국어 체험명은 필수입니다.");
      return;
    }

    const payload: ThemeActivityItem = {
      id,
      cityCode,
      relatedSpotKey: relatedSpotKey || undefined,
      relatedSpotNameKo: relatedSpotNameKo || undefined,
      relatedSpotNameEn: relatedSpotNameEn || undefined,
      nameKo,
      nameEn: nameEn || nameKo,
      descKo,
      descEn: descEn || descKo,
      priceKrw: Number(priceKrw) || 0,
      tag: tag || "체험",
      categoryType,
      imageUrl,
      durationTextKo: durationTextKo || undefined,
      durationTextEn: durationTextEn || undefined,
      bookingTipKo: bookingTipKo || undefined,
      bookingTipEn: bookingTipEn || undefined,
      isActive,
    };

    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "THEME_ACTIVITY", data: payload }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchActivities();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    }
  };

  const handleDelete = async (act: ThemeActivityItem) => {
    if (!confirm(`K-체험 "${act.nameKo}" (${act.id})을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/catalog?type=THEME_ACTIVITY&id=${act.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setActivities(activities.filter((a) => a.id !== act.id));
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    }
  };

  const filteredActivities = activities.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.nameKo.toLowerCase().includes(q) ||
      a.nameEn.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      (a.relatedSpotNameKo && a.relatedSpotNameKo.toLowerCase().includes(q)) ||
      (a.relatedSpotKey && a.relatedSpotKey.toLowerCase().includes(q))
    );
  });

  // 해당 도시의 관광지 목록 (연계 관광지 드롭다운 선택용)
  const cityAttractions = attractions.filter((s) => s.cityCode === cityCode);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-sm" style={{ color: "#ffffff" }}>
            <span>🎭</span> 연계 K-체험 & 액티비티 관리
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-200">
            총 {activities.length}개 K-체험 등록됨 (활성: {activities.filter((a) => a.isActive !== false).length}개, 숨김: {activities.filter((a) => a.isActive === false).length}개) · 여행자가 특정 명소를 담을 때 하단 플로팅 추천으로 노출됩니다.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <input
            type="text"
            placeholder="체험명, ID, 연계 명소 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border border-slate-600 bg-slate-800 px-3.5 py-2 text-xs font-medium text-white placeholder-slate-400 w-full md:w-56 focus:border-rose-400 focus:outline-none"
          />
          {isSyncing && (
            <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1 animate-pulse flex-shrink-0 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1.5 rounded-xl">
              <span>⏳</span>
              <span>동기화 중...</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-pink-500 transition-all flex-shrink-0"
          >
            + 새 K-체험 추가
          </button>
        </div>
      </div>

      {/* City Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-slate-200 flex-shrink-0">지역 필터:</span>
        <button
          onClick={() => setSelectedCity("ALL")}
          className={`rounded-lg px-3 py-1.5 font-bold flex-shrink-0 transition-all ${
            selectedCity === "ALL"
              ? "bg-slate-100 text-slate-950 font-black shadow"
              : "border border-slate-600 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700"
          }`}
        >
          전체 지역
        </button>
        {ALL_SUPPORTED_CITIES.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCity(c)}
            className={`rounded-lg px-3 py-1.5 font-bold flex-shrink-0 transition-all ${
              selectedCity === c
                ? "bg-slate-100 text-slate-950 font-black shadow"
                : "border border-slate-600 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700"
            }`}
          >
            {CITY_KOREAN_NAMES[c]}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 bg-slate-800/90 text-slate-100 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">사진</th>
                  <th className="p-3.5">체험명 / ID</th>
                  <th className="p-3.5">상태</th>
                  <th className="p-3.5">연계 관광지 (트리거)</th>
                  <th className="p-3.5">지역 / 태그</th>
                  <th className="p-3.5">체험 단가</th>
                  <th className="p-3.5">소요 시간</th>
                  <th className="p-3.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-100 font-medium">
                {filteredActivities.map((act) => {
                  const isItemActive = act.isActive !== false;
                  return (
                    <tr
                      key={act.id}
                      className={`transition-all ${
                        isItemActive
                          ? "hover:bg-slate-800/60"
                          : "hover:bg-slate-900/80 bg-slate-950/50 opacity-60"
                      }`}
                    >
                      <td className="p-3.5">
                        {act.imageUrl ? (
                          <img
                            src={act.imageUrl}
                            alt={act.nameKo}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-600"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-base border border-slate-700">
                            🎭
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">
                          {act.nameKo}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-300">{act.nameEn}</div>
                        <div className="font-mono text-[10px] text-rose-300 mt-0.5">{act.id}</div>
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(act)}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition-all cursor-pointer ${
                            isItemActive
                              ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          {isItemActive ? "노출 중" : "숨김"}
                        </button>
                      </td>
                      <td className="p-3.5">
                        {act.relatedSpotNameKo || act.relatedSpotKey ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 rounded bg-indigo-950/70 border border-indigo-500/40 px-2 py-0.5 font-bold text-indigo-200 text-[11px]">
                              <span>🏛️</span>
                              <span>{act.relatedSpotNameKo || act.relatedSpotKey}</span>
                            </span>
                            {act.relatedSpotKey && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {act.relatedSpotKey}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">미지정 (독립 체험)</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-bold text-slate-200">
                          {CITY_KOREAN_NAMES[act.cityCode] || act.cityCode}
                        </span>
                        <div className="text-[11px] font-medium text-slate-300 mt-1">{act.tag}</div>
                      </td>
                      <td className="p-3.5 font-extrabold text-emerald-300 text-sm">
                        ₩{act.priceKrw?.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-medium text-slate-300">
                        {act.durationTextKo || "-"}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(act)}
                            className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200 hover:border-slate-500 hover:bg-slate-700 hover:text-white transition-all"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(act)}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-all"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🎭</span>
                <span>{editingActivity ? "연계 K-체험 수정" : "새 연계 K-체험 등록"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-200">체험 고유 ID *</label>
                  <input
                    type="text"
                    value={id}
                    disabled={!!editingActivity}
                    onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-200">소속 도시 *</label>
                  <select
                    value={cityCode}
                    onChange={(e: any) => setCityCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none"
                  >
                    {ALL_SUPPORTED_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {CITY_KOREAN_NAMES[c]} ({c})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3.5 space-y-3">
                  <div className="font-bold text-indigo-200 flex items-center justify-between">
                    <span>🏛️ 연계 대상 관광지 매핑 (트리거 명소)</span>
                    <span className="text-[11px] text-indigo-300 font-normal">
                      여행자가 이 명소를 선택하면 연계 체험이 자동 추천됩니다.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-300">도시 내 관광지 선택</label>
                      <select
                        value={relatedSpotKey}
                        onChange={(e) => handleSelectRelatedAttraction(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-indigo-400 focus:outline-none"
                      >
                        <option value="">-- 관광지 직접 입력 또는 선택 안함 --</option>
                        {cityAttractions.map((spot) => (
                          <option key={spot.id} value={spot.id}>
                            {spot.nameKo} ({spot.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-slate-300">연계 관광지 고유 Key / ID</label>
                      <input
                        type="text"
                        placeholder="예: seoul_gyeongbokgung"
                        value={relatedSpotKey}
                        onChange={(e) => setRelatedSpotKey(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-indigo-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-medium text-slate-300">연계 관광지명 (한국어)</label>
                      <input
                        type="text"
                        placeholder="예: 경복궁"
                        value={relatedSpotNameKo}
                        onChange={(e) => setRelatedSpotNameKo(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-indigo-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-medium text-slate-300">연계 관광지명 (영어)</label>
                      <input
                        type="text"
                        placeholder="예: Gyeongbokgung Palace"
                        value={relatedSpotNameEn}
                        onChange={(e) => setRelatedSpotNameEn(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-200">체험명 (한국어) *</label>
                  <input
                    type="text"
                    value={nameKo}
                    onChange={(e) => setNameKo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-200">체험명 (영어)</label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-200">체험 단가 (₩ KRW) *</label>
                  <input
                    type="number"
                    step="1000"
                    value={priceKrw}
                    onChange={(e) => setPriceKrw(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-200">카테고리</label>
                  <select
                    value={categoryType}
                    onChange={(e: any) => setCategoryType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none"
                  >
                    <option value="엔터">엔터 (엔터테인먼트/문화)</option>
                    <option value="명소">명소 (전망대/유적체험)</option>
                    <option value="자연">자연 (크루즈/아웃도어)</option>
                    <option value="쇼핑">쇼핑 (원데이클래스/공예)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-200">대표 태그</label>
                  <input
                    type="text"
                    placeholder="예: K-컬처/인기, 원데이클래스, 야경/크루즈"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-200">소요 시간 (한국어 / 영어)</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="예: 2시간"
                      value={durationTextKo}
                      onChange={(e) => setDurationTextKo(e.target.value)}
                      className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="예: 2 hours"
                      value={durationTextEn}
                      onChange={(e) => setDurationTextEn(e.target.value)}
                      className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-200">사진 이미지 URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none"
                  />
                  {imageUrl && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="h-16 w-16 rounded-xl object-cover border border-slate-600"
                        onError={(e: any) => (e.target.style.display = "none")}
                      />
                      <span className="text-[11px] text-slate-400">이미지 미리보기</span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-200">체험 설명 (한국어)</label>
                  <textarea
                    rows={2}
                    value={descKo}
                    onChange={(e) => setDescKo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-200">체험 설명 (영어)</label>
                  <textarea
                    rows={2}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-medium text-white focus:border-rose-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 font-bold text-slate-200 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-800 text-rose-500 focus:ring-0 h-4 w-4"
                    />
                    <span>플래너에 즉시 노출 (활성화)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-700 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-600 px-4 py-2 font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-2 font-bold text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-pink-500 transition-all"
                >
                  저장 및 즉시 반영
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
