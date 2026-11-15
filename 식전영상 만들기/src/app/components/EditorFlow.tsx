import { useState, useCallback } from "react";
import { StepInfo } from "./editor/StepInfo";
import { StepPhotos } from "./editor/StepPhotos";
import { StepArrange } from "./editor/StepArrange";
import { StepResult } from "./editor/StepResult";
import {
  saveDraft, generateDraftId, DraftStatus, DraftProject,
} from "../utils/draftStorage";

interface Photo {
  id: number;
  url: string;
  name: string;
}

interface InfoData {
  groomName: string;
  brideName: string;
  weddingDate: string;
}

interface Slot {
  index: number;
  label: string;
  desc: string;
  hasPhoto: boolean;
  hasCaption: boolean;
  photo: Photo | null;
  caption: string;
}

const TEMPLATE_META: Record<string, {
  titleKo: string; titleEn: string; emoji: string;
  duration: string; requiredPhotos: number;
  fixedBgm: string; fixedBgmArtist: string;
}> = {
  w1: { titleKo: "영원한 사랑",   titleEn: "Eternal Love",           emoji: "💍",
        duration: "3분 30초", requiredPhotos: 25,
        fixedBgm: "A Thousand Years",           fixedBgmArtist: "Christina Perri" },
  w2: { titleKo: "우리의 이야기", titleEn: "Our Story",              emoji: "💍",
        duration: "4분 00초", requiredPhotos: 25,
        fixedBgm: "Can't Help Falling in Love", fixedBgmArtist: "Elvis Presley" },
  w3: { titleKo: "언제나 함께",   titleEn: "Always & Forever",       emoji: "💍",
        duration: "2분 50초", requiredPhotos: 25,
        fixedBgm: "Perfect",                    fixedBgmArtist: "Ed Sheeran" },
  w4: { titleKo: "달콤한 추억",   titleEn: "Sweet Memories",         emoji: "💍",
        duration: "3분 10초", requiredPhotos: 25,
        fixedBgm: "All of Me",                  fixedBgmArtist: "John Legend" },
  b1: { titleKo: "첫 번째 생일", titleEn: "First Year",              emoji: "🎂",
        duration: "3분 00초", requiredPhotos: 18,
        fixedBgm: "You Are My Sunshine",        fixedBgmArtist: "동요 클래식" },
  b2: { titleKo: "무럭무럭 성장", titleEn: "Growing Up",             emoji: "🎂",
        duration: "3분 30초", requiredPhotos: 20,
        fixedBgm: "Somewhere Over the Rainbow", fixedBgmArtist: "Israel Kamakawiwoʻole" },
  s1: { titleKo: "감사한 세월",   titleEn: "A Life Well Lived",      emoji: "🎊",
        duration: "4분 00초", requiredPhotos: 25,
        fixedBgm: "My Way",                     fixedBgmArtist: "Frank Sinatra" },
  s2: { titleKo: "황금빛 세월",   titleEn: "Golden Years",           emoji: "🎊",
        duration: "3분 30초", requiredPhotos: 22,
        fixedBgm: "Time to Say Goodbye",        fixedBgmArtist: "Andrea Bocelli" },
  g1: { titleKo: "새로운 시작",   titleEn: "New Beginning",          emoji: "🎓",
        duration: "2분 30초", requiredPhotos: 16,
        fixedBgm: "Good Riddance",              fixedBgmArtist: "Green Day" },
  g2: { titleKo: "빛나는 성취",   titleEn: "Achievement",            emoji: "🎓",
        duration: "3분 00초", requiredPhotos: 18,
        fixedBgm: "Hall of Fame",               fixedBgmArtist: "The Script" },
  p1: { titleKo: "나와 결혼해줄래요", titleEn: "Will You Marry Me",   emoji: "💐",
        duration: "2분 30초", requiredPhotos: 15,
        fixedBgm: "Thinking Out Loud",          fixedBgmArtist: "Ed Sheeran" },
  p2: { titleKo: "영원히 당신 곁에", titleEn: "Forever Yours",        emoji: "💐",
        duration: "3분 00초", requiredPhotos: 18,
        fixedBgm: "La Vie En Rose",             fixedBgmArtist: "Édith Piaf" },
  t1: { titleKo: "부모님께 드리는 편지", titleEn: "Thank You Mom & Dad", emoji: "🙏",
        duration: "4분 00초", requiredPhotos: 25,
        fixedBgm: "My Way",                     fixedBgmArtist: "Frank Sinatra" },
  t2: { titleKo: "함께한 소중한 시간", titleEn: "Golden Memories",     emoji: "🙏",
        duration: "3분 30초", requiredPhotos: 22,
        fixedBgm: "Time to Say Goodbye",        fixedBgmArtist: "Andrea Bocelli" },
};

const DEFAULT_META = {
  titleKo: "행사 영상", titleEn: "Event Video", emoji: "🎬",
  duration: "3분 00초", requiredPhotos: 20,
  fixedBgm: "감동적인 피아노 곡", fixedBgmArtist: "모아필름 오리지널",
};

