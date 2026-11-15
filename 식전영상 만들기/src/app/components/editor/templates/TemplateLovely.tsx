/**
 * TemplateLovely — 러블리 버전
 * 따뜻한 로즈·피치·골드 팔레트, 플로럴 장식, 둥글고 생동감 있는 레이아웃
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

interface TemplateLovelyProps {
  slot: SlotInfo;
  groomName: string;
  brideName: string;
  weddingDate: string;
  onSelectPhoto: () => void;
}

// 장면 유형에 따라 다른 레이아웃을 보여주는 서브 장면들
function SceneOpening({ groomName, brideName, weddingDate, caption }: {
  groomName: string; brideName: string; weddingDate: string; caption: string;
}) {
  const dateStr = weddingDate
    ? new Date(weddingDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : "2025년 00월 00일";

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #fff0f5 0%, #fce4f0 40%, #ffd6e7 70%, #ffe8d6 100%)" }}>
      {/* 배경 장식 원들 */}
      <div className="absolute top-0 left-0 w-32 h-32 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #ff8fab, transparent)", transform: "translate(-30%, -30%)" }} />
      <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #ffb3c6, transparent)", transform: "translate(30%, 30%)" }} />
      <div className="absolute top-1/4 right-0 w-24 h-24 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #ffd6a5, transparent)", transform: "translateX(40%)" }} />

      {/* 상단 플로럴 장식 */}
      <div className="absolute top-3 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-1 opacity-60">
          <span style={{ fontSize: "0.7rem" }}>🌸</span>
          <div className="h-px w-8" style={{ background: "linear-gradient(to right, transparent, #ffb3c6)" }} />
          <span style={{ fontSize: "0.55rem" }}>✿</span>
          <div className="h-px w-8" style={{ background: "linear-gradient(to left, transparent, #ffb3c6)" }} />
          <span style={{ fontSize: "0.7rem" }}>🌸</span>
        </div>
      </div>

      {/* 메인 타이틀 */}
      <div className="text-center px-6 z-10">
        <div className="mb-2" style={{ color: "#e87a9a", fontSize: "0.45rem", letterSpacing: "0.25em", fontWeight: 600, textTransform: "uppercase" }}>
          Wedding Story
        </div>
        <div className="mb-1" style={{ color: "#c94d73", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {groomName || "신랑"} ♥ {brideName || "신부"}
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #f4a4bb)" }} />
          <span style={{ color: "#f4a4bb", fontSize: "0.45rem" }}>✦</span>
          <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, #f4a4bb)" }} />
        </div>
        <div style={{ color: "#d47a99", fontSize: "0.42rem", fontWeight: 500 }}>{dateStr}</div>
        {caption && (
          <div className="mt-2 px-3 py-1 rounded-full inline-block"
            style={{ background: "rgba(255,179,198,0.3)", color: "#c94d73", fontSize: "0.38rem", fontWeight: 500 }}>
            {caption}
          </div>
        )}
      </div>

      {/* 하단 장식 */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-1 opacity-50">
          <span style={{ fontSize: "0.5rem" }}>🌿</span>
          <span style={{ fontSize: "0.4rem", color: "#d4a4bb" }}>· · ·</span>
          <span style={{ fontSize: "0.6rem" }}>🌹</span>
          <span style={{ fontSize: "0.4rem", color: "#d4a4bb" }}>· · ·</span>
          <span style={{ fontSize: "0.5rem" }}>🌿</span>
        </div>
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
      style={{ background: "linear-gradient(135deg, #fff8fb 0%, #ffeef5 100%)" }}>

      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle, #ff8fab 1px, transparent 1px)",
        backgroundSize: "20px 20px"
      }} />

      {/* 상단 장식 바 */}
      <div className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: "linear-gradient(to right, #ffb3c6, #ffd6a5, #ffb3c6)" }} />

      {/* 좌측 장식 */}
      <div className="absolute left-2 top-0 bottom-0 flex flex-col items-center justify-center gap-1">
        <div className="w-0.5 h-8" style={{ background: "linear-gradient(to bottom, transparent, #ffb3c6, transparent)" }} />
        <span className="opacity-40" style={{ fontSize: "0.5rem" }}>🌸</span>
        <div className="w-0.5 h-8" style={{ background: "linear-gradient(to bottom, transparent, #ffb3c6, transparent)" }} />
      </div>

      {/* 사진 영역 — 중앙 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: "72%", aspectRatio: "4/3" }}>
          {/* 사진 프레임 그림자 */}
          <div className="absolute inset-0 rounded-2xl opacity-20"
            style={{ background: "#ffb3c6", transform: "translate(4px, 4px)", borderRadius: "16px" }} />
          {/* 메인 프레임 */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden border-2"
            style={{ borderColor: "#ffd6e7", borderRadius: "16px" }}>
            {photo ? (
              <img src={photo.url} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                style={{ background: "linear-gradient(135deg, #fff0f5, #ffe4ef)" }}
                onClick={onSelectPhoto}>
                <div className="mb-1" style={{ fontSize: "1.5rem", opacity: 0.4 }}>🌸</div>
                <div style={{ color: "#d4849d", fontSize: "0.38rem", fontWeight: 600, letterSpacing: "0.05em" }}>
                  {isActive ? "탭하여 사진 선택" : "사진을 배치하세요"}
                </div>
                <div style={{ color: "#e8a4bb", fontSize: "0.3rem", marginTop: "2px" }}>{label}</div>
              </div>
            )}
            {/* 코너 장식 */}
            {!photo && (
              <>
                <div className="absolute top-1 left-1" style={{ color: "#ffb3c6", fontSize: "0.4rem" }}>✿</div>
                <div className="absolute top-1 right-1" style={{ color: "#ffb3c6", fontSize: "0.4rem" }}>✿</div>
                <div className="absolute bottom-1 left-1" style={{ color: "#ffb3c6", fontSize: "0.4rem" }}>✿</div>
                <div className="absolute bottom-1 right-1" style={{ color: "#ffb3c6", fontSize: "0.4rem" }}>✿</div>
              </>
            )}
          </div>
          {/* 선택 버튼 (사진 있을 때 교체) */}
          {photo && isActive && (
            <button onClick={onSelectPhoto}
              className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-white active:scale-95 transition-all"
              style={{ background: "rgba(201,77,115,0.85)", fontSize: "0.3rem", fontWeight: 700 }}>
              교체
            </button>
          )}
        </div>
      </div>

      {/* 자막 */}
      {caption && (
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center">
          <div className="px-3 py-0.5 rounded-full"
            style={{ background: "rgba(255,179,198,0.7)", color: "#8b3254", fontSize: "0.35rem", fontWeight: 600, backdropFilter: "blur(4px)" }}>
            {caption}
          </div>
        </div>
      )}

      {/* 레이블 */}
      <div className="absolute top-2.5 left-0 right-0 flex justify-center">
        <div style={{ color: "#e8a4bb", fontSize: "0.3rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {label}
        </div>
      </div>

      {/* 하단 장식 바 */}
      <div className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: "linear-gradient(to right, #ffd6a5, #ffb3c6, #ffd6a5)" }} />
    </div>
  );
}

