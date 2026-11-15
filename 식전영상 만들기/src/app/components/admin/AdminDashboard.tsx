import { useState, useMemo } from "react";
import {
  ArrowLeft, Users, Search, Filter, LayoutTemplate,
  Clock, CheckCircle, CreditCard, Trash2, Eye,
  ChevronDown, ChevronUp, Phone, MessageSquare,
  Film, ImageIcon, Calendar, RefreshCw, X,
} from "lucide-react";
import { loadAllDrafts, deleteDraft, saveDraft, DraftProject, DraftStatus, formatSavedAt } from "../../utils/draftStorage";

interface AdminDashboardProps {
  onBack: () => void;
  onGoTemplateEditor: () => void;
}

const STATUS_META: Record<DraftStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:   { label: "작업중",   color: "text-amber-600",  bg: "bg-amber-50 border-amber-200",   icon: <Clock size={12} /> },
  preview: { label: "시안완성", color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",     icon: <Eye size={12} /> },
  paid:    { label: "결제완료", color: "text-green-600",  bg: "bg-green-50 border-green-200",   icon: <CheckCircle size={12} /> },
};

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  w1: { label: "영원한 사랑",        emoji: "💍" },
  w2: { label: "우리의 이야기",      emoji: "💍" },
  w3: { label: "언제나 함께",        emoji: "💍" },
  w4: { label: "달콤한 추억",        emoji: "💍" },
  b1: { label: "첫 번째 생일",       emoji: "🎂" },
  b2: { label: "무럭무럭 성장",      emoji: "🎂" },
  p1: { label: "나와 결혼해줄래요",   emoji: "💐" },
  p2: { label: "영원히 당신 곁에",   emoji: "💐" },
  t1: { label: "부모님께 드리는 편지", emoji: "🙏" },
  t2: { label: "함께한 소중한 시간", emoji: "🙏" },
};