const SPARE_PHOTOS = 20;

type Step = "info" | "photos" | "arrange" | "result";

interface EditorFlowProps {
  templateId?: string;
  draftId?: string;
  isAdmin?: boolean;
  onBack: () => void;
  onGoHistory: () => void;
  onGoAdmin?: () => void;
}

export function EditorFlow({ templateId, draftId: initialDraftId, isAdmin, onBack, onGoHistory, onGoAdmin }: EditorFlowProps) {
  const meta = (templateId && TEMPLATE_META[templateId]) ? TEMPLATE_META[templateId] : DEFAULT_META;
  const maxPhotos = meta.requiredPhotos + SPARE_PHOTOS;

  const [draftId] = useState(() => initialDraftId ?? generateDraftId());
  const [step, setStep] = useState<Step>("info");
  const [info, setInfo] = useState<InfoData>({ groomName: "", brideName: "", weddingDate: "" });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [finalSlots, setFinalSlots] = useState<Slot[]>([]);
  const [videoStatus, setVideoStatus] = useState<DraftStatus>("draft");
  const [saveToast, setSaveToast] = useState(false);

  const buildDraftPayload = useCallback((slots?: Slot[]): DraftProject => ({
    id: draftId,
    templateId: templateId ?? "custom",
    templateTitle: meta.titleKo,
    templateEmoji: meta.emoji,
    groomName: info.groomName,
    brideName: info.brideName,
    weddingDate: info.weddingDate,
    fixedBgm: meta.fixedBgm,
    photoCount: photos.length,
    slots: (slots ?? finalSlots).map((s) => ({
      index: s.index, label: s.label, desc: s.desc,
      hasPhoto: s.hasPhoto, hasCaption: s.hasCaption,
      caption: s.caption, photoName: s.photo?.name ?? null,
    })),
    status: videoStatus,
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [draftId, templateId, meta, info, photos, finalSlots, videoStatus]);

  const handleTempSave = useCallback((slots?: Slot[]) => {
    saveDraft(buildDraftPayload(slots));
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  }, [buildDraftPayload]);

  const handleArrangeNext = (slots: Slot[]) => {
    setFinalSlots(slots);
    setVideoStatus("preview");
    const payload = buildDraftPayload(slots);
    saveDraft({ ...payload, status: "preview" });
    setStep("result");
  };

  const handlePaid = () => {
    setVideoStatus("paid");
    const payload = buildDraftPayload();
    saveDraft({ ...payload, status: "paid" });
  };

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen relative">
      {/* 임시 저장 완료 토스트 */}
      {saveToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl border border-gray-700 flex items-center gap-2 pointer-events-none"
          style={{ maxWidth: 340 }}>
          <span className="text-green-400">✓</span> 임시 저장 완료 · 제작 내역에서 이어서 작업할 수 있습니다
        </div>
      )}

      {step === "info" && (
        <StepInfo
          templateTitle={meta.titleKo}
          templateEmoji={meta.emoji}
          data={info}
          onChange={setInfo}
          onNext={() => setStep("photos")}
          onBack={onBack}
          onTempSave={() => handleTempSave()}
          onGoHistory={onGoHistory}
        />
      )}

      {step === "photos" && (
        <StepPhotos
          templateTitle={meta.titleKo}
          templateEmoji={meta.emoji}
          templateEn={meta.titleEn}
          fixedBgm={meta.fixedBgm}
          fixedBgmArtist={meta.fixedBgmArtist}
          duration={meta.duration}
          requiredPhotos={meta.requiredPhotos}
          maxPhotos={maxPhotos}
          photos={photos}
          onPhotosChange={setPhotos}
          onNext={() => setStep("arrange")}
          onBack={() => setStep("info")}
          onTempSave={() => handleTempSave()}
          onGoHistory={onGoHistory}
        />
      )}

      {step === "arrange" && (
        <StepArrange
          templateTitle={meta.titleKo}
          templateEmoji={meta.emoji}
          templateEn={meta.titleEn}
          templateId={templateId}
          groomName={info.groomName}
          brideName={info.brideName}
          weddingDate={info.weddingDate}
          requiredPhotos={meta.requiredPhotos}
          uploadedPhotos={photos}
          isAdmin={isAdmin}
          onNext={handleArrangeNext}
          onBack={() => setStep("photos")}
          onTempSave={handleTempSave}
          onGoHistory={onGoHistory}
          onGoAdmin={onGoAdmin}
        />
      )}

      {step === "result" && (
        <StepResult
          groomName={info.groomName}
          brideName={info.brideName}
          weddingDate={info.weddingDate}
          templateTitle={meta.titleKo}
          templateEmoji={meta.emoji}
          fixedBgm={meta.fixedBgm}
          photoCount={finalSlots.filter((s) => s.photo).length || photos.length}
          videoStatus={videoStatus}
          onRevise={() => setStep("arrange")}
          onPaid={handlePaid}
          onRestart={onBack}
          onGoHistory={onGoHistory}
        />
      )}
    </div>
  );
}
