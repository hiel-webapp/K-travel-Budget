"use client";

import React, { useState, useEffect } from "react";
import { TourCoursePreset, AttractionSpot } from "../../features/budget/catalog/attraction-spots";
import { SupportedCity, ALL_SUPPORTED_CITIES, CITY_KOREAN_NAMES } from "../../lib/trip-domain";

export default function TourCoursePanel() {
  const [courses, setCourses] = useState<TourCoursePreset[]>([]);
  const [allSpots, setAllSpots] = useState<AttractionSpot[]>([]);
  const [selectedCity, setSelectedCity] = useState<SupportedCity | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const fetchCoursesAndSpots = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/catalog?type=ALL");
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

  const filteredCourses = selectedCity === "ALL" ? courses : courses.filter((c) => c.cityCode === selectedCity);
  const citySpotsForModal = allSpots.filter((s) => s.cityCode === cityCode);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🗺️</span> 도시별 투어 코스 관리
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            총 {courses.length}개 코스 등록됨 · 각 코스에 포함될 명소(spotIds)를 클릭 매핑합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex-shrink-0"
        >
          + 새 코스 추가
        </button>
      </div>

      {/* City Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCity("ALL")}
          className={`rounded-lg px-3 py-1 font-semibold flex-shrink-0 ${
            selectedCity === "ALL" ? "bg-slate-200 text-slate-900" : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          전체 도시
        </button>
        {ALL_SUPPORTED_CITIES.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCity(c)}
            className={`rounded-lg px-3 py-1 font-semibold flex-shrink-0 ${
              selectedCity === c ? "bg-slate-200 text-slate-900" : "bg-slate-800 text-slate-400 hover:text-white"
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
            const spotsInCourse = (course.spotIds || [])
              .map((id) => allSpots.find((s) => s.id === id))
              .filter(Boolean);

            return (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                      {CITY_KOREAN_NAMES[course.cityCode] || course.cityCode} · {course.estimatedHours}시간
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{course.nameKo}</h3>
                    <p className="text-xs text-slate-400">{course.nameEn}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(course)}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/20"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2">{course.descKo}</p>

                {/* Spots Chips */}
                <div className="border-t border-slate-800/80 pt-3">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                    포함 명소 ({course.spotIds?.length || 0}개):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {spotsInCourse.map((spot: any) => (
                      <span
                        key={spot.id}
                        className="rounded-lg bg-slate-800 px-2 py-1 text-[10px] text-slate-300 flex items-center gap-1"
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
                  <label className="text-xs font-semibold text-slate-300">코스 고유 ID *</label>
                  <input
                    type="text"
                    value={id}
                    disabled={!!editingCourse}
                    onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">소속 도시 *</label>
                  <select
                    value={cityCode}
                    onChange={(e: any) => setCityCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  >
                    {ALL_SUPPORTED_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {CITY_KOREAN_NAMES[c]} ({c})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">코스명 (한국어) *</label>
                  <input
                    type="text"
                    value={nameKo}
                    onChange={(e) => setNameKo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">코스명 (영어)</label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">코스 설명 (한국어)</label>
                  <textarea
                    rows={2}
                    value={descKo}
                    onChange={(e) => setDescKo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Spots Mapping */}
              <div className="border-t border-slate-800 pt-4">
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  포함할 명소 선택 (해당 도시 등록 명소 {citySpotsForModal.length}개)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-800/40 border border-slate-800">
                  {citySpotsForModal.map((spot) => {
                    const isChecked = spotIds.includes(spot.id);
                    return (
                      <label
                        key={spot.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                          isChecked
                            ? "border-indigo-500 bg-indigo-500/20 text-white"
                            : "border-slate-700 bg-slate-850 text-slate-400 hover:border-slate-600"
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
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
                >
                  {editingCourse ? "수정사항 저장" : "새 코스 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
