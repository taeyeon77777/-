/**
 * TemplateWhite — 화이트 스테디 버전
 * 순백·크림·골드 팔레트, 미니멀 라인 장식, 우아하고 단정한 레이아웃
 */

interface Photo { id: number; url: string; name: string; }

interface SlotInfo {
  index: number;
  label: string;
  hasPhoto: boolean;
  photo: Photo | null;
  caption: string;
  isActive: boolean;
}

interface TemplateWhiteProps {
  slot: SlotInfo;
  groomName: string;
  brideName: string;
  weddingDate: string;
  onSelectPhoto: () => void;
}

function SceneOpening({ groomName, brideName, weddingDate, caption }: {
  groomName: string; brideName: string; weddingDate: string; caption: string;
}) {
  const dateStr = weddingDate
    ? new Date(weddingDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : "2025년 00월 00일";

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#fafaf8" }}>

      {/* 미세 텍스처 */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(45deg, #c9a96e 25%, transparent 25%), linear-gradient(-45deg, #c9a96e 25%, transparent 25%)",
        backgroundSize: "4px 4px"
      }} />

      {/* 좌상단 코너 장식 */}
      <div className="absolute top-3 left-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M2 2 L2 12 M2 2 L12 2" stroke="#c9a96e" strokeWidth="0.8" strokeLinecap="round"/>
          <circle cx="2" cy="2" r="1" fill="#c9a96e"/>
        </svg>
      </div>
      <div className="absolute top-3 right-3" style={{ transform: "scaleX(-1)" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M2 2 L2 12 M2 2 L12 2" stroke="#c9a96e" strokeWidth="0.8" strokeLinecap="round"/>
          <circle cx="2" cy="2" r="1" fill="#c9a96e"/>
        </svg>
      </div>
      <div className="absolute bottom-3 left-3" style={{ transform: "scaleY(-1)" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M2 2 L2 12 M2 2 L12 2" stroke="#c9a96e" strokeWidth="0.8" strokeLinecap="round"/>
          <circle cx="2" cy="2" r="1" fill="#c9a96e"/>
        </svg>
      </div>
      <div className="absolute bottom-3 right-3" style={{ transform: "scale(-1, -1)" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M2 2 L2 12 M2 2 L12 2" stroke="#c9a96e" strokeWidth="0.8" strokeLinecap="round"/>
          <circle cx="2" cy="2" r="1" fill="#c9a96e"/>
        </svg>
      </div>

      {/* 상단 라인 장식 */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-center gap-2">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, #c9a96e)" }} />
        <div style={{ color: "#c9a96e", fontSize: "0.4rem", letterSpacing: "0.3em" }}>✦</div>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, #c9a96e)" }} />
      </div>

      {/* 타이틀 */}
      <div className="text-center px-10 z-10">
        <div className="mb-1.5" style={{ color: "#a08050", fontSize: "0.35rem", letterSpacing: "0.4em", fontWeight: 400, textTransform: "uppercase" }}>
          Wedding Ceremony
        </div>
        <div className="mb-1" style={{ color: "#1a1a1a", fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {groomName || "신랑"} &amp; {brideName || "신부"}
        </div>
        <div className="mb-2" style={{ color: "#a08050", fontSize: "0.38rem", fontWeight: 400, letterSpacing: "0.05em" }}>
          {dateStr}
        </div>
        {/* 중앙 구분선 */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-px w-10" style={{ background: "#c9a96e" }} />
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M4 0.5 L4.8 3.2 L7.5 3.2 L5.4 4.8 L6.2 7.5 L4 5.8 L1.8 7.5 L2.6 4.8 L0.5 3.2 L3.2 3.2 Z" fill="#c9a96e" opacity="0.6"/>
          </svg>
          <div className="h-px w-10" style={{ background: "#c9a96e" }} />
        </div>
        {caption && (
          <div className="mt-2" style={{ color: "#6b6b6b", fontSize: "0.35rem", fontWeight: 400, fontStyle: "italic" }}>
            {caption}
          </div>
        )}
      </div>

      {/* 하단 라인 장식 */}
      <div className="absolute bottom-8 left-8 right-8 flex items-center justify-center gap-2">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, #c9a96e)" }} />
        <div style={{ color: "#c9a96e", fontSize: "0.4rem", letterSpacing: "0.3em" }}>✦</div>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, #c9a96e)" }} />
      </div>
    </div>
  );
}

function ScenePhoto({ photo, label, caption, isActive, onSelectPhoto }: {
  photo: Photo | null; label: string; caption: string; isActive: boolean;
  onSelectPhoto: () => void;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden"
      style={{ background: "#f8f7f4" }}>

      {/* 좌우 세로 라인 */}
      <div className="absolute left-4 top-4 bottom-4 w-px" style={{ background: "linear-gradient(to bottom, transparent, #c9a96e 20%, #c9a96e 80%, transparent)" }} />
      <div className="absolute right-4 top-4 bottom-4 w-px" style={{ background: "linear-gradient(to bottom, transparent, #c9a96e 20%, #c9a96e 80%, transparent)" }} />

      {/* 상단 레이블 */}
      <div className="absolute top-3 left-0 right-0 flex justify-center">
        <div style={{ color: "#a08050", fontSize: "0.28rem", letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 500 }}>
          {label}
        </div>
      </div>

      {/* 사진 영역 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: "68%", aspectRatio: "4/3" }}>
          {/* 외부 테두리 */}
          <div className="absolute -inset-1.5 border"
            style={{ borderColor: "#c9a96e", borderWidth: "0.5px", opacity: 0.5, borderRadius: "2px" }} />
          {/* 사진 프레임 */}
          <div className="absolute inset-0 overflow-hidden border"
            style={{ borderColor: "#e0d5c0", borderWidth: "1px", borderRadius: "2px" }}>
            {photo ? (
              <img src={photo.url} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                style={{ background: "#f2efe8" }}
                onClick={onSelectPhoto}>
                {/* 십자 아이콘 */}
                <div className="mb-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="9" y="3" width="2" height="14" fill="#c9a96e" opacity="0.4" rx="1"/>
                    <rect x="3" y="9" width="14" height="2" fill="#c9a96e" opacity="0.4" rx="1"/>
                  </svg>
                </div>
                <div style={{ color: "#a08050", fontSize: "0.32rem", fontWeight: 500, letterSpacing: "0.05em" }}>
                  {isActive ? "사진 선택" : "사진 배치"}
                </div>
                <div style={{ color: "#c0b090", fontSize: "0.26rem", marginTop: "2px", letterSpacing: "0.05em" }}>
                  Photo Here
                </div>
              </div>
            )}
          </div>
          {/* 코너 장식 */}
          {!photo && (
            <>
              {[["0 0", "auto auto"], ["auto 0", "0 auto"], ["0 auto", "auto 0"], ["auto auto", "0 0"]].map(([tl, br], i) => (
                <div key={i} className="absolute" style={{
                  top: i < 2 ? "-3px" : "auto", bottom: i >= 2 ? "-3px" : "auto",
                  left: i % 2 === 0 ? "-3px" : "auto", right: i % 2 === 1 ? "-3px" : "auto",
                  width: "8px", height: "8px",
                  borderTop: i < 2 ? "1px solid #c9a96e" : "none",
                  borderBottom: i >= 2 ? "1px solid #c9a96e" : "none",
                  borderLeft: i % 2 === 0 ? "1px solid #c9a96e" : "none",
                  borderRight: i % 2 === 1 ? "1px solid #c9a96e" : "none",
                }} />
              ))}
            </>
          )}
          {/* 교체 버튼 */}
          {photo && isActive && (
            <button onClick={onSelectPhoto}
              className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-white transition-all active:scale-95"
              style={{ background: "rgba(160,128,80,0.85)", fontSize: "0.27rem", fontWeight: 600, borderRadius: "2px", letterSpacing: "0.05em" }}>
              CHANGE
            </button>
          )}
        </div>
      </div>

      {/* 자막 */}
      {caption && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <div style={{ color: "#6b6060", fontSize: "0.32rem", fontWeight: 400, fontStyle: "italic", letterSpacing: "0.03em" }}>
            — {caption} —
          </div>
        </div>
      )}
    </div>
  );
}

function SceneText({ label, caption }: { label: string; caption: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: "#fafaf8" }}>

      {/* 코너 라인 */}
      <div className="absolute top-4 left-4 right-4 h-px"
        style={{ background: "linear-gradient(to right, #c9a96e, transparent 30%, transparent 70%, #c9a96e)" }} />
      <div className="absolute bottom-4 left-4 right-4 h-px"
        style={{ background: "linear-gradient(to right, #c9a96e, transparent 30%, transparent 70%, #c9a96e)" }} />

      <div className="text-center px-10 z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="h-px w-12" style={{ background: "#c9a96e" }} />
          <svg width="6" height="6" viewBox="0 0 6 6" fill="#c9a96e" opacity="0.6">
            <polygon points="3,0 6,3 3,6 0,3"/>
          </svg>
          <div className="h-px w-12" style={{ background: "#c9a96e" }} />
        </div>
        <div style={{ color: "#1a1a1a", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.4 }}>
          {label}
        </div>
        {caption && (
          <div className="mt-1.5" style={{ color: "#888", fontSize: "0.33rem", fontStyle: "italic", fontWeight: 400, lineHeight: 1.7 }}>
            {caption}
          </div>
        )}
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="h-px w-12" style={{ background: "#c9a96e" }} />
          <svg width="6" height="6" viewBox="0 0 6 6" fill="#c9a96e" opacity="0.6">
            <polygon points="3,0 6,3 3,6 0,3"/>
          </svg>
          <div className="h-px w-12" style={{ background: "#c9a96e" }} />
        </div>
      </div>
    </div>
  );
}

export function TemplateWhite({ slot, groomName, brideName, weddingDate, onSelectPhoto }: TemplateWhiteProps) {
  if (slot.index === 0 && !slot.hasPhoto) {
    return <SceneOpening groomName={groomName} brideName={brideName} weddingDate={weddingDate} caption={slot.caption} />;
  }
  if (!slot.hasPhoto) {
    return <SceneText label={slot.label} caption={slot.caption} />;
  }
  return (
    <ScenePhoto
      photo={slot.photo}
      label={slot.label}
      caption={slot.caption}
      isActive={slot.isActive}
      onSelectPhoto={onSelectPhoto}
    />
  );
}
