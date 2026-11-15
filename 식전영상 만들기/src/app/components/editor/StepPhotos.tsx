import { useRef, useState } from "react";
import { Upload, X, ChevronRight, Music, Clock, Image, Lock, AlertCircle, Save, History } from "lucide-react";

interface UploadedPhoto {
  id: number;
  url: string;
  name: string;
}

interface StepPhotosProps {
  templateTitle: string;
  templateEmoji: string;
  templateEn: string;
  fixedBgm: string;
  fixedBgmArtist: string;
  duration: string;
  requiredPhotos: number;   // 템플릿 필수 장수 (예: 30)
  maxPhotos: number;        // 최대 업로드 (requiredPhotos + 20)
  photos: UploadedPhoto[];
  onPhotosChange: (photos: UploadedPhoto[]) => void;
  onNext: () => void;
  onBack: () => void;
  onTempSave: () => void;
  onGoHistory: () => void;
}

export function StepPhotos({
  templateTitle, templateEmoji, templateEn,
  fixedBgm, fixedBgmArtist,
  duration, requiredPhotos, maxPhotos,
  photos, onPhotosChange, onNext, onBack, onTempSave, onGoHistory,
}: StepPhotosProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const spareSlots = maxPhotos - requiredPhotos; // 여분 (20장)

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = maxPhotos - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);
    const newPhotos: UploadedPhoto[] = toAdd.map((f, i) => ({
      id: Date.now() + i,
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    onPhotosChange([...photos, ...newPhotos]);
  };

  const removePhoto = (id: number) => {
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  const uploaded = photos.length;
  const isEnough = uploaded >= requiredPhotos;
  const progressPct = Math.min((uploaded / requiredPhotos) * 100, 100);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f7]">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 p-1">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 font-medium">STEP 2 / 4</div>
          <div className="font-bold text-gray-900 text-sm">사진 업로드</div>
        </div>
        <button onClick={onTempSave}
          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 flex-shrink-0">
          <Save size={11} /> 임시저장
        </button>
        <button onClick={onGoHistory}
          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 flex-shrink-0">
          <History size={11} /> 내역
        </button>
        <span className={`text-sm font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${isEnough ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-500"}`}>
          {uploaded}/{maxPhotos}장
        </span>
      </header>

      {/* 스텝 인디케이터 */}
      <div className="bg-white border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-1">
          {["정보입력", "사진업로드", "사진배치", "영상다운로드"].map((label, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-0.5 ${
                  i < 1 ? "bg-rose-200 text-rose-500" : i === 1 ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-400"
                }`}>{i < 1 ? "✓" : i + 1}</div>
                <span className={`text-[9px] font-medium ${i === 1 ? "text-rose-500" : i < 1 ? "text-rose-300" : "text-gray-400"}`}>{label}</span>
              </div>
              {i < 3 && <div className={`h-px flex-shrink-0 w-3 mb-3 ${i < 1 ? "bg-rose-200" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 py-5 space-y-4 pb-36">

        {/* 템플릿 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-rose-400 to-pink-500 px-5 py-4 text-white flex items-center gap-3">
            <span className="text-2xl">{templateEmoji}</span>
            <div>
              <div className="text-[10px] opacity-75 tracking-widest uppercase font-light">{templateEn}</div>
              <div className="font-bold text-base">{templateTitle}</div>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {/* 고정 BGM */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Music size={14} className="text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-gray-700">노래 (고정)</span>
                  <span className="flex items-center gap-0.5 bg-amber-100 text-amber-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    <Lock size={8} /> 변경불가
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-900 truncate">{fixedBgm}</div>
                <div className="text-xs text-gray-400">{fixedBgmArtist}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Clock size={13} className="text-rose-400" />
                <div>
                  <div className="text-[10px] text-gray-400">재생 시간</div>
                  <div className="text-xs font-bold text-gray-800">{duration}</div>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Image size={13} className="text-rose-400" />
                <div>
                  <div className="text-[10px] text-gray-400">필요 사진</div>
                  <div className="text-xs font-bold text-gray-800">{requiredPhotos}장</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 업로드 장수 안내 카드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle size={15} className="text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-gray-800 mb-1">업로드 안내</div>
              <p className="text-xs text-gray-500 leading-relaxed">
                이 템플릿은 <strong className="text-gray-800">총 {requiredPhotos}장</strong>의 사진이 사용됩니다.<br />
                여분 포함 최대 <strong className="text-gray-800">{maxPhotos}장</strong>까지 업로드할 수 있으며,<br />
                다음 단계에서 각 장면에 사진을 직접 배치합니다.
              </p>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="mb-1.5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">업로드 현황</span>
              <span className={`font-bold ${isEnough ? "text-green-500" : "text-rose-500"}`}>
                {uploaded}장 / 필수 {requiredPhotos}장
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isEnough ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-rose-400 to-pink-500"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0장</span>
              <span className="text-rose-400 font-medium">필수 {requiredPhotos}장</span>
              <span>여분 포함 {maxPhotos}장</span>
            </div>
          </div>
        </div>

        {/* 사진 업로드 영역 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-gray-900">사진 선택</div>
            {uploaded > 0 && (
              <button
                onClick={() => onPhotosChange([])}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >전체 삭제</button>
            )}
          </div>

          {/* 드래그앤드롭 */}
          {uploaded < maxPhotos && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all mb-4 ${
                isDragging ? "border-rose-400 bg-rose-50" : "border-gray-200 hover:border-rose-300 hover:bg-rose-50/30"
              }`}
            >
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center">
                <Upload size={24} className="text-rose-400" />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-gray-700 mb-1">사진을 선택하거나 드래그하세요</div>
                <div className="text-xs text-gray-400">JPG · PNG · HEIC · 한 번에 여러 장 선택 가능</div>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="bg-rose-50 text-rose-500 px-2.5 py-1 rounded-full font-medium">
                  필수 {requiredPhotos}장
                </span>
                <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                  최대 {maxPhotos}장 (여분 {spareSlots}장 포함)
                </span>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />

          {/* 업로드된 사진 그리드 */}
          {uploaded > 0 && (
            <>
              <div className="text-xs text-gray-400 font-medium mb-2">
                업로드된 사진 ({uploaded}장) — 다음 단계에서 각 슬롯에 배치합니다
              </div>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo, idx) => (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-black/50 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                      {idx + 1}
                    </div>
                    <button onClick={() => removePhoto(photo.id)}
                      className="absolute top-1 right-1 w-4 h-4 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                      <X size={8} className="text-white" />
                    </button>
                  </div>
                ))}
                {uploaded < maxPhotos && (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-rose-300 hover:bg-rose-50/30 transition-all">
                    <Upload size={14} className="text-gray-400" />
                    <span className="text-[9px] text-gray-400">추가</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* 주의사항 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-rose-400 rounded-full" />
            <div className="text-xs font-bold text-gray-800">업로드 주의사항</div>
          </div>
          <ul className="space-y-2.5">
            {[
              { icon: "📷", text: <>식전영상에는 총 <strong className="text-gray-900">{requiredPhotos}장</strong>의 사진이 사용됩니다.</> },
              { icon: "⬆️", text: <>사진은 최대 <strong className="text-gray-900">{maxPhotos}장</strong>까지 업로드 가능합니다.</> },
              { icon: "🔁", text: <>사진이 부족한 경우 일부 사진이 <strong className="text-gray-900">중복 사용</strong>될 수 있습니다.</> },
              { icon: "✨", text: <>원활한 제작을 위해 <strong className="text-gray-900">고화질 원본 사진</strong> 업로드를 권장합니다.</> },
              { icon: "✂️", text: <>사진 비율에 따라 일부 영역이 잘리거나 확대되어 사용될 수 있습니다.</> },
              { icon: "⚠️", text: <>업로드 후 사진 변경은 제작 진행 상황에 따라 제한될 수 있습니다.</> },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-sm flex-shrink-0 leading-tight mt-px">{item.icon}</span>
                <span className="text-xs text-gray-600 leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-8 pt-4 bg-white border-t border-gray-100 z-30">
        <button onClick={onNext} disabled={uploaded === 0}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
            uploaded > 0
              ? "bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}>
          {isEnough ? "사진 배치하러 가기" : `${uploaded}장으로 다음 단계`}
          <ChevronRight size={18} />
        </button>
        {!isEnough && uploaded > 0 && (
          <p className="text-center text-xs text-amber-600 mt-2">
            {requiredPhotos - uploaded}장 부족 · 중복 사용으로 계속 가능합니다
          </p>
        )}
      </div>
    </div>
  );
}
