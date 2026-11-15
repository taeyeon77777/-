import { useState, useEffect } from "react";
import { Download, Share2, Check, Film, Copy, CreditCard, Shield, Eye, Pencil, Lock, History, FileVideo } from "lucide-react";
import { DraftStatus } from "../../utils/draftStorage";

interface StepResultProps {
  groomName: string;
  brideName: string;
  weddingDate: string;
  templateTitle: string;
  templateEmoji: string;
  fixedBgm: string;
  photoCount: number;
  videoStatus: DraftStatus;   // draft | preview | paid
  onRevise: () => void;       // 시안 수정하기 (draft/preview만)
  onPaid: () => void;
  onRestart: () => void;
  onGoHistory: () => void;
}

const PROGRESS_STEPS = [
  { label: "사진 분석 중",     duration: 900 },
  { label: "템플릿 적용 중",   duration: 800 },
  { label: "자막 합성 중",     duration: 600 },
  { label: "BGM 합성 중",     duration: 1100 },
  { label: "영상 인코딩 중",   duration: 1300 },
  { label: "최종 렌더링 중",   duration: 800 },
];

export function StepResult({
  groomName, brideName, weddingDate,
  templateTitle, templateEmoji, fixedBgm, photoCount,
  videoStatus, onRevise, onPaid, onRestart, onGoHistory,
}: StepResultProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [payProcessing, setPayProcessing] = useState(false);
  const [paid, setPaid] = useState(videoStatus === "paid");
  const [copied, setCopied] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [reviseCount, setReviseCount] = useState(0); // 수정 횟수 (무제한)

  // 렌더링 진행 애니메이션
  useEffect(() => {
    const totalDuration = PROGRESS_STEPS.reduce((a, s) => a + s.duration, 0);
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += 80;
      setProgress(Math.min((elapsed / totalDuration) * 100, 100));
      let acc = 0;
      for (let i = 0; i < PROGRESS_STEPS.length; i++) {
        acc += PROGRESS_STEPS[i].duration;
        if (elapsed < acc) { setCurrentStep(i); break; }
      }
      if (elapsed >= totalDuration) {
        clearInterval(timer);
        setProgress(100);
        setCurrentStep(PROGRESS_STEPS.length);
        setTimeout(() => setIsDone(true), 400);
      }
    }, 80);
    return () => clearInterval(timer);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://moafilm.kr/preview/${Date.now()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = () => {
    setShowPayModal(false);
    setPayProcessing(true);
    setTimeout(() => {
      setPayProcessing(false);
      setPaid(true);
      onPaid();
    }, 2500);
  };

  const handleRevise = () => {
    setReviseCount((c) => c + 1);
    onRevise();
  };

  const fmtDate = weddingDate
    ? new Date(weddingDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f7]">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <div className="flex-1">
          <div className="text-xs text-gray-400 font-medium">STEP 4 / 4</div>
          <div className="font-bold text-gray-900 text-sm">
            {paid ? "최종 영상 다운로드" : "시안 영상 미리보기"}
          </div>
        </div>
        <span className="text-xl">{templateEmoji}</span>
        {/* 제작 내역 바로가기 */}
        <button onClick={onGoHistory}
          className="flex items-center gap-1 text-gray-400 hover:text-gray-700 text-xs px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-all">
          <History size={13} /> 내역
        </button>
      </header>

      {/* 스텝 인디케이터 */}
      <div className="bg-white border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-1">
          {["정보입력", "사진업로드", "제작하기", "영상다운로드"].map((label, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-0.5 ${
                  i < 3 ? "bg-rose-200 text-rose-500" : "bg-rose-500 text-white"
                }`}>{i < 3 ? "✓" : "4"}</div>
                <span className={`text-[9px] font-medium ${i === 3 ? "text-rose-500" : "text-rose-300"}`}>{label}</span>
              </div>
              {i < 3 && <div className="h-px flex-shrink-0 w-3 mb-3 bg-rose-200" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 pb-10">

        {!isDone ? (
          /* ── 렌더링 중 ── */
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-rose-200">
              <Film size={32} className="text-white" style={{ animation: "spin 2s linear infinite" }} />
            </div>
            <div className="font-bold text-gray-900 text-lg mb-1">시안 영상 생성 중...</div>
            <div className="text-sm text-gray-500 mb-5">
              {groomName} ♥ {brideName}의 소중한 영상을<br />정성껏 만들고 있어요
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>{PROGRESS_STEPS[Math.min(currentStep, PROGRESS_STEPS.length - 1)]?.label}</span>
                <span className="font-bold text-rose-500">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="space-y-2 mt-5 text-left">
              {PROGRESS_STEPS.map((s, i) => (
                <div key={i} className={`flex items-center gap-2.5 text-xs ${
                  i < currentStep ? "text-rose-300" : i === currentStep ? "text-gray-700 font-semibold" : "text-gray-200"
                }`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                    i < currentStep ? "bg-rose-100" : i === currentStep ? "bg-rose-500" : "bg-gray-100"
                  }`}>
                    {i < currentStep
                      ? <Check size={9} className="text-rose-500" />
                      : <div className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? "bg-white animate-pulse" : "bg-gray-300"}`} />}
                  </div>
                  {s.label}
                </div>
              ))}
            </div>
            <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700 leading-relaxed">
              <span className="font-bold">시안 영상은 무제한 수정 가능합니다.</span><br />
              만족하실 때까지 자유롭게 수정하신 후 최종 결제하세요.
            </div>
          </div>

        ) : paid ? (
          /* ── 결제 완료 → 최종 영상 (수정 불가) ── */
          <>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-6 text-white text-center shadow-xl shadow-green-200">
              <div className="text-4xl mb-3">🎉</div>
              <div className="font-extrabold text-xl mb-1">최종 영상 완성!</div>
              <div className="text-sm opacity-90 mb-1">워터마크 없는 FHD 영상이 준비됐습니다</div>
              <div className="text-sm font-bold">{groomName} ♥ {brideName}</div>
              {/* 최종 영상 수정 불가 안내 */}
              <div className="mt-3 bg-white/20 rounded-xl px-3 py-2 flex items-center justify-center gap-2">
                <Lock size={12} />
                <span className="text-xs font-semibold">최종 영상은 수정이 불가능합니다</span>
              </div>
            </div>

            {/* 영상 스펙 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <FileVideo size={13} className="text-indigo-500" /> 영상 정보
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["파일 형식", "MP4 (H.264)"],
                  ["해상도", "1920 × 1080"],
                  ["화질", "FHD 1080p"],
                  ["비율", "16 : 9"],
                  ["BGM", fixedBgm],
                  ["사진 수", `${photoCount}장`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="text-[10px] text-gray-400 mb-0.5">{k}</div>
                    <div className="text-xs font-bold text-gray-800 truncate">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
              <button className="w-full py-4 rounded-2xl font-bold bg-green-500 text-white flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-200 active:scale-95">
                <Download size={18} /> FHD MP4 다운로드
              </button>
              <button onClick={handleCopyLink}
                className="w-full py-3 rounded-2xl font-semibold bg-gray-50 text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-100 transition-all border border-gray-200">
                {copied ? <><Check size={15} className="text-green-500" /> 링크 복사됨!</> : <><Share2 size={15} /> 공유 링크 복사</>}
              </button>
              <button onClick={onGoHistory}
                className="w-full py-3 rounded-2xl font-semibold bg-gray-50 text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-100 transition-all border border-gray-200 text-sm">
                <History size={14} /> 제작 내역 보기
              </button>
            </div>

            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-4 leading-relaxed">
              · 다운로드 링크는 결제일로부터 7일간 유효합니다.<br />
              · 영상은 개인 소장 목적으로만 사용해 주세요.<br />
              · 문의는 카카오톡 채널을 이용해 주세요.
            </div>

            <button onClick={onRestart}
              className="w-full py-3 rounded-2xl font-semibold text-gray-500 border border-gray-200 bg-white hover:bg-gray-50 transition-all text-sm">
              새 영상 만들기
            </button>
          </>

        ) : (
          /* ── 시안 완성 → 무제한 수정 가능 ── */
          <>
            {/* 시안 안내 배너 */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
              <Pencil size={15} className="text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-indigo-700 mb-0.5">시안 영상 · 무제한 수정 가능</div>
                <p className="text-[11px] text-indigo-600 leading-relaxed">
                  만족하실 때까지 <strong>횟수 제한 없이</strong> 사진·자막을 수정하실 수 있습니다.<br />
                  최종 결제 후에는 수정이 불가능하오니, 충분히 확인 후 결제해 주세요.
                </p>
              </div>
            </div>

            {reviseCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 flex items-center gap-2">
                <Pencil size={12} /> 총 <strong>{reviseCount}회</strong> 수정하셨습니다 · 아직 무제한 수정 가능
              </div>
            )}

            {/* 워터마크 샘플 미리보기 */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-lg">
              <div className="relative" style={{ aspectRatio: "16/9" }}>
                <div className="w-full h-full bg-gradient-to-br from-rose-900 via-gray-900 to-pink-900 flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <div className="text-3xl mb-2">{templateEmoji}</div>
                    <div className="text-sm font-bold opacity-70">{groomName} ♥ {brideName}</div>
                    <div className="text-xs opacity-40 mt-1">시안 미리보기</div>
                  </div>
                </div>
                {/* 단일 워터마크 (오른쪽 하단) */}
                <div className="absolute bottom-3 right-3 pointer-events-none select-none text-right">
                  <div className="text-white/70 font-extrabold text-lg leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">© 모아필름</div>
                  <div className="text-white/50 font-bold text-[10px] tracking-widest drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">SAMPLE</div>
                </div>
                {/* 상단 배지 */}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  360p SAMPLE
                </div>
                <div className="absolute top-2 right-2 bg-indigo-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <Pencil size={8} /> 수정 가능
                </div>
                {/* 중앙 재생 아이콘 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                    <Eye size={20} className="text-white" />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm">{groomName} ♥ {brideName}</div>
                  <div className="text-white/50 text-xs">{fmtDate}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-xs">{templateTitle}</div>
                  <div className="text-white/30 text-[10px]">360p · SAMPLE</div>
                </div>
              </div>
            </div>

            {/* 영상 스펙 안내 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <FileVideo size={13} className="text-indigo-500" /> 최종 영상 스펙
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["파일 형식", "MP4 (H.264)"],
                  ["해상도", "1920 × 1080"],
                  ["화질", "FHD 1080p"],
                  ["비율", "16 : 9"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="text-[10px] text-gray-400 mb-0.5">{k}</div>
                    <div className="text-xs font-bold text-gray-800">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-[10px] text-amber-700 leading-relaxed">
                · 시안은 360p 워터마크 샘플 · 결제 후 FHD 1080p MP4 즉시 다운로드
              </div>
            </div>

            {/* 시안 수정하기 버튼 */}
            <div className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Pencil size={14} className="text-indigo-500" />
                <div className="text-sm font-bold text-gray-900">시안 수정하기</div>
                <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full ml-auto">무제한</span>
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                사진 배치, 자막 등을 자유롭게 수정할 수 있습니다.<br />
                수정 후 다시 시안을 확인하세요.
              </p>
              <button onClick={handleRevise}
                className="w-full py-3 rounded-xl font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
                <Pencil size={15} /> 사진·자막 수정하러 가기
              </button>
            </div>

            {/* 공유 링크 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Share2 size={11} /> 시안 링크 공유 (워터마크 포함)
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-400 font-mono truncate">
                  moafilm.kr/preview/{groomName.slice(0, 2) || "xx"}
                </div>
                <button onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    copied ? "bg-green-500 text-white" : "bg-rose-500 text-white hover:bg-rose-600"
                  }`}>
                  {copied ? <><Check size={12} /> 복사됨</> : <><Copy size={12} /> 복사</>}
                </button>
              </div>
            </div>

            {/* 결제 안내 */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-4 text-white">
                <div className="font-bold text-base mb-0.5">최종 영상 받기</div>
                <div className="text-sm opacity-85">결제 후 FHD 1920×1080 MP4 즉시 다운로드</div>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { icon: "✓", text: "워터마크 완전 제거" },
                  { icon: "✓", text: "FHD 1920×1080 MP4 파일" },
                  { icon: "✓", text: "16:9 비율 · H.264 인코딩" },
                  { icon: "✓", text: "결제 후 7일간 재다운로드" },
                  { icon: "🔒", text: "결제 후 영상 수정 불가" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className={`font-bold ${f.icon === "🔒" ? "text-amber-500" : "text-indigo-500"}`}>{f.icon}</span> {f.text}
                  </div>
                ))}
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-2xl font-extrabold text-gray-900">9,900원</span>
                  <span className="text-gray-400 text-sm">/ 1회</span>
                </div>
                <button onClick={() => setShowPayModal(true)}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2">
                  <CreditCard size={17} /> 결제하고 최종 영상 받기
                </button>
                <p className="text-[10px] text-center text-gray-400">네이버페이 · 카카오페이 · 카드 결제 가능</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 결제 모달 */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowPayModal(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-[480px] mx-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-lg text-gray-900">최종 영상 결제</div>
              <button onClick={() => setShowPayModal(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">✕</button>
            </div>
            {/* 최종 결제 = 수정 불가 경고 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
              <Lock size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>결제 후에는 영상 수정이 불가능합니다.</strong><br />
                시안을 충분히 확인하신 후 결제해 주세요.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-2">
              {[
                ["상품명", `${templateTitle} · ${groomName} ♥ ${brideName}`],
                ["해상도", "FHD 1920×1080 · MP4"],
                ["결제 금액", "9,900원"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-900">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 mb-4">
              {[
                { label: "네이버페이", color: "bg-[#03C75A]", emoji: "N" },
                { label: "카카오페이", color: "bg-[#FEE500]", emoji: "K", dark: true },
                { label: "신용카드", color: "bg-gray-800", emoji: "💳" },
              ].map((btn) => (
                <button key={btn.label} onClick={handlePay}
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 ${btn.color} ${btn.dark ? "text-gray-900" : "text-white"} hover:opacity-90 transition-all active:scale-95`}>
                  <span>{btn.emoji}</span> {btn.label}로 결제
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 text-center">결제 시 이용약관 및 환불정책에 동의합니다</p>
          </div>
        </div>
      )}

      {/* 결제 처리 중 */}
      {payProcessing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 text-center w-64 shadow-2xl">
            <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="font-bold text-gray-900 mb-1">결제 처리 중...</div>
            <div className="text-sm text-gray-500">잠시만 기다려주세요</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
