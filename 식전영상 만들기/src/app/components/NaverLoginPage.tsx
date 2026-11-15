import { useState } from "react";
import { Film } from "lucide-react";

interface NaverLoginPageProps {
  onLogin: () => void;
  onBack: () => void;
}

export function NaverLoginPage({ onLogin, onBack }: NaverLoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleNaverLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col max-w-[480px] mx-auto">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-400 flex items-center justify-center">
            <Film size={15} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 leading-none text-base">모아필름</div>
            <div className="text-[10px] text-gray-400 leading-none mt-0.5">행사 영상 제작소</div>
          </div>
        </button>
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          로그인 하세요
        </div>
      </header>

      {/* 로그인 본문 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        {/* 로고 */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-rose-200">
            <Film size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">모아필름</h1>
          <p className="text-gray-500 text-sm">소중한 순간을 영상으로 간직하세요</p>
        </div>

        {/* 로그인 카드 */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <p className="text-center text-gray-600 text-sm font-medium mb-5">
            간편하게 로그인하고<br />바로 영상을 만들어보세요
          </p>

          {/* 네이버 로그인 버튼 */}
          <button
            onClick={handleNaverLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 shadow-lg"
            style={{ backgroundColor: "#03C75A" }}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>로그인 중...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="white">
                  <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
                </svg>
                <span>네이버 아이디로 로그인</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
            로그인 시{" "}
            <button onClick={() => setShowTerms(true)} className="text-rose-400 underline">이용약관</button>
            {" "}및{" "}
            <button onClick={() => setShowPrivacy(true)} className="text-rose-400 underline">개인정보처리방침</button>
            에 동의합니다.
          </p>
        </div>

        {/* 서비스 아이콘 메뉴 */}
        <div className="w-full mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-center text-gray-400 mb-4 font-medium">제공 서비스</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { emoji: "💍", label: "결혼식" },
              { emoji: "🎂", label: "돌잔치" },
              { emoji: "🎊", label: "환갑·칠순" },
              { emoji: "🎓", label: "졸업식" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                  <span className="text-xl">{item.emoji}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 약관 모달 */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowTerms(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-[480px] mx-auto max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-gray-900">이용약관</h3>
              <button onClick={() => setShowTerms(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">✕</button>
            </div>
            <div className="p-5 text-sm text-gray-600 space-y-4 leading-relaxed">
              <div><strong className="text-gray-900">제1조 (목적)</strong><p className="mt-1">본 약관은 모아필름(이하 "서비스")의 이용 조건 및 절차를 규정합니다.</p></div>
              <div><strong className="text-gray-900">제2조 (서비스 이용)</strong><p className="mt-1">서비스는 네이버 소셜 로그인을 통해 이용할 수 있으며, 별도 회원가입 없이 즉시 이용 가능합니다.</p></div>
              <div><strong className="text-gray-900">제3조 (저작권)</strong><p className="mt-1">사용자가 업로드한 사진의 저작권은 사용자에게 귀속됩니다.</p></div>
              <div><strong className="text-gray-900">제4조 (면책)</strong><p className="mt-1">서비스는 사용자 귀책 사유로 인한 손해에 대해 책임을 지지 않습니다.</p></div>
            </div>
            <div className="p-5 pt-0"><button onClick={() => setShowTerms(false)} className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold">확인</button></div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowPrivacy(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-[480px] mx-auto max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-gray-900">개인정보처리방침</h3>
              <button onClick={() => setShowPrivacy(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">✕</button>
            </div>
            <div className="p-5 text-sm text-gray-600 space-y-4 leading-relaxed">
              <div><strong className="text-gray-900">수집 항목</strong><p className="mt-1">네이버 로그인을 통해 닉네임, 프로필 이미지를 수집합니다.</p></div>
              <div><strong className="text-gray-900">수집 목적</strong><p className="mt-1">서비스 이용 편의를 위한 사용자 식별 및 제작 내역 관리에 활용합니다.</p></div>
              <div><strong className="text-gray-900">보유 기간</strong><p className="mt-1">회원 탈퇴 또는 서비스 종료 시 즉시 파기합니다.</p></div>
              <div><strong className="text-gray-900">제3자 제공</strong><p className="mt-1">법령에 의한 경우를 제외하고 제3자에게 제공하지 않습니다.</p></div>
            </div>
            <div className="p-5 pt-0"><button onClick={() => setShowPrivacy(false)} className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold">확인</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
