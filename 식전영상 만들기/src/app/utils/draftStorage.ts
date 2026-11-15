// 드래프트 저장 유틸리티 (localStorage 기반)
// 사진 파일(Blob URL)은 세션 종료 시 무효화되므로, 메타데이터만 저장됩니다.

export type DraftStatus = "draft" | "preview" | "paid";

export interface DraftSlot {
  index: number;
  label: string;
  desc: string;
  hasPhoto: boolean;
  hasCaption: boolean;
  caption: string;
  // photo는 Blob URL이라 저장 불가 → 재작업 시 재업로드 필요
  photoName: string | null; // 파일명만 참고용으로 저장
}

export interface DraftProject {
  id: string;
  templateId: string;
  templateTitle: string;
  templateEmoji: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  fixedBgm: string;
  photoCount: number;     // 업로드했던 사진 수
  slots: DraftSlot[];
  status: DraftStatus;    // draft=임시저장, preview=시안완성, paid=최종결제
  savedAt: string;        // ISO 날짜
  updatedAt: string;
}

const STORAGE_KEY = "moafilm_drafts";

export function loadAllDrafts(): DraftProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DraftProject[];
  } catch {
    return [];
  }
}

export function saveDraft(draft: DraftProject): void {
  const all = loadAllDrafts();
  const idx = all.findIndex((d) => d.id === draft.id);
  if (idx >= 0) {
    all[idx] = { ...draft, updatedAt: new Date().toISOString() };
  } else {
    all.unshift({ ...draft, updatedAt: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteDraft(id: string): void {
  const all = loadAllDrafts().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getDraft(id: string): DraftProject | null {
  return loadAllDrafts().find((d) => d.id === id) ?? null;
}

export function generateDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
