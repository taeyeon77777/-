import { useState, useRef } from "react";
import { Play, ChevronRight, Film, History, Star, Lock, Eye, EyeOff, LayoutTemplate, Users } from "lucide-react";

const ADMIN_PASSWORD = "wls68803523!"; // 관리자 비밀번호

interface LandingPageProps {
  onStart: (templateId?: string) => void;
  onGoHistory: () => void;
  onGoAdmin?: () => void;
  isAdmin?: boolean;
}

type TabKey = "wedding" | "firstbirthday" | "propose" | "parents" | "history";

const TABS: { key: TabKey; emoji: string; label: string }[] = [
  { key: "wedding",       emoji: "💍", label: "식전영상"           },
  { key: "firstbirthday", emoji: "🎂", label: "돌잔치 식전영상"    },
  { key: "propose",       emoji: "💐", label: "프로포즈 영상"      },
  { key: "parents",       emoji: "🙏", label: "부모님 감사 편지"   },
  { key: "history",       emoji: "📋", label: "제작 내역"          },
];

interface TemplateCard {
  id: string;
  tab: Exclude<TabKey, "history">;
  titleEn: string;
  titleKo: string;
  duration: string;
  photoCount: number;
  thumb: string;
  bgm: string;
  bgmArtist: string;
  tags: string[];
}

const TEMPLATES: TemplateCard[] = [
  /* ── 식전영상 (결혼식) ── */
  {
    id: "w1", tab: "wedding",
    titleEn: "Eternal Love", titleKo: "영원한 사랑",
    duration: "3분 30초", photoCount: 25,
    thumb: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    bgm: "A Thousand Years", bgmArtist: "Christina Perri",
    tags: ["우아해요", "감동적이에요"],
  },
  {
    id: "w2", tab: "wedding",
    titleEn: "Our Story", titleKo: "우리의 이야기",
    duration: "4분 00초", photoCount: 25,
    thumb: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    bgm: "Can't Help Falling in Love", bgmArtist: "Elvis Presley",
    tags: ["깔끔해요", "특별해요"],
  },
  {
    id: "w3", tab: "wedding",
    titleEn: "Always & Forever", titleKo: "언제나 함께",
    duration: "2분 50초", photoCount: 25,
    thumb: "https://images.unsplash.com/photo-1576694667642-6f289dd54187?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    bgm: "Perfect", bgmArtist: "Ed Sheeran",
    tags: ["로맨틱해요", "감성적이에요"],
  },
  {
    id: "w4", tab: "wedding",
    titleEn: "Sweet Memories", titleKo: "달콤한 추억",
    duration: "3분 10초", photoCount: 25,
    thumb: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    bgm: "All of Me", bgmArtist: "John Legend",
    tags: ["따뜻해요", "클래식해요"],
  },

  /* ── 돌잔치 식전영상 ── */
  {
    id: "b1", tab: "firstbirthday",
    titleEn: "First Year", titleKo: "첫 번째 생일",
    duration: "3분 00초", photoCount: 18,
    thumb: "https://images.unsplash.com/flagged/photo-1571275460369-dc7c65c85082?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    bgm: "You Are My Sunshine", bgmArtist: "동요 클래식",
    tags: ["귀여워요", "사랑스러워요"],
  },
  {
    id: "b2", tab: "firstbirthday",
    titleEn: "Growing Up", titleKo: "무럭무럭 성장",
    duration: "3분 30초", photoCount: 20,
    thumb: "https://images.unsplash.com/photo-1504437484202-613bb51ce359?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    bgm: "Somewhere Over the Rainbow", bgmArtist: "Israel Kamakawiwoʻole",
    tags: ["발랄해요", "즐거워요"],
  },

  /* ── 프로포즈 영상 ── */
  {
    id: "p1", tab: "propose",
    titleEn: "Will You Marry Me", titleKo: "나와 결혼해줄래요",
    duration: "2분 30초", photoCount: 15,
    thumb: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    bgm: "Thinking Out Loud", bgmArtist: "Ed Sheeran",
    tags: ["설레요", "로맨틱해요"],
  },
  {
    id: "p2", tab: "propose",
    titleEn: "Forever Yours", titleKo: "영원히 당신 곁에",
    duration: "3분 00초", photoCount: 18,
    thumb: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    bgm: "La Vie En Rose", bgmArtist: "Édith Piaf",
    tags: ["감성적이에요", "특별해요"],
  },

  /* ── 부모님 감사 편지 영상 ── */
  {
    id: "t1", tab: "parents",
    titleEn: "Thank You Mom & Dad", titleKo: "부모님께 드리는 편지",
    duration: "4분 00초", photoCount: 25,
    thumb: "https://images.unsplash.com/photo-1609220136736-443140cffec6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    bgm: "My Way", bgmArtist: "Frank Sinatra",
    tags: ["감동적이에요", "따뜻해요"],
  },
  {
    id: "t2", tab: "parents",
    titleEn: "Golden Memories", titleKo: "함께한 소중한 시간",
    duration: "3분 30초", photoCount: 22,
    thumb: "https://images.unsplash.com/photo-1511895426328-dc8714191011?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    bgm: "Time to Say Goodbye", bgmArtist: "Andrea Bocelli",
    tags: ["고급스러워요", "눈물나요"],
  },
];

