/** Browser-side video rendering. No server, no simulated progress, no copyrighted music. */
export interface RenderSlide { url: string; caption?: string }
export interface RenderOptions {
  slides: RenderSlide[];
  title: string;
  subtitle: string;
  onProgress?: (percent: number) => void;
  secondsPerSlide?: number;
}
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('사진을 불러올 수 없습니다. 다시 업로드해 주세요.'));
  img.src = src;
});
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, scale = 1) {
  const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight) * scale;
  const iw = img.naturalWidth * ratio, ih = img.naturalHeight * ratio;
  ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
}
function caption(ctx: CanvasRenderingContext2D, text: string, y: number, size: number) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.85)';
  ctx.shadowBlur = 12;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.fillText(text.slice(0, 38), 640, y, 1160);
  ctx.shadowBlur = 0;
}
export async function renderVideo({ slides, title, subtitle, onProgress, secondsPerSlide = 2.5 }: RenderOptions): Promise<{ blob: Blob; extension: 'mp4' | 'webm' }> {
  if (!slides.length) throw new Error('사진을 한 장 이상 추가해 주세요.');
  if (!('MediaRecorder' in window) || !HTMLCanvasElement.prototype.captureStream) throw new Error('이 브라우저는 영상 내보내기를 지원하지 않습니다. 최신 Chrome 또는 Edge를 사용해 주세요.');
  const candidates = [
    { type: 'video/mp4;codecs=avc1.42E01E', extension: 'mp4' as const },
    { type: 'video/webm;codecs=vp9', extension: 'webm' as const },
    { type: 'video/webm;codecs=vp8', extension: 'webm' as const },
    { type: 'video/webm', extension: 'webm' as const },
  ];
  const format = candidates.find(({ type }) => MediaRecorder.isTypeSupported(type));
  if (!format) throw new Error('이 브라우저에서 지원하는 영상 인코딩 형식을 찾지 못했습니다.');
  const images = await Promise.all(slides.map((s) => loadImage(s.url)));
  const canvas = document.createElement('canvas');
  canvas.width = 1280; canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('영상 캔버스를 초기화할 수 없습니다.');
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: format.type, videoBitsPerSecond: 5_000_000 });
  const chunks: BlobPart[] = [];
  const recorded = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => reject(new Error('영상 인코딩 중 오류가 발생했습니다.'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || format.type }));
  });
  const frames = Math.max(1, Math.round(secondsPerSlide * 30));
  try {
    recorder.start(500);
    for (let i = 0; i < slides.length; i++) {
      for (let f = 0; f < frames; f++) {
        const p = f / frames;
        ctx.fillStyle = '#17151d'; ctx.fillRect(0, 0, 1280, 720);
        ctx.save();
        drawCover(ctx, images[i], 1280, 720, 1 + p * 0.045);
        ctx.restore();
        const gradient = ctx.createLinearGradient(0, 460, 0, 720);
        gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(1, 'rgba(0,0,0,.7)');
        ctx.fillStyle = gradient; ctx.fillRect(0, 460, 1280, 260);
        caption(ctx, slides[i].caption || title, 625, 42);
        ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        ctx.fillText(subtitle.slice(0, 70), 640, 683);
        await sleep(1000 / 30);
        onProgress?.(Math.round(((i * frames + f + 1) / (slides.length * frames)) * 100));
      }
    }
    recorder.stop();
    const blob = await recorded;
    if (!blob.size) throw new Error('영상 파일이 비어 있습니다.');
    return { blob, extension: format.extension };
  } catch (error) {
    if (recorder.state !== 'inactive') recorder.stop();
    throw error;
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}
export function saveVideo(blob: Blob, extension: string, filename = 'moafilm-video') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}.${extension}`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
