import { useState } from "react";
import { Trash2, PlayCircle, Clock, ChevronRight, Film, Plus } from "lucide-react";
import { loadAllDrafts, deleteDraft, formatSavedAt, DraftProject, DraftStatus } from "../utils/draftStorage";

interface ProjectHistoryProps {
  onBack: () => void;
  onResume: (draftId: string, templateId: string) => void;
  onNewProject: () => void;
}

const STATUS_META: Record<DraftStatus, { label: string; color: string; bg: string }> = {
  draft:   { label: "임시저장",   color: "text-amber-600",  bg: "bg-amber-50 border-amber-200"  },
  preview: { label: "시안 완성",  color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
  paid:    { label: "결제 완료",  color: "text-green-600",  bg: "bg-green-50 border-green-200"  },
};

export function ProjectHistory({ onBack, onResume, onNewProject }: ProjectHistoryProps) {
  const [drafts, setDrafts] = useState<DraftProject[]>(() => loadAllDrafts());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteDraft(id);
    setDrafts(loadAllDrafts());
    setDeleteConfirm(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f7]">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 p-1">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="font-bold text-gray-900 text-sm">제작 내역</div>
          <div className="text-xs text-gray-400">임시저장 · 시안 · 완성 영상</div>
        </div>
        <span className="text-xs text-gray-400 font-medium">{drafts.length}건</span>
      </header>

      <div className="flex-1 px-4 py-5 space-y-3 pb-24">

        {drafts.length === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
              <Film size={32} className="text-gray-300" />
            </div>
            <div className="font-bold text-gray-600 text-base mb-1">제작 내역이 없습니다</div>
            <p className="text-sm text-gray-400 mb-6">새 영상을 제작하거나 작업 중 임시저장을 하면<br />여기서 이어서 작업할 수 있습니다.</p>
            <button onClick={onNewProject}
              className="flex items-center gap-2 bg-rose-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all">
              <Plus size={16} /> 새 영상 만들기
            </button>
          </div>
        ) : (
          <>
            {/* 안내 */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700 leading-relaxed">
              · 임시저장된 프로젝트는 언제든지 이어서 작업할 수 있습니다.<br />
              · 시안 영상은 무제한 수정 가능 · 결제 완료 후에는 수정 불가합니다.
            </div>

            {drafts.map((draft) => {
              const sm = STATUS_META[draft.status];
              const canEdit = draft.status !== "paid";
              return (
                <div key={draft.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* 상단 상태 바 */}
                  <div className={`border-b px-4 py-2 flex items-center gap-2 ${sm.bg}`}>
                    <span className={`text-[10px] font-bold ${sm.color}`}>{sm.label}</span>
                    {draft.status === "paid" && (
                      <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">수정 불가</span>
                    )}
                    {canEdit && (
                      <span className="text-[9px] bg-white text-indigo-500 border border-indigo-200 px-1.5 py-0.5 rounded-full font-bold ml-auto">
                        {draft.status === "preview" ? "시안 수정 가능" : "이어서 작업 가능"}
                      </span>
                    )}
                  </div>

                  <div className="px-4 py-4">
                    {/* 제목 */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {draft.templateEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm truncate">
                          {draft.groomName || "신랑"} ♥ {draft.brideName || "신부"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{draft.templateTitle}</div>
                        {draft.weddingDate && (
                          <div className="text-xs text-gray-400">
                            {new Date(draft.weddingDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 정보 그리드 */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: "사진", value: `${draft.photoCount}장` },
                        { label: "BGM", value: draft.fixedBgm.slice(0, 8) + (draft.fixedBgm.length > 8 ? "…" : "") },
                        { label: "해상도", value: "FHD 1080p" },
                      ].map((item) => (
                        <div key={item.label} className="bg-gray-50 rounded-xl px-2.5 py-2">
                          <div className="text-[9px] text-gray-400 mb-0.5">{item.label}</div>
                          <div className="text-[11px] font-bold text-gray-700 truncate">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* 저장 시각 */}
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-3">
                      <Clock size={10} />
                      <span>최근 저장: {formatSavedAt(draft.updatedAt)}</span>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2">
                      {canEdit ? (
                        <button
                          onClick={() => onResume(draft.id, draft.templateId)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-rose-500 text-white hover:bg-rose-600 active:scale-95 transition-all shadow-sm shadow-rose-200">
                          <PlayCircle size={15} />
                          {draft.status === "preview" ? "시안 수정하기" : "이어서 작업"}
                          <ChevronRight size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onResume(draft.id, draft.templateId)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-green-500 text-white hover:bg-green-600 active:scale-95 transition-all">
                          <Film size={15} /> 영상 다운로드
                        </button>
                      )}
                      {/* 삭제 버튼 */}
                      {deleteConfirm === draft.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(draft.id)}
                            className="px-3 py-3 rounded-xl bg-red-500 text-white text-xs font-bold active:scale-95 transition-all">
                            삭제
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-3 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold active:scale-95 transition-all">
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(draft.id)}
                          className="p-3 rounded-xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400 transition-all active:scale-95">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* 하단 새 영상 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-8 pt-4 bg-white border-t border-gray-100 z-30">
        <button onClick={onNewProject}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all">
          <Plus size={18} /> 새 영상 만들기
        </button>
      </div>
    </div>
  );
}
