import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Play, Pause, SkipBack, SkipForward, Film, Music, Trash2, ChevronUp, ChevronDown, ArrowLeft, Check } from "lucide-react";

interface Slide {
  id: number;
  url: string;
  name: string;
  duration: number;
}

const TEMPLATES = [
  { value: "wedding", label: "결혼식 식전영상", emoji: "💍", accent: "#6366f1" },
  { value: "firstbirthday", label: "돌잔치 성장동영상", emoji: "🎂", accent: "#f59e0b" },
  { value: "sixty", label: "환갑/칠순 감사영상", emoji: "🎊", accent: "#8b5cf6" },
  { value: "graduation", label: "졸업식 기념영상", emoji: "🎓", accent: "#3b82f6" },
  { value: "birthday", label: "생일파티 영상", emoji: "🎉", accent: "#10b981" },
  { value: "company", label: "기업행사 영상", emoji: "🏢", accent: "#64748b" },
];

const BGMS = [
  { value: "bright", label: "밝고 경쾌한 음악", desc: "신나는 분위기" },
  { value: "emotional", label: "감동적인 피아노 곡", desc: "잔잔한 감동" },
  { value: "reverent", label: "잔잔하고 엄숙한 곡", desc: "엄숙하고 경건한" },
  { value: "romantic", label: "로맨틱 현악 4중주", desc: "우아하고 감미로운" },
  { value: "children", label: "밝고 귀여운 동요풍", desc: "어린이 분위기" },
];

interface VideoEditorProps {
  onBack: () => void;
}

