import { useRef, useState, useEffect, useCallback } from "react";
import { Film, ChevronRight, ChevronLeft, Check, X, Type, Grid, ImagePlus, Lock, Save, History, Play, Pause, LayoutTemplate } from "lucide-react";
import { TemplateLovely } from "./templates/TemplateLovely";
import { TemplateWhite } from "./templates/TemplateWhite";

interface Photo { id: number; url: string; name: string; }

interface Slot {
  index: number;
  label: string;
  desc: string;
  hasPhoto: boolean;
  hasCaption: boolean;
  photo: Photo | null;
  caption: string;
}

interface StepArrangeProps {
  templateTitle: string;
  templateEmoji: string;
  templateEn: string;
  templateId?: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  requiredPhotos: number;
  uploadedPhotos: Photo[];
  isAdmin?: boolean;
  onNext: (slots: Slot[]) => void;
  onBack: () => void;
  onTempSave: (slots: Slot[]) => void;
  onGoHistory: () => void;
  onGoAdmin?: () => void;
}

function getTemplateTheme(templateId?: string): "lovely" | "white" {
  if (!templateId) return "lovely";
  return ["w1", "w3", "b1", "p1", "t2"].includes(templateId) ? "lovely" : "white";
}

const SLOT_DEFS: {
  label: string; desc: string; defaultCaption: string;
  hasPhoto: boolean; hasCaption: boolean;
  lyrics?: string; // 노래 가사 (챕터별 실시간 자막)
}[] = [
  { label: "오프닝 타이틀",    desc: "두 분의 이름과 날짜가 자동으로 표시됩니다",  defaultCaption: "",                          hasPhoto: false, hasCaption: false, lyrics: "♪ 우리 함께한 모든 순간들..." },
  { label: "어린시절 (신랑)",  desc: "신랑의 어릴 때 사진",                       defaultCaption: "작은 소년이 있었습니다",     hasPhoto: true,  hasCaption: true,  lyrics: "♪ 작은 손으로 세상을 꿈꾸던..." },
  { label: "어린시절 (신부)",  desc: "신부의 어릴 때 사진",                       defaultCaption: "작은 소녀가 있었습니다",     hasPhoto: true,  hasCaption: true,  lyrics: "♪ 빛나는 눈으로 내일을 바라보던..." },
  { label: "어린시절 (신랑)",  desc: "신랑 유년 시절 2번째",                      defaultCaption: "",                          hasPhoto: true,  hasCaption: false, lyrics: "♪ 그 시절 아무것도 몰랐지만..." },
  { label: "어린시절 (신부)",  desc: "신부 유년 시절 2번째",                      defaultCaption: "",                          hasPhoto: true,  hasCaption: false, lyrics: "♪ 어딘가에서 너도 자라고 있었겠지..." },
  { label: "학창시절 (신랑)",  desc: "신랑 학창 시절 사진",                       defaultCaption: "꿈을 키워가던 시절",         hasPhoto: true,  hasCaption: true,  lyrics: "♪ 꿈을 향해 달려가던 그때..." },
  { label: "학창시절 (신부)",  desc: "신부 학창 시절 사진",                       defaultCaption: "",                          hasPhoto: true,  hasCaption: false, lyrics: "♪ 너의 이름도 몰랐던 그 시절..." },
  { label: "인연의 시작",      desc: "구분선 장면 — 자동으로 표시됩니다",          defaultCaption: "그렇게 두 사람이 만났습니다", hasPhoto: false, hasCaption: true,  lyrics: "♪ 운명처럼 우리는 만났어..." },
  { label: "만남",             desc: "두 분이 처음 만났을 때 사진",               defaultCaption: "",                          hasPhoto: true,  hasCaption: false, lyrics: "♪ 처음 본 순간 심장이 뛰었어..." },
  { label: "데이트",           desc: "함께한 데이트 사진",                        defaultCaption: "함께하는 모든 순간이 설레었습니다", hasPhoto: true, hasCaption: true, lyrics: "♪ 너와 함께라면 어디든 좋아..." },
  { label: "데이트",           desc: "데이트 2번째",                              defaultCaption: "",                          hasPhoto: true,  hasCaption: false, lyrics: "♪ 매일매일이 기적 같았어..." },
  { label: "여행",             desc: "함께 떠난 여행 사진",                       defaultCaption: "어디든 함께라면 괜찮았습니다", hasPhoto: true, hasCaption: true, lyrics: "♪ 손을 잡고 떠나는 여행..." },
  { label: "여행",             desc: "여행 2번째",                               defaultCaption: "",                          hasPhoto: true,  hasCaption: false, lyrics: "♪ 우리만의 특별한 추억..." },
  { label: "프로포즈",         desc: "프로포즈 순간 사진",                        defaultCaption: "평생 함께해줄래요?",         hasPhoto: true,  hasCaption: true,  lyrics: "♪ 이 말을 하기 위해 얼마나 기다렸는지..." },
  { label: "결혼준비",         desc: "결혼 준비 과정 사진",                       defaultCaption: "새로운 시작을 준비합니다",   hasPhoto: true,  hasCaption: true,  lyrics: "♪ 새로운 시작을 준비하며..." },
  { label: "결혼준비",         desc: "결혼 준비 2번째",                           defaultCaption: "",                          hasPhoto: true,  hasCaption: false, lyrics: "♪ 설레는 마음으로 하루하루..." },
  { label: "가족사진 (신랑)",  desc: "신랑 가족 사진",                            defaultCaption: "사랑하는 가족과 함께",       hasPhoto: true,  hasCaption: true,  lyrics: "♪ 사랑으로 키워준 소중한 가족..." },
  { label: "가족사진 (신부)",  desc: "신부 가족 사진",                            defaultCaption: "",                          hasPhoto: true,  hasCaption: false, lyrics: "♪ 언제나 내 곁에 있어줬어..." },
  { label: "웨딩촬영",         desc: "웨딩 촬영 1번째",                           defaultCaption: "",                          hasPhoto: true,  hasCaption: false, lyrics: "♪ 가장 아름다운 우리의 모습..." },
  { label: "웨딩촬영 (엔딩)",  desc: "마지막 엔딩 컷",                            defaultCaption: "영원히, 함께",               hasPhoto: true,  hasCaption: true,  lyrics: "♪ 이제 우리 함께 걸어가요 영원히..." },
];

