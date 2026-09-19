"use client";

import React, { useState, useEffect } from "react";
import { TourCoursePreset, AttractionSpot } from "../../features/budget/catalog/attraction-spots";
import { SupportedCity, ALL_SUPPORTED_CITIES, CITY_KOREAN_NAMES } from "../../lib/trip-domain";
import CompactReorderModal, { ReorderItem } from "./CompactReorderModal";

export default function TourCoursePanel() {
  const [courses, setCourses] = useState<TourCoursePreset[]>([]);
  const [allSpots, setAllSpots] = useState<AttractionSpot[]>([]);
  const [selectedCity, setSelectedCity] = useState<SupportedCity | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState<boolean>(false);

  // Edit/Add modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<TourCoursePreset | null>(null);

  // Form fields
  const [id, setId] = useState<string>("");
  const [cityCode, setCityCode] = useState<SupportedCity>("SEOUL");
  const [nameKo, setNameKo] = useState<string>("");
  const [nameEn, setNameEn] = useState<string>("");
  const [descKo, setDescKo] = useState<string>("");
  const [descEn, setDescEn] = useState<string>("");
  const [spotIds, setSpotIds] = useState<string[]>([]);
  const [estimatedHours, setEstimatedHours] = useState<number>(4);
  const [isActive, setIsActive] = useState<boolean>(true);

  const fetchCoursesAndSpots = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/catalog?type=ALL&includeInactive=true");
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses || []);
        setAllSpots(data.attractions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndSpots();
  }, []);

  const handleToggleActive = async (course: TourCoursePreset) => {
    const nextStatus = course.isActive === false ? true : false;
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "COURSE",
          data: { ...course, isActive: nextStatus },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCourses(courses.map((c) => (c.id === course.id ? { ...c, isActive: nextStatus } : c)));
      } else {
        alert(`상태 변경 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    }
  };

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setId(`course_${Date.now().toString().slice(-6)}`);
    setCityCode(selectedCity !== "ALL" ? selectedCity : "SEOUL");
    setNameKo("");
    setNameEn("");
    setDescKo("");
    setDescEn("");
    setSpotIds([]);
    setEstimatedHours(4);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: TourCoursePreset) => {
    setEditingCourse(course);
    setId(course.id);
    setCityCode(course.cityCode);
    setNameKo(course.nameKo);
    setNameEn(course.nameEn);
    setDescKo(course.descKo);
    setDescEn(course.descEn);
    setSpotIds(course.spotIds || []);
    setEstimatedHours(course.estimatedHours);
    setIsActive(course.isActive !== false);
    setIsModalOpen(true);
  };

  const handleToggleSpotInForm = (spotId: string) => {
    if (spotIds.includes(spotId)) {
      setSpotIds(spotIds.filter((s) => s !== spotId));
    } else {
      setSpotIds([...spotIds, spotId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !nameKo) {
      alert("아이디와 한국어 코스명은 필수입니다.");
      return;
    }

    const payload: TourCoursePreset = {
      id,
      cityCode,
      nameKo,
      nameEn: nameEn || nameKo,
      descKo,
      descEn: descEn || descKo,
      spotIds,
      estimatedHours,
      courseType: "CITY_HIGHLIGHT",
      isActive,
    };

    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "COURSE", data: payload }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchCoursesAndSpots();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    }
  };

  const handleDelete = async (course: TourCoursePreset) => {
    if (!confirm(`투어 코스 "${course.nameKo}" (${course.id})을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/catalog?type=COURSE&id=${course.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCourses(courses.filter((c) => c.id !== course.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCourseReorder = async (orderedIds: string[]) => {
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "REORDER_COURSE",
        orderedIds,
      }),
    });
    const data = await res.json();
    if (data.success) {
      fetchCoursesAndSpots();
    } else {
      throw new Error(data.error || "순서 저장 실패");
    }
  };

  const handleMoveCourse = async (courseId: string, direction: "top" | "up" | "down") => {
    const currentList = [...courses];
    const index = currentList.findIndex((c) => c.id === courseId);
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

    setCourses(currentList);
    try {
      await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "REORDER_COURSE",
          orderedIds: currentList.map((c) => c.id),
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCourses = selectedCity === "ALL" ? courses : courses.filter((c) => c.cityCode === selectedCity);
  const citySpotsForModal = allSpots.filter((s) => s.cityCode === cityCode);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-sm" style={{ color: "#ffffff" }}>
            <span>🧭</span> 도시별 투어 코스 관리
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-200">
            총 {courses.length}개 코스 등록됨 (활성: {courses.filter((c) => c.isActive !== false).length}개, 숨김: {courses.filter((c) => c.isActive === false).length}개) · 각 코스에 포함될 명소(spotIds)를 클릭 매핑합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsReorderModalOpen(true)}
            className="rounded-xl border border-indigo-500/50 bg-indigo-600/25 px-3.5 py-2 text-xs font-bold text-indigo-200 hover:bg-indigo-600/40 hover:text-white transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
          >
            <span>⠿</span>
            <span>
              {selectedCity !== "ALL"
                ? `${CITY_KOREAN_NAMES[selectedCity as SupportedCity] || selectedCity} 코스 순서 정렬`
                : "순서 정렬 (드래그)"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex-shrink-0"
          >
            + 새 코스 추가
          </button>
        </div>
      </div>

      {/* City Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCity("ALL")}
          className={`rounded-lg px-3 py-1.5 font-bold flex-shrink-0 transition-all ${
            selectedCity === "ALL" ? "bg-slate-100 text-slate-950 font-black shadow" : "border border-slate-600 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700"
          }`}
        >
          전체 도시
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

      {/* Courses List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map((course) => {
            const isCourseActive = course.isActive !== false;
            const spotsInCourse = (course.spotIds || [])
              .map((id) => allSpots.find((s) => s.id === id))
              .filter(Boolean);

            return (
              <div
                key={course.id}
                className={`rounded-2xl border p-5 space-y-3 shadow-md transition-all ${
                  isCourseActive
                    ? "border-slate-700 bg-slate-900 hover:border-slate-600"
                    : "border-slate-800 bg-slate-950/70 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-black text-white">
                        #{courses.findIndex((c) => c.id === course.id) + 1}
                      </span>
                      <span className="rounded-md border border-indigo-500/40 bg-indigo-950/70 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300">
                        {CITY_KOREAN_NAMES[course.cityCode] || course.cityCode} · {course.estimatedHours}시간
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          isCourseActive
                            ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}
                      >
                        {isCourseActive ? "노출 중" : "숨김"}
                      </span>
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          type="button"
                          onClick={() => handleMoveCourse(course.id, "top")}
                          className="rounded px-1.5 py-0.5 text-[10px] font-black text-indigo-300 hover:bg-indigo-900/50 hover:text-white"
                          title="맨 위로 (1위) 이동"
                        >
                          Top
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCourse(course.id, "up")}
                          className="rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
                          title="한 칸 위로"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCourse(course.id, "down")}
                          className="rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
                          title="한 칸 아래로"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1.5" style={{ color: "#ffffff" }}>{course.nameKo}</h3>
                    <p className="text-xs font-medium text-slate-300">{course.nameEn}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(course)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
                        isCourseActive
                          ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                          : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {isCourseActive ? "숨기기" : "노출하기"}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(course)}
                      className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/25"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-200 line-clamp-2">{course.descKo}</p>

                {/* Spots Chips */}
                <div className="border-t border-slate-800 pt-3">
                  <div className="text-[11px] font-bold text-slate-200 mb-1.5">
                    포함 명소 ({course.spotIds?.length || 0}개):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {spotsInCourse.map((spot: any) => (
                      <span
                        key={spot.id}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 flex items-center gap-1"
                      >
                        <span>📍</span>
                        <span>{spot.nameKo}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingCourse ? "투어 코스 수정" : "새 투어 코스 등록"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-200">코스 고유 ID *</label>
                  <input
                    type="text"
                    value={id}
                    disabled={!!editingCourse}
                    onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
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
                <div>
                  <label className="text-xs font-bold text-slate-200">코스명 (한국어) *</label>
                  <input
                    type="text"
                    value={nameKo}
                    onChange={(e) => setNameKo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-200">코스명 (영어)</label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-200">코스 설명 (한국어)</label>
                  <textarea
                    rows={2}
                    value={descKo}
                    onChange={(e) => setDescKo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 sm:col-span-2">
                  <input
                    type="checkbox"
                    id="courseIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <label htmlFor="courseIsActive" className="text-xs font-bold text-emerald-400 cursor-pointer">
                    서비스에 노출 (체크 해제 시 숨김 처리)
                  </label>
                </div>
              </div>

              {/* Spots Mapping */}
              <div className="border-t border-slate-700 pt-4">
                <label className="text-xs font-bold text-slate-200 block mb-2">
                  포함할 명소 선택 (해당 도시 등록 명소 {citySpotsForModal.length}개)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                  {citySpotsForModal.map((spot) => {
                    const isChecked = spotIds.includes(spot.id);
                    return (
                      <label
                        key={spot.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "border-indigo-400 bg-indigo-500/25 text-white shadow-sm font-bold"
                            : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 font-medium"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSpotInForm(spot.id)}
                          className="accent-indigo-500"
                        />
                        <span className="truncate">{spot.nameKo}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
                >
                  {editingCourse ? "수정사항 저장" : "새 코스 등록"}
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
            ? `${CITY_KOREAN_NAMES[selectedCity as SupportedCity] || selectedCity} 투어 코스 순서 정렬`
            : "투어 코스 전체 순서 정렬"
        }
        categoryIcon="🧭"
        items={courses.map((c) => ({
          id: c.id,
          titleKo: c.nameKo,
          titleEn: c.nameEn,
          subtitle: `${CITY_KOREAN_NAMES[c.cityCode] || c.cityCode} · ${c.estimatedHours}시간 · 명소 ${c.spotIds?.length || 0}곳`,
        }))}
        onSave={handleSaveCourseReorder}
        noticeText="순서 변경 즉시 저장되며 웹사이트에 실시간 반영됩니다."
      />
    </div>
  );
}