function SceneText({ label, caption }: { label: string; caption: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #fff5f8 0%, #fce8f1 100%)" }}>

      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle, #ff8fab 1px, transparent 1px)",
        backgroundSize: "15px 15px"
      }} />

      <div className="text-center z-10 px-8">
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="h-px w-8" style={{ background: "#ffb3c6" }} />
          <span style={{ color: "#f4a4bb", fontSize: "0.6rem" }}>✦</span>
          <div className="h-px w-8" style={{ background: "#ffb3c6" }} />
        </div>
        <div style={{ color: "#c94d73", fontSize: "0.65rem", fontWeight: 800, lineHeight: 1.3 }}>{label}</div>
        {caption && (
          <div className="mt-1.5" style={{ color: "#e8a4bb", fontSize: "0.38rem", fontWeight: 400, lineHeight: 1.6 }}>
            {caption}
          </div>
        )}
        <div className="mt-2 flex items-center justify-center gap-1 opacity-50">
          <span style={{ fontSize: "0.5rem" }}>🌸</span>
          <span style={{ fontSize: "0.45rem" }}>🌸</span>
          <span style={{ fontSize: "0.5rem" }}>🌸</span>
        </div>
      </div>
    </div>
  );
}

export function TemplateLovely({ slot, groomName, brideName, weddingDate, onSelectPhoto }: TemplateLovelyProps) {
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