const BG_COLORS = [
  "from-rose-300 to-pink-400","from-sky-300 to-blue-400","from-purple-300 to-pink-400",
  "from-indigo-300 to-sky-400","from-violet-300 to-purple-400","from-amber-300 to-orange-400",
  "from-red-300 to-rose-400","from-teal-300 to-green-400","from-pink-300 to-rose-400",
  "from-cyan-300 to-sky-400","from-blue-300 to-indigo-400","from-green-300 to-teal-400",
  "from-rose-400 to-red-500","from-orange-300 to-amber-400","from-lime-300 to-green-400",
  "from-indigo-300 to-blue-400","from-fuchsia-300 to-pink-400",
  "from-rose-400 to-pink-500","from-rose-400 to-pink-500","from-rose-500 to-pink-600",
];

/** 3초 프리뷰 진행 바 + 실시간 가사 훅 */
function usePreviewBar(active: boolean) {
  const [progress, setProgress] = useState(0);   // 0~1
  const [playing, setPlaying]   = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const DURATION = 3000; // ms

  const start = useCallback(() => {
    setPlaying(true);
    startRef.current = performance.now() - progress * DURATION;
    const tick = (now: number) => {
      const p = Math.min((now - startRef.current) / DURATION, 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [progress]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setProgress(0);
  }, []);

  // 챕터 바뀌면 자동 리셋
  useEffect(() => { reset(); }, [active]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { progress, playing, start, stop, reset };
}

export function StepArrange({
  templateTitle, templateEmoji, templateEn, templateId,
  groomName, brideName, weddingDate,
  requiredPhotos, uploadedPhotos, isAdmin, onNext, onBack, onTempSave, onGoHistory, onGoAdmin,
}: StepArrangeProps) {
  const theme = getTemplateTheme(templateId);
  const slotCount = Math.min(requiredPhotos, SLOT_DEFS.length);

  const [slots, setSlots] = useState<Slot[]>(() =>
    Array.from({ length: slotCount }, (_, i) => ({
      index: i,
      label: SLOT_DEFS[i].label,
      desc: SLOT_DEFS[i].desc,
      hasPhoto: SLOT_DEFS[i].hasPhoto,
      hasCaption: SLOT_DEFS[i].hasCaption,
      photo: null,
      caption: SLOT_DEFS[i].defaultCaption,
    }))
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showGrid,    setShowGrid]    = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const slot = slots[currentIdx];
  const photoSlots      = slots.filter(s => s.hasPhoto);
  const completedCount  = photoSlots.filter(s => s.photo).length;
  const totalPhotoSlots = photoSlots.length;
  const assignedIds     = new Set(slots.map(s => s.photo?.id).filter(Boolean));

  const { progress, playing, start, stop, reset } = usePreviewBar(currentIdx);

  const lyrics = SLOT_DEFS[currentIdx]?.lyrics ?? "";

  // 가사 글자 애니메이션: progress 0→1 에 맞춰 점점 표시
  const lyricsVisible = Math.round(lyrics.length * Math.min(progress * 1.5, 1));
  const lyricsDisplay = playing ? lyrics.slice(0, lyricsVisible) : lyrics;

  const goTo = (idx: number) => {
    reset();
    setCurrentIdx(Math.max(0, Math.min(slotCount - 1, idx)));
    setShowCaption(false);
    setTimeout(() => {
      const el = stripRef.current?.children[idx] as HTMLElement;
      el?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
    }, 50);
  };

  const assignPhoto = (photo: Photo) => {
    setSlots(prev => prev.map(s => s.index === currentIdx ? { ...s, photo } : s));
    setShowPicker(false);
  };
  const removePhoto = () => {
    setSlots(prev => prev.map(s => s.index === currentIdx ? { ...s, photo: null } : s));
  };
  const updateCaption = (val: string) => {
    setSlots(prev => prev.map(s => s.index === currentIdx ? { ...s, caption: val } : s));
  };

  /* ── 전체 장면 그리드 ── */
  if (showGrid) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
          <button onClick={() => setShowGrid(false)} className="text-gray-400 hover:text-white p-1">
            <X size={20} />
          </button>
          <div className="flex-1 text-white font-bold text-sm">전체 장면 보기</div>
          <span className="text-xs text-gray-400">{completedCount}/{totalPhotoSlots}컷</span>
        </header>
        <div className="flex-1 grid grid-cols-3 gap-0.5 p-0.5 overflow-y-auto pb-4">
          {slots.map((s, i) => (
            <div key={i} onClick={() => { setShowGrid(false); goTo(i); }}
              className={`relative cursor-pointer ${currentIdx === i ? "ring-2 ring-rose-400 ring-inset" : ""}`}
              style={{ aspectRatio: "16/9" }}
            >
              {s.hasPhoto && s.photo ? (
                <img src={s.photo.url} alt="" className="w-full h-full object-cover" />
              ) : s.hasPhoto ? (
                <div className={`w-full h-full bg-gradient-to-br ${BG_COLORS[i % BG_COLORS.length]} flex items-center justify-center`}>
                  <ImagePlus size={14} className="text-white/40" />
                </div>
              ) : (
                <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center gap-1">
                  <Lock size={10} className="text-gray-500" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 flex items-center justify-between">
                <p className="text-white text-[7px] truncate">Ch.{String(i+1).padStart(2,"0")} {s.label}</p>
                {s.hasPhoto && s.photo && <Check size={7} className="text-green-400 flex-shrink-0" />}
              </div>
              {currentIdx === i && (
                <div className="absolute top-1 left-1 bg-rose-500 text-white text-[7px] font-bold px-1 rounded">NOW</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── 메인 편집 뷰 ── */
  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">

      {/* 헤더 */}
      <header className="bg-gray-900 border-b border-gray-800 px-3 py-2 flex items-center gap-2 flex-shrink-0 z-30">
        <button onClick={onBack} className="text-gray-400 hover:text-white p-1 flex-shrink-0">
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm truncate">{templateEmoji} {templateTitle}</div>
          <div className="text-gray-400 text-[10px]">{groomName} ♥ {brideName}</div>
        </div>
        <button onClick={() => onTempSave(slots)}
          className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 flex-shrink-0">
          <Save size={11} /> 임시저장
        </button>
        <button onClick={onGoHistory}
          className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 flex-shrink-0">
          <History size={11} /> 내역
        </button>
        {/* 관리자 전용 — 템플릿 편집기 바로가기 */}
        {isAdmin && onGoAdmin && (
          <button
            onClick={onGoAdmin}
            title="템플릿 편집기"
            className="flex items-center justify-center w-7 h-7 bg-rose-600 hover:bg-rose-500 active:scale-90 rounded-lg transition-all flex-shrink-0 shadow-lg shadow-rose-900/50"
          >
            <LayoutTemplate size={13} className="text-white" />
          </button>
        )}
        <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
          completedCount === totalPhotoSlots ? "bg-green-500/20 text-green-400" : "bg-rose-500/20 text-rose-400"
        }`}>
          {completedCount}/{totalPhotoSlots}
        </div>
      </header>

      {/* ── 영상 프리뷰 ── */}
      <div className="flex-1 bg-gray-950 flex flex-col items-center justify-center overflow-hidden min-h-0">
        <div className="relative w-full" style={{ aspectRatio: "16/9", maxHeight: "100%" }}>

          {/* 템플릿 */}
          {theme === "lovely" ? (
            <TemplateLovely
              slot={{ index: currentIdx, label: slot.label, hasPhoto: slot.hasPhoto, photo: slot.photo, caption: slot.caption, isActive: true }}
              groomName={groomName} brideName={brideName} weddingDate={weddingDate}
              onSelectPhoto={() => setShowPicker(true)}
            />
          ) : (
            <TemplateWhite
              slot={{ index: currentIdx, label: slot.label, hasPhoto: slot.hasPhoto, photo: slot.photo, caption: slot.caption, isActive: true }}
              groomName={groomName} brideName={brideName} weddingDate={weddingDate}
              onSelectPhoto={() => setShowPicker(true)}
            />
          )}

          {/* 챕터 배지 */}
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20 pointer-events-none flex items-center gap-1">
            <span className="text-rose-400">Ch.{String(currentIdx+1).padStart(2,"0")}</span>
            <span className="text-gray-400">·</span>
            <span>{slot.label}</span>
          </div>

          {/* 사진 제거 */}
          {slot.hasPhoto && slot.photo && (
            <button onClick={removePhoto}
              className="absolute top-2 right-2 bg-black/50 hover:bg-red-600/80 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-all backdrop-blur-sm z-20">
              <X size={8} /> 제거
            </button>
          )}

          {/* 편집 상태 배지 */}
          <div className="absolute bottom-10 left-2 z-20 pointer-events-none">
            {slot.hasPhoto && !slot.photo ? (
              <div className="bg-rose-600/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> 편집중
              </div>
            ) : slot.hasPhoto && slot.photo ? (
              <div className="bg-green-600/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check size={8} /> 완료
              </div>
            ) : slot.hasCaption ? (
              <div className="bg-indigo-600/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Type size={8} /> 자막 편집 가능
              </div>
            ) : (
              <div className="bg-gray-700/80 backdrop-blur-sm text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock size={8} /> 고정 장면
              </div>
            )}
          </div>

          {/* 실시간 가사 자막 */}
          {lyrics && (
            <div className="absolute bottom-8 left-0 right-0 z-20 pointer-events-none px-4 flex justify-center">
              <div className="bg-black/65 backdrop-blur-sm rounded-lg px-3 py-1 max-w-[90%]">
                <p className="text-white text-[11px] font-medium text-center leading-snug tracking-wide" style={{ minHeight: "1.4em" }}>
                  {lyricsDisplay}
                  {playing && lyricsVisible < lyrics.length && (
                    <span className="inline-block w-0.5 h-3 bg-white/80 ml-0.5 animate-pulse align-middle" />
                  )}
                </p>
              </div>
            </div>
          )}

          {/* 3초 진행바 */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            {/* 배경 트랙 */}
            <div className="w-full h-1 bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-rose-400 to-pink-400 transition-none"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* 재생 / 일시정지 버튼 */}
          <button
            onClick={() => playing ? stop() : start()}
            className="absolute bottom-3 right-3 z-30 w-8 h-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all active:scale-90"
          >
            {playing
              ? <Pause size={13} className="text-white" />
              : <Play size={13} className="text-white ml-0.5" />
            }
          </button>

          {/* 클릭해서 사진 선택 */}
          {slot.hasPhoto && !slot.photo && (
            <button onClick={() => setShowPicker(true)} className="absolute inset-0 z-10 cursor-pointer" aria-label="사진 선택" />
          )}
        </div>

        {/* 슬롯 설명 */}
        <div className="w-full px-4 py-1.5 flex items-center gap-2">
          <span className="text-gray-500 text-[10px] truncate flex-1">{slot.desc}</span>
          {!slot.hasPhoto && <span className="text-gray-600 text-[9px] flex items-center gap-0.5 flex-shrink-0"><Lock size={8} /> 고정</span>}
        </div>
      </div>

      {/* ── 자막 편집 패널 ── */}
      {showCaption && slot.hasCaption && (
        <div className="bg-gray-900 border-t border-gray-700 px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Type size={12} className="text-indigo-400" />
            <span className="text-xs text-indigo-300 font-bold">자막 편집</span>
            <span className="text-xs text-gray-600 ml-1">· {slot.label}</span>
            <button onClick={() => setShowCaption(false)} className="ml-auto text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <input
            autoFocus type="text" value={slot.caption}
            onChange={e => updateCaption(e.target.value)}
            placeholder="이 장면의 자막을 입력하세요" maxLength={40}
            className="w-full bg-gray-800 text-white placeholder-gray-600 border border-gray-700 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-500">영상 하단에 표시됩니다</span>
            <span className="text-[10px] text-gray-500">{slot.caption.length}/40</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          하단 챕터 썸네일 스트립 (파스텔무비 스타일)
      ══════════════════════════════════ */}
      <div className="bg-[#111] border-t border-gray-800 flex-shrink-0">
        {/* 스트립 레이블 */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <span className="text-[10px] text-gray-500 font-bold tracking-wider">CHAPTERS</span>
          <span className="text-[10px] text-gray-600">{completedCount}/{totalPhotoSlots} 완료</span>
        </div>

        {/* 썸네일 리스트 */}
        <div ref={stripRef} className="flex gap-2 px-3 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {slots.map((s, i) => {
            const isActive = i === currentIdx;
            const isDone   = s.hasPhoto && !!s.photo;
            const isFixed  = !s.hasPhoto;
            return (
              <div
                key={i}
                onClick={() => goTo(i)}
                className={`relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                  isActive
                    ? "ring-2 ring-rose-400 shadow-lg shadow-rose-900/60 scale-105"
                    : isDone
                    ? "ring-1 ring-green-600/50"
                    : isFixed
                    ? "ring-1 ring-gray-800 opacity-60"
                    : "ring-1 ring-gray-700"
                }`}
                style={{ width: 68, flexShrink: 0 }}
              >
                {/* 썸네일 이미지 */}
                <div style={{ aspectRatio: "16/9", width: "100%" }}>
                  {isDone ? (
                    <img src={s.photo!.url} alt="" className="w-full h-full object-cover" />
                  ) : isFixed ? (
                    <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center gap-0.5">
                      <Lock size={9} className="text-gray-600" />
                    </div>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${BG_COLORS[i % BG_COLORS.length]} flex items-center justify-center`}>
                      <ImagePlus size={10} className="text-white/40" />
                    </div>
                  )}
                </div>

                {/* 챕터 레이블 */}
                <div className={`px-1 py-0.5 text-center ${isActive ? "bg-rose-600" : isDone ? "bg-green-900/80" : "bg-gray-900"}`}>
                  <p className="text-white text-[7px] font-bold leading-none">
                    Chapter #{String(i+1).padStart(2,"0")}
                  </p>
                  <p className={`text-[6px] leading-none mt-0.5 truncate ${isActive ? "text-rose-200" : "text-gray-500"}`}>
                    {s.label}
                  </p>
                </div>

                {/* 완료 체크 */}
                {isDone && (
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center shadow">
                    <Check size={8} className="text-white" />
                  </div>
                )}

                {/* 현재 재생중 표시 */}
                {isActive && playing && (
                  <div className="absolute top-1 left-1 flex gap-0.5 items-end h-3">
                    {[0,1,2].map(j => (
                      <div key={j} className="w-0.5 bg-rose-400 rounded-full"
                        style={{ height: `${40 + j*20}%`, animation: `bounce ${0.6 + j*0.15}s ease-in-out infinite alternate` }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 하단 컨트롤 바 ── */}
      <div className="bg-gray-950 border-t border-gray-800 px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
        <button onClick={() => goTo(currentIdx - 1)} disabled={currentIdx === 0}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            currentIdx === 0 ? "text-gray-700 cursor-not-allowed" : "text-white bg-gray-800 hover:bg-gray-700 active:scale-95"
          }`}>
          <ChevronLeft size={14} /> 이전
        </button>

        <div className="flex-1 flex gap-1.5 justify-center">
          <button onClick={() => setShowGrid(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 text-white hover:bg-gray-700 active:scale-95 transition-all">
            <Grid size={12} /> 전체장면
          </button>
          <button
            onClick={() => slot.hasCaption && setShowCaption(!showCaption)}
            disabled={!slot.hasCaption}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              !slot.hasCaption ? "bg-gray-900 text-gray-700 cursor-not-allowed"
              : showCaption ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-white hover:bg-gray-700"
            } active:scale-95`}>
            {slot.hasCaption ? <Type size={12} /> : <Lock size={12} />} 자막
          </button>
        </div>

        {currentIdx < slotCount - 1 ? (
          <button onClick={() => goTo(currentIdx + 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 text-white hover:bg-gray-700 active:scale-95 transition-all">
            다음 <ChevronRight size={14} />
          </button>
        ) : (
          <button onClick={() => onNext(slots)} disabled={completedCount === 0}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              completedCount > 0 ? "bg-rose-500 text-white hover:bg-rose-600 active:scale-95 shadow-lg shadow-rose-900/50" : "bg-gray-800 text-gray-600"
            }`}>
            <Film size={13} /> 제작
          </button>
        )}
      </div>

      {/* 전체 진행률 바 */}
      <div className="h-1 bg-gray-900 flex-shrink-0">
        <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
          style={{ width: `${totalPhotoSlots > 0 ? (completedCount / totalPhotoSlots) * 100 : 0}%` }} />
      </div>

      {/* 사진 선택 모달 */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 480, margin: "0 auto" }}>
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPicker(false)} />
          <div className="relative bg-gray-900 rounded-t-3xl pt-4 pb-8 z-10" style={{ maxHeight: "60vh" }}>
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between px-5 mb-4">
              <div>
                <div className="text-white font-bold text-sm">사진 선택</div>
                <div className="text-gray-400 text-xs">Chapter #{String(currentIdx+1).padStart(2,"0")} · {slot.label}</div>
              </div>
              <button onClick={() => setShowPicker(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            {uploadedPhotos.length > 0 ? (
              <div className="overflow-y-auto px-4" style={{ maxHeight: "calc(60vh - 100px)" }}>
                <div className="grid grid-cols-3 gap-2 pb-2">
                  {uploadedPhotos.map(photo => {
                    const isCurrent = slot.photo?.id === photo.id;
                    const isUsed    = assignedIds.has(photo.id) && !isCurrent;
                    return (
                      <div key={photo.id} onClick={() => assignPhoto(photo)}
                        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all active:scale-95 ${
                          isCurrent ? "border-rose-500 ring-2 ring-rose-400/50"
                          : isUsed  ? "border-gray-700 opacity-50"
                          : "border-transparent hover:border-white/40"
                        }`}
                        style={{ aspectRatio: "1" }}>
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-rose-500/30 flex items-center justify-center">
                            <div className="w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center">
                              <Check size={14} className="text-white" />
                            </div>
                          </div>
                        )}
                        {isUsed && (
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded">사용중</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-gray-600 mt-3">이미 배치된 사진도 중복 선택 가능합니다</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <ImagePlus size={32} className="text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm mb-1">업로드된 사진이 없습니다</p>
                <p className="text-gray-600 text-xs">이전 단계로 돌아가 사진을 먼저 올려주세요</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
