import { ChevronRight, Save, History } from "lucide-react";

interface InfoData {
  groomName: string;
  brideName: string;
  weddingDate: string;
}

interface StepInfoProps {
  templateTitle: string;
  templateEmoji: string;
  data: InfoData;
  onChange: (data: InfoData) => void;
  onNext: () => void;
  onBack: () => void;
  onTempSave: () => void;
  onGoHistory: () => void;
}

export function StepInfo({ templateTitle, templateEmoji, data, onChange, onNext, onBack, onTempSave, onGoHistory }: StepInfoProps) {
  const isValid = data.groomName.trim() && data.brideName.trim() && data.weddingDate;

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f7]">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 font-medium">STEP 1 / 4</div>
          <div className="font-bold text-gray-900 text-sm">정보 입력</div>
        </div>
        <button onClick={onTempSave}
          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95">
          <Save size={11} /> 임시저장
        </button>
        <button onClick={onGoHistory}
          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95">
          <History size={11} /> 내역
        </button>
        <div className="text-xl">{templateEmoji}</div>
      </header>

      {/* 스텝 인디케이터 */}
      <div className="bg-white border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-1">
          {["정보입력", "사진업로드", "제작하기", "영상다운로드"].map((label, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`flex flex-col items-center flex-1 ${i === 0 ? "" : ""}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-0.5 ${i === 0 ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {i + 1}
                </div>
                <span className={`text-[9px] font-medium ${i === 0 ? "text-rose-500" : "text-gray-400"}`}>{label}</span>
              </div>
              {i < 3 && <div className={`h-px flex-shrink-0 w-3 mb-3 ${i < 0 ? "bg-rose-300" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 px-5 py-6 space-y-5">
        {/* 선택된 템플릿 표시 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-xl border border-rose-100">
            {templateEmoji}
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">선택된 템플릿</div>
            <div className="font-bold text-gray-900 text-sm">{templateTitle}</div>
          </div>
        </div>

        {/* 신랑 이름 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            신랑 이름
          </label>
          <input
            type="text"
            placeholder="신랑 이름을 입력해주세요"
            value={data.groomName}
            onChange={(e) => onChange({ ...data, groomName: e.target.value })}
            className="w-full text-base text-gray-900 placeholder-gray-300 outline-none border-b-2 border-gray-100 focus:border-rose-400 pb-2 transition-colors bg-transparent"
          />
        </div>

        {/* 신부 이름 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            신부 이름
          </label>
          <input
            type="text"
            placeholder="신부 이름을 입력해주세요"
            value={data.brideName}
            onChange={(e) => onChange({ ...data, brideName: e.target.value })}
            className="w-full text-base text-gray-900 placeholder-gray-300 outline-none border-b-2 border-gray-100 focus:border-rose-400 pb-2 transition-colors bg-transparent"
          />
        </div>

        {/* 결혼식 날짜 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            결혼식 날짜
          </label>
          <input
            type="date"
            value={data.weddingDate}
            onChange={(e) => onChange({ ...data, weddingDate: e.target.value })}
            className="w-full text-base text-gray-900 outline-none border-b-2 border-gray-100 focus:border-rose-400 pb-2 transition-colors bg-transparent"
          />
          {data.weddingDate && (
            <div className="mt-3 text-xs text-rose-400 font-medium">
              {new Date(data.weddingDate).toLocaleDateString("ko-KR", {
                year: "numeric", month: "long", day: "numeric", weekday: "long",
              })}
            </div>
          )}
        </div>

        {/* 미리보기 */}
        {(data.groomName || data.brideName) && (
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-100 p-5 text-center">
            <div className="text-xs text-rose-400 font-medium mb-2">영상 타이틀 미리보기</div>
            <div className="text-xl font-bold text-gray-800">
              {data.groomName || "신랑"} ♥ {data.brideName || "신부"}
            </div>
            {data.weddingDate && (
              <div className="text-sm text-gray-500 mt-1">
                {new Date(data.weddingDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-8 pt-4 bg-white border-t border-gray-100">
        <button
          onClick={onNext}
          disabled={!isValid}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
            isValid
              ? "bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          다음 단계로 <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