export function LandingPage({ onStart, onGoHistory, onGoAdmin, isAdmin }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("wedding");
  const [sampleOpen, setSampleOpen] = useState<TemplateCard | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [pwError, setPwError] = useState(false);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  const handleAdminLogin = () => {
    if (adminPw === ADMIN_PASSWORD) {
      setShowAdminModal(false);
      setAdminPw("");
      setPwError(false);
      onGoAdmin?.();
    } else {
      setPwError(true);
      setAdminPw("");
    }
  };

  const filtered = TEMPLATES.filter((t) => t.tab === activeTab);

  const handleTabClick = (key: TabKey) => {
    if (key === "history") { onGoHistory(); return; }
    setActiveTab(key);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col max-w-[480px] mx-auto relative">

      {/* ══════════════════════════════════════
          헤더 — 로고 + 로그인 (파스텔무비 스타일)
      ══════════════════════════════════════ */}
      <header className="bg-white sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {/* 로고 행 */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-sm shadow-rose-200">
              <Film size={18} className="text-white" />
            </div>
            <div>
              <div className="font-extrabold text-gray-900 text-[17px] leading-none tracking-tight">모아필름</div>
              <div className="text-[10px] text-gray-400 leading-none mt-0.5 font-medium">MOAFILM · 행사 영상 제작소</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 관리자 편집기 아이콘 — 관리자 로그인 시에만 표시 */}
            {isAdmin && onGoAdmin && (
              <button
                onClick={onGoAdmin}
                title="템플릿 편집기"
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-sm shadow-rose-200"
              >
                <LayoutTemplate size={13} />
                편집기
              </button>
            )}
            {/* 로그인 */}
            <button
              onClick={() => onStart()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
              로그인 하세요 <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 — 가로 스크롤 */}
        <div
          ref={tabScrollRef}
          className="flex overflow-x-auto scrollbar-hide border-t border-gray-100"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab && tab.key !== "history";
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 gap-0.5 relative transition-all min-w-[80px] ${
                  isActive ? "text-rose-500" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="text-xl leading-none">{tab.emoji}</span>
                <span className="text-[10px] font-semibold leading-tight whitespace-nowrap">{tab.label}</span>
                {/* 활성 인디케이터 */}
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-rose-400 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ══════════════════════════════════════
          카테고리 설명 배너
      ══════════════════════════════════════ */}
      {activeTab !== "history" && (
        <div className="bg-white border-b border-gray-100 px-5 py-4">
          {activeTab === "wedding" && (
            <div>
              <div className="font-bold text-gray-900 text-base mb-0.5">결혼식 식전영상</div>
              <p className="text-xs text-gray-500 leading-relaxed">
                결혼식 시작 전 하객분들이 보는 식전 영상입니다.<br />
                사진만 업로드하면 감동적인 영상이 완성됩니다.
              </p>
            </div>
          )}
          {activeTab === "firstbirthday" && (
            <div>
              <div className="font-bold text-gray-900 text-base mb-0.5">돌잔치 식전영상</div>
              <p className="text-xs text-gray-500 leading-relaxed">
                아이의 소중한 첫 돌을 기념하는 성장 영상입니다.<br />
                탄생부터 지금까지의 순간을 아름답게 담아드립니다.
              </p>
            </div>
          )}
          {activeTab === "propose" && (
            <div>
              <div className="font-bold text-gray-900 text-base mb-0.5">프로포즈 영상</div>
              <p className="text-xs text-gray-500 leading-relaxed">
                일생에 단 한 번뿐인 프로포즈를 더 특별하게.<br />
                사진과 자막으로 마음을 담은 영상을 만들어보세요.
              </p>
            </div>
          )}
          {activeTab === "parents" && (
            <div>
              <div className="font-bold text-gray-900 text-base mb-0.5">부모님 감사 편지 영상</div>
              <p className="text-xs text-gray-500 leading-relaxed">
                결혼식장에서 부모님께 드리는 감사의 마음을 영상으로.<br />
                평생 간직할 소중한 선물이 됩니다.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          템플릿 카드 목록
      ══════════════════════════════════════ */}
      <div className="flex-1 px-0 py-0 space-y-0">
        {filtered.map((card, idx) => (
          <div
            key={card.id}
            className={`bg-white ${idx > 0 ? "border-t border-gray-100" : ""}`}
          >
            {/* ── 썸네일 영역 ── */}
            <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <img
                src={card.thumb}
                alt={card.titleKo}
                className="w-full h-full object-cover"
              />
              {/* 그라디언트 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* 재생 버튼 (중앙) */}
              <button
                onClick={() => setSampleOpen(card)}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50 group-hover:bg-white/30 transition-all shadow-xl">
                  <Play size={22} className="text-white ml-1" fill="white" />
                </div>
              </button>

              {/* 하단 텍스트 오버레이 */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                <div className="text-white/60 text-[10px] font-light tracking-[0.15em] uppercase mb-0.5">{card.titleEn}</div>
                <div className="text-white font-extrabold text-xl leading-tight">{card.titleKo}</div>
              </div>

              {/* 태그 배지 */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                {/* 테마 배지 */}
                {["w1","w3","b1","p1","t2"].includes(card.id) ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
                    style={{ background: "rgba(255,179,198,0.85)", color: "#8b3254" }}>
                    🌸 러블리
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
                    style={{ background: "rgba(255,255,255,0.85)", color: "#a08050" }}>
                    ✦ 화이트
                  </span>
                )}
                {card.tags.map((tag) => (
                  <span key={tag} className="bg-white/80 backdrop-blur-sm text-gray-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ── 카드 정보 영역 ── */}
            <div className="px-4 pt-3 pb-4">
              {/* 정보 행 */}
              <div className="flex items-center gap-0 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 pr-3 border-r border-gray-200">
                  <span className="text-sm">⏱</span>
                  <span>재생 시간 : <strong className="text-gray-700">{card.duration}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 px-3 border-r border-gray-200">
                  <span className="text-sm">📸</span>
                  <span>필요 사진 : <strong className="text-gray-700">{card.photoCount}장</strong></span>
                </div>
                <div className="flex items-center gap-0.5 pl-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className="text-amber-400" fill="currentColor" />
                  ))}
                </div>
              </div>

              {/* BGM 정보 */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-3">
                <span className="text-sm">🎵</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{card.bgm}</div>
                  <div className="text-[10px] text-gray-400">{card.bgmArtist}</div>
                </div>
                <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                  🔒 고정
                </span>
              </div>

              {/* 버튼 2개 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSampleOpen(card)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Play size={12} fill="currentColor" /> 샘플 확인
                </button>
                <button
                  onClick={() => onStart(card.id)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-all shadow-md shadow-rose-200 active:scale-95"
                >
                  제작하기
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* 하단 여백 */}
        <div className="h-8" />
      </div>

      {/* ══════════════════════════════════════
          하단 제작 내역 고정 버튼
      ══════════════════════════════════════ */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 pointer-events-none">
        <div className="flex justify-between items-end px-4 pb-5 pointer-events-auto">
          {/* 왼쪽: 잠금 아이콘 (비로그인 시) */}
          {!isAdmin && onGoAdmin && (
            <button
              onClick={() => { setShowAdminModal(true); setPwError(false); setAdminPw(""); }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200/60 hover:bg-gray-300/80 text-gray-400 hover:text-gray-600 transition-all active:scale-90"
              title="관리자 로그인"
            >
              <Lock size={14} />
            </button>
          )}
          {isAdmin && <div />}

          {/* 오른쪽: 제작내역 + 관리자 아이콘 */}
          <div className="flex items-center gap-2">
            {/* 관리자 고객관리 아이콘 — 관리자 로그인 시에만 표시 */}
            {isAdmin && (
              <button
                onClick={() => onGoAdmin?.()}
                title="고객관리"
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-[11px] font-bold px-3 py-2.5 rounded-2xl shadow-xl transition-all"
              >
                <Users size={14} /> 고객관리
              </button>
            )}
            <button
              onClick={onGoHistory}
              className="flex items-center gap-2 bg-gray-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl hover:bg-gray-800 active:scale-95 transition-all"
            >
              <History size={14} /> 제작 내역
            </button>
          </div>
        </div>
      </div>

      {/* ══ 관리자 비밀번호 모달 ══ */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6" style={{ maxWidth: 480, margin: "0 auto" }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdminModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full p-6 z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                <Lock size={15} className="text-rose-600" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">관리자 로그인</div>
                <div className="text-[10px] text-gray-400">비밀번호를 입력하세요</div>
              </div>
            </div>

            <div className="relative mb-3">
              <input
                autoFocus
                type={pwVisible ? "text" : "password"}
                value={adminPw}
                onChange={e => { setAdminPw(e.target.value); setPwError(false); }}
                onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
                placeholder="비밀번호"
                className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm outline-none transition-colors ${
                  pwError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-rose-400"
                }`}
              />
              <button
                type="button"
                onClick={() => setPwVisible(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {pwVisible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {pwError && (
              <p className="text-red-500 text-[11px] mb-3 flex items-center gap-1">
                <span>⚠</span> 비밀번호가 올바르지 않습니다
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowAdminModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAdminLogin}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-500 active:scale-95 transition-all"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          샘플 확인 모달
      ══════════════════════════════════════ */}
      {sampleOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center"
          onClick={() => setSampleOpen(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-[480px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div>
                <div className="font-bold text-gray-900 text-base">{sampleOpen.titleKo}</div>
                <div className="text-xs text-gray-400 tracking-widest uppercase">{sampleOpen.titleEn}</div>
              </div>
              <button
                onClick={() => setSampleOpen(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 썸네일 + 재생 */}
            <div className="relative" style={{ aspectRatio: "16/9" }}>
              <img
                src={sampleOpen.thumb}
                alt="샘플"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-white/50">
                    <Play size={24} fill="white" className="text-white ml-1" />
                  </div>
                  <div className="text-sm opacity-80 font-medium">샘플 영상 재생</div>
                </div>
              </div>
            </div>

            {/* 정보 */}
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["재생 시간", sampleOpen.duration],
                  ["필요 사진", `${sampleOpen.photoCount}장`],
                  ["BGM", sampleOpen.bgm],
                  ["파일 형식", "MP4 · FHD 1080p"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="text-[10px] text-gray-400 mb-0.5">{k}</div>
                    <div className="text-xs font-bold text-gray-800 truncate">{v}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setSampleOpen(null); onStart(sampleOpen!.id); }}
                className="w-full py-3.5 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-95"
              >
                이 템플릿으로 제작하기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