type FilterStatus = "all" | DraftStatus;
type SortKey = "updatedAt" | "savedAt" | "name";

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`flex-1 rounded-2xl p-4 flex flex-col gap-1 border ${color}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <span className="opacity-60">{icon}</span>
      </div>
      <span className="text-2xl font-black text-gray-900">{value}</span>
    </div>
  );
}

function CustomerCard({
  draft, onDelete, onStatusChange, onDetail,
}: {
  draft: DraftProject;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: DraftStatus) => void;
  onDetail: (draft: DraftProject) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const sm = STATUS_META[draft.status];
  const cat = CATEGORY_META[draft.templateId];
  const completedSlots = draft.slots.filter(s => s.hasPhoto && s.photoName).length;
  const totalSlots = draft.slots.filter(s => s.hasPhoto).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 상단: 이름 + 상태 */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-base">{cat?.emoji ?? "🎬"}</span>
            <span className="font-bold text-gray-900 text-sm truncate">
              {draft.groomName} {draft.brideName ? `♥ ${draft.brideName}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-400">{cat?.label ?? draft.templateTitle}</span>
            {draft.weddingDate && (
              <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                <Calendar size={9} /> {draft.weddingDate}
              </span>
            )}
          </div>
        </div>

        {/* 상태 배지 + 변경 메뉴 */}
        <div className="relative flex-shrink-0 ml-2">
          <button
            onClick={() => setShowStatusMenu(p => !p)}
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${sm.bg} ${sm.color} transition-all`}
          >
            {sm.icon}{sm.label}<ChevronDown size={10} />
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden min-w-[120px]">
              {(Object.entries(STATUS_META) as [DraftStatus, typeof STATUS_META[DraftStatus]][]).map(([key, meta]) => (
                <button key={key} onClick={() => { onStatusChange(draft.id, key); setShowStatusMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold hover:bg-gray-50 transition-colors ${meta.color} ${draft.status === key ? "bg-gray-50" : ""}`}>
                  {meta.icon}{meta.label}
                  {draft.status === key && <span className="ml-auto text-[9px] text-gray-400">현재</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 진행 상황 바 */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-medium">사진 배치 진행률</span>
          <span className="text-[10px] font-bold text-gray-600">{completedSlots}/{totalSlots}컷</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${draft.status === "paid" ? "bg-green-400" : "bg-rose-400"}`}
            style={{ width: `${totalSlots > 0 ? (completedSlots / totalSlots) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* 메타정보 */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          <ImageIcon size={9} /> {draft.photoCount}장
        </span>
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          <Film size={9} /> {draft.fixedBgm}
        </span>
        <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-0.5">
          <RefreshCw size={9} /> {formatSavedAt(draft.updatedAt)}
        </span>
      </div>

      {/* 액션 버튼 */}
      <div className="border-t border-gray-50 flex divide-x divide-gray-50">
        <button onClick={() => onDetail(draft)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
          <Eye size={13} /> 상세 보기
        </button>
        <button
          onClick={() => window.open(`tel:`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors">
          <MessageSquare size={13} /> 메모
        </button>
        <button onClick={() => onDelete(draft.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 size={13} /> 삭제
        </button>
      </div>
    </div>
  );
}

function DetailModal({ draft, onClose, onStatusChange }: {
  draft: DraftProject;
  onClose: () => void;
  onStatusChange: (id: string, status: DraftStatus) => void;
}) {
  const sm = STATUS_META[draft.status];
  const cat = CATEGORY_META[draft.templateId];

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full rounded-t-3xl z-10 max-h-[85vh] flex flex-col">
        {/* 핸들 */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="font-bold text-gray-900">{cat?.emoji ?? "🎬"} {draft.groomName} {draft.brideName ? `♥ ${draft.brideName}` : ""}</div>
            <div className="text-xs text-gray-400">{cat?.label ?? draft.templateTitle} · {draft.weddingDate}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* 상태 변경 */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">진행 상태</p>
            <div className="flex gap-2">
              {(Object.entries(STATUS_META) as [DraftStatus, typeof STATUS_META[DraftStatus]][]).map(([key, meta]) => (
                <button key={key} onClick={() => onStatusChange(draft.id, key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                    draft.status === key ? `${meta.bg} ${meta.color} border-current` : "border-gray-100 text-gray-400 hover:border-gray-200"
                  }`}>
                  {meta.icon}{meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* 프로젝트 정보 */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">프로젝트 정보</p>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              {[
                ["템플릿", `${cat?.emoji ?? ""} ${cat?.label ?? draft.templateTitle}`],
                ["BGM", draft.fixedBgm],
                ["업로드 사진", `${draft.photoCount}장`],
                ["최초 저장", formatSavedAt(draft.savedAt)],
                ["마지막 수정", formatSavedAt(draft.updatedAt)],
                ["프로젝트 ID", draft.id],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <span className="text-[11px] text-gray-400 font-medium flex-shrink-0">{label}</span>
                  <span className="text-[11px] text-gray-700 font-semibold text-right break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 장면별 자막 */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">장면별 자막 목록</p>
            <div className="space-y-1.5">
              {draft.slots.filter(s => s.hasCaption && s.caption).map((s, i) => (
                <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-[10px] text-gray-400 font-bold flex-shrink-0 w-16 truncate">{s.label}</span>
                  <span className="text-[11px] text-gray-700 flex-1">"{s.caption}"</span>
                </div>
              ))}
              {draft.slots.filter(s => s.hasCaption && s.caption).length === 0 && (
                <p className="text-[11px] text-gray-400 text-center py-3">등록된 자막 없음</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard({ onBack, onGoTemplateEditor }: AdminDashboardProps) {
  const [drafts, setDrafts] = useState<DraftProject[]>(() => loadAllDrafts());
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [detailDraft, setDetailDraft] = useState<DraftProject | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const refresh = () => setDrafts(loadAllDrafts());

  const handleDelete = (id: string) => {
    deleteDraft(id);
    refresh();
    setDeleteConfirm(null);
  };

  const handleStatusChange = (id: string, status: DraftStatus) => {
    const draft = drafts.find(d => d.id === id);
    if (!draft) return;
    saveDraft({ ...draft, status, updatedAt: new Date().toISOString() });
    refresh();
    if (detailDraft?.id === id) setDetailDraft(prev => prev ? { ...prev, status } : null);
  };

  const filtered = useMemo(() => {
    let list = [...drafts];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        d.groomName.toLowerCase().includes(q) ||
        d.brideName?.toLowerCase().includes(q) ||
        d.templateTitle.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter(d => d.status === filterStatus);
    list.sort((a, b) => {
      if (sortKey === "name") return a.groomName.localeCompare(b.groomName);
      return new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime();
    });
    return list;
  }, [drafts, search, filterStatus, sortKey]);

  // 통계
  const stats = useMemo(() => ({
    total:   drafts.length,
    draft:   drafts.filter(d => d.status === "draft").length,
    preview: drafts.filter(d => d.status === "preview").length,
    paid:    drafts.filter(d => d.status === "paid").length,
  }), [drafts]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-[480px] mx-auto">

      {/* 헤더 */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-700 p-1">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <Users size={15} className="text-rose-500" /> 고객 관리
            </div>
            <div className="text-[10px] text-gray-400">모아필름 관리자 대시보드</div>
          </div>
          <button onClick={onGoTemplateEditor}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95">
            <LayoutTemplate size={12} /> 템플릿 편집
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-8">

        {/* 통계 카드 */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex gap-2">
            <StatCard label="전체" value={stats.total} icon={<Users size={14} />} color="bg-gray-50 border-gray-200" />
            <StatCard label="작업중" value={stats.draft} icon={<Clock size={14} className="text-amber-500" />} color="bg-amber-50 border-amber-100" />
            <StatCard label="시안완성" value={stats.preview} icon={<Eye size={14} className="text-blue-500" />} color="bg-blue-50 border-blue-100" />
            <StatCard label="결제완료" value={stats.paid} icon={<CreditCard size={14} className="text-green-500" />} color="bg-green-50 border-green-100" />
          </div>
        </div>

        {/* 검색 */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="이름, 템플릿으로 검색..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-rose-300 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* 필터 + 정렬 */}
        <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {/* 상태 필터 */}
          {([["all", "전체"], ["draft", "작업중"], ["preview", "시안완성"], ["paid", "결제완료"]] as [FilterStatus, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setFilterStatus(key)}
              className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                filterStatus === key
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              {label}
              {key !== "all" && <span className="ml-1 opacity-60">{stats[key as DraftStatus]}</span>}
            </button>
          ))}

          <div className="flex-shrink-0 ml-auto">
            <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
              className="text-[11px] text-gray-500 bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
              <option value="updatedAt">최근 수정순</option>
              <option value="savedAt">등록일순</option>
              <option value="name">이름순</option>
            </select>
          </div>
        </div>

        {/* 고객 카드 리스트 */}
        <div className="px-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={36} className="text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm font-semibold mb-1">
                {search || filterStatus !== "all" ? "검색 결과가 없습니다" : "등록된 고객이 없습니다"}
              </p>
              <p className="text-gray-300 text-xs">고객이 영상을 제작하면 여기에 표시됩니다</p>
            </div>
          ) : (
            filtered.map(draft => (
              <CustomerCard
                key={draft.id}
                draft={draft}
                onDelete={id => setDeleteConfirm(id)}
                onStatusChange={handleStatusChange}
                onDetail={setDetailDraft}
              />
            ))
          )}
        </div>

        {/* 고객 수 */}
        {filtered.length > 0 && (
          <p className="text-center text-[11px] text-gray-300 mt-4">{filtered.length}명 표시 중</p>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-6" style={{ maxWidth: 480, margin: "0 auto" }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full shadow-2xl z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={16} className="text-red-500" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">고객 데이터 삭제</div>
                <div className="text-[11px] text-gray-400">삭제하면 복구할 수 없습니다</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold">
                취소
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {detailDraft && (
        <DetailModal
          draft={detailDraft}
          onClose={() => setDetailDraft(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