export function VideoEditor({ onBack }: VideoEditorProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("wedding");
  const [selectedBgm, setSelectedBgm] = useState("bright");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [renderState, setRenderState] = useState<"idle" | "rendering" | "done">("idle");
  const [renderProgress, setRenderProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalTime = slides.reduce((acc, s) => acc + s.duration, 0);
  const template = TEMPLATES.find((t) => t.value === selectedTemplate)!;

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (slides.length === 0) return;
    setIsPlaying(true);
    let idx = currentSlideIndex;
    let elapsed = 0;

    intervalRef.current = setInterval(() => {
      elapsed += 0.1;
      if (elapsed >= slides[idx]?.duration) {
        elapsed = 0;
        idx = (idx + 1) % slides.length;
        setCurrentSlideIndex(idx);
        if (idx === 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPlaying(false);
        }
      }
    }, 100);
  }, [slides, currentSlideIndex]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const newSlides: Slide[] = Array.from(files).map((file, i) => ({
      id: Date.now() + i,
      url: URL.createObjectURL(file),
      name: file.name,
      duration: 3,
    }));
    setSlides((prev) => [...prev, ...newSlides]);
    setCurrentSlideIndex(0);
    stopPlayback();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const updateDuration = (index: number, delta: number) => {
    setSlides((prev) =>
      prev.map((s, i) => i === index ? { ...s, duration: Math.max(1, Math.min(10, s.duration + delta)) } : s)
    );
  };

  const removeSlide = (index: number) => {
    setSlides((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (currentSlideIndex >= next.length) setCurrentSlideIndex(Math.max(0, next.length - 1));
      return next;
    });
    stopPlayback();
  };

  const requestRender = () => {
    if (slides.length === 0) return;
    setRenderState("rendering");
    setRenderProgress(0);
    const iv = setInterval(() => {
      setRenderProgress((p) => {
        if (p >= 100) { clearInterval(iv); setRenderState("done"); return 100; }
        return p + 1.5;
      });
    }, 60);
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors text-sm">
            <ArrowLeft size={16} /> 돌아가기
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-lg">{template.emoji}</span>
            <span className="font-semibold text-gray-800">{template.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">총 {totalTime}초 · {slides.length}장</span>
          {renderState === "idle" && (
            <button
              onClick={requestRender}
              disabled={slides.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={slides.length > 0 ? { backgroundColor: template.accent, color: "white" } : { backgroundColor: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed" }}
            >
              <Film size={15} /> MP4 다운로드
            </button>
          )}
          {renderState === "rendering" && (
            <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2">
              <div className="w-24 h-1.5 bg-gray-300 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-200" style={{ width: `${renderProgress}%`, backgroundColor: template.accent }} />
              </div>
              <span className="text-sm text-gray-600">{renderProgress.toFixed(0)}%</span>
            </div>
          )}
          {renderState === "done" && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <Check size={15} /> 완성!
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors">
                ⬇ MP4 저장
              </button>
              <button onClick={() => setRenderState("idle")} className="text-xs text-gray-400 hover:text-gray-600 px-2">다시</button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
          {/* Template */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">템플릿 주제</p>
            <div className="space-y-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedTemplate(t.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all text-sm ${selectedTemplate === t.value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* BGM */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Music size={11} /> 배경음악 (BGM)
            </p>
            <div className="space-y-1">
              {BGMS.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setSelectedBgm(b.value)}
                  className={`w-full flex flex-col px-3 py-2 rounded-lg text-left transition-all ${selectedBgm === b.value ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50 border border-transparent"}`}
                >
                  <span className="text-sm text-gray-800">{b.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{b.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div className="p-4 flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Upload size={11} /> 사진 업로드
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all text-center ${isDragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}`}
            >
              <Upload size={20} className="text-gray-400" />
              <p className="text-xs text-gray-500">클릭 또는 드래그</p>
              <p className="text-xs text-gray-400">JPG · PNG · WEBP</p>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
          </div>
        </aside>

        {/* Center: Preview */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          <div className="flex-1 flex items-center justify-center p-8 relative">
            {currentSlide ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="bg-black rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: "16/9", maxHeight: "100%", maxWidth: "100%" }}>
                  <img
                    key={currentSlide.id}
                    src={currentSlide.url}
                    alt={currentSlide.name}
                    className="w-full h-full object-contain"
                    style={{ animation: "fadeIn 0.35s ease" }}
                  />
                </div>
                {/* Dot indicators */}
                {slides.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
                    {slides.map((_, i) => (
                      <button key={i} onClick={() => { setCurrentSlideIndex(i); stopPlayback(); }}
                        className={`rounded-full transition-all ${i === currentSlideIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-gray-400">
                <div className="w-20 h-20 bg-white rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Film size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">사진을 업로드하면 미리보기가 표시됩니다</p>
                <p className="text-sm text-gray-400">왼쪽 패널에서 사진을 추가하세요</p>
              </div>
            )}
          </div>

          {/* Playback controls */}
          {slides.length > 0 && (
            <div className="bg-white border-t border-gray-200 px-6 py-2.5 flex items-center gap-3">
              <button onClick={() => { setCurrentSlideIndex(0); stopPlayback(); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <SkipBack size={15} />
              </button>
              <button
                onClick={() => isPlaying ? stopPlayback() : startPlayback()}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-white"
                style={{ backgroundColor: template.accent }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>
              <button onClick={() => { setCurrentSlideIndex(slides.length - 1); stopPlayback(); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <SkipForward size={15} />
              </button>
              <div className="flex-1 h-1 bg-gray-200 rounded-full mx-2">
                <div className="h-full rounded-full transition-all" style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%`, backgroundColor: template.accent }} />
              </div>
              <span className="text-xs text-gray-400">{currentSlideIndex + 1} / {slides.length}</span>
            </div>
          )}

          {/* Timeline */}
          <div className="h-36 bg-white border-t border-gray-200 overflow-x-auto">
            {slides.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">타임라인이 비어있습니다</div>
            ) : (
              <div className="flex gap-2 p-3 h-full items-center">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    onClick={() => { setCurrentSlideIndex(index); stopPlayback(); }}
                    className={`relative flex-shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all border-2 group ${index === currentSlideIndex ? "border-indigo-500 shadow-md" : "border-gray-200 hover:border-gray-400"}`}
                    style={{ width: "88px", height: "88px" }}
                  >
                    <img src={slide.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all" />
                    <div className="absolute top-1 left-1.5 text-xs text-white/80 font-medium drop-shadow">{index + 1}</div>
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/50 flex items-center justify-between">
                      <span className="text-xs text-white">{slide.duration}s</span>
                      <div className="flex gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); updateDuration(index, -1); }} className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/20 text-white/80">
                          <ChevronDown size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); updateDuration(index, 1); }} className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/20 text-white/80">
                          <ChevronUp size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeSlide(index); }} className="w-4 h-4 rounded flex items-center justify-center hover:bg-red-500/70 text-white/80">
                          <Trash2 size={9} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Add more */}
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors">
                  <Upload size={16} />
                  <span className="text-xs">추가</span>
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
