/** Browser-side video rendering. No server, no simulated progress, no copyrighted music. */
export interface RenderSlide { url: string; caption?: string; durationSeconds?: number; transition?: "cut" | "fade" | "slide" | "zoom" }
export interface RenderOptions {
  slides: RenderSlide[];
  backgroundUrl?: string;
  title: string;
  subtitle: string;
  onProgress?: (percent: number) => void;
  secondsPerSlide?: number;
  transition?: "cut" | "fade" | "slide" | "zoom";
  audioFile?: File;
  signal?: AbortSignal;
  maxAudioMB?: number;
  onWarning?: (message: string) => void;
  width?: 640 | 1280;
  fps?: 24 | 30;
}
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const abortError = () => new DOMException("영상 제작이 취소되었습니다.", "AbortError");
const loadImage = (src: string, signal?: AbortSignal): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  if (signal?.aborted) { reject(abortError()); return; }
  const img = new Image();
  let settled = false;
  const settle = (callback: () => void) => { if (settled) return; settled = true; cleanup(); callback(); };
  const cleanup = () => { clearTimeout(timeout); signal?.removeEventListener('abort', onAbort); };
  const onAbort = () => settle(() => { img.src = ''; reject(abortError()); });
  signal?.addEventListener('abort', onAbort, { once: true });
  img.onload = () => settle(() => { if (!img.naturalWidth || !img.naturalHeight) reject(new Error('사진 크기를 확인할 수 없습니다.')); else resolve(img); });
  img.onerror = () => settle(() => reject(new Error('사진을 불러올 수 없습니다. 다시 업로드해 주세요.')));
  const timeout = setTimeout(() => settle(() => { img.src = ''; reject(new Error('사진 불러오기 시간이 초과되었습니다.')); }), 20000);
  img.crossOrigin = 'anonymous';
  img.src = src;
});
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, scale = 1) {
  const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight) * scale;
  const iw = img.naturalWidth * ratio, ih = img.naturalHeight * ratio;
  ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
}
function caption(ctx: CanvasRenderingContext2D, text: string, y: number, size: number, w = 1280) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.85)';
  ctx.shadowBlur = 12;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.fillText(text.slice(0, 38), w / 2, y, w * 0.91);
  ctx.shadowBlur = 0;
}
export async function renderVideo({ slides, title, subtitle, backgroundUrl, onProgress, secondsPerSlide = 2.5, transition = "fade", audioFile, signal, maxAudioMB = 50, onWarning, width = 1280, fps = 30 }: RenderOptions): Promise<{ blob: Blob; extension: 'mp4' | 'webm' }> {
  if (![640, 1280].includes(width) || ![24, 30].includes(fps)) throw new Error('지원하지 않는 영상 해상도 또는 프레임 설정입니다.');
  if (!['cut', 'fade', 'slide', 'zoom'].includes(transition)) throw new Error('지원하지 않는 기본 전환 효과입니다.');
  if (!slides.length) throw new Error('사진을 한 장 이상 추가해 주세요.');
  if (slides.length > 300) throw new Error('사진은 최대 300장까지 지원합니다.');
  if (slides.some(slide => !slide.url?.trim())) throw new Error('사진 주소가 비어 있습니다.');
  if (slides.some(slide => slide.durationSeconds !== undefined && (!Number.isFinite(slide.durationSeconds) || slide.durationSeconds < 1 || slide.durationSeconds > 30))) throw new Error('장면별 길이는 1~30초로 지정해 주세요.');
  if (slides.some(slide => slide.transition !== undefined && !['cut', 'fade', 'slide', 'zoom'].includes(slide.transition))) throw new Error('지원하지 않는 장면 전환 효과입니다.');
  if (!Number.isFinite(secondsPerSlide) || secondsPerSlide < 1 || secondsPerSlide > 30) throw new Error('사진 재생 시간은 1~30초로 설정해 주세요.');
  if (!Number.isFinite(maxAudioMB) || maxAudioMB <= 0 || maxAudioMB > 500) throw new Error('음악 용량 제한값이 올바르지 않습니다.');
  if (audioFile && (audioFile.size === 0 || audioFile.size > maxAudioMB * 1024 * 1024)) throw new Error(`음악 파일은 0바이트보다 크고 ${maxAudioMB}MB 이하여야 합니다.`);
  if (audioFile && !(/\.(mp3|wav|ogg|m4a|aac)$/i.test(audioFile.name) || audioFile.type.startsWith('audio/'))) throw new Error('지원하지 않는 음악 형식입니다.');
  if (signal?.aborted) throw abortError();
  if (!('MediaRecorder' in window) || !HTMLCanvasElement.prototype.captureStream) throw new Error('이 브라우저는 영상 내보내기를 지원하지 않습니다. 최신 Chrome 또는 Edge를 사용해 주세요.');
  const candidates = [
    { type: 'video/mp4;codecs=avc1.42E01E', extension: 'mp4' as const },
    { type: 'video/webm;codecs=vp9', extension: 'webm' as const },
    { type: 'video/webm;codecs=vp8', extension: 'webm' as const },
    { type: 'video/webm', extension: 'webm' as const },
  ];
  const format = candidates.find(({ type }) => MediaRecorder.isTypeSupported(type));
  if (format?.extension === 'webm') onWarning?.('현재 브라우저에서는 MP4 인코딩을 지원하지 않아 WebM으로 저장합니다.');
  if (!format) throw new Error('이 브라우저에서 지원하는 영상 인코딩 형식을 찾지 못했습니다.');
  // Avoid launching hundreds of concurrent image decodes.
  const images: HTMLImageElement[] = [];
  for (const slide of slides) {
    if (signal?.aborted) throw abortError();
    images.push(await loadImage(slide.url, signal));
  }
  const background = backgroundUrl ? await loadImage(backgroundUrl, signal) : null;
  const canvas = document.createElement('canvas');
  const height = width * 9 / 16;
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('영상 캔버스를 초기화할 수 없습니다.');
  const stream = canvas.captureStream(fps);
  onProgress?.(0);
  let audioContext: AudioContext | undefined;
  let audioSource: AudioBufferSourceNode | undefined;
  let audioDestination: MediaStreamAudioDestinationNode | undefined;
  let audioGain: GainNode | undefined;
  try {
    if (audioFile) {
      audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(await audioFile.arrayBuffer());
      audioDestination = audioContext.createMediaStreamDestination();
      audioSource = audioContext.createBufferSource();
      audioSource.buffer = buffer;
      audioSource.loop = true;
      audioGain = audioContext.createGain();
      audioGain.gain.value = 0.8;
      audioSource.connect(audioGain).connect(audioDestination);
      audioDestination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    }
  } catch (error) {
    stream.getTracks().forEach(track => track.stop());
    await audioContext?.close();
    throw new Error('선택한 음악 파일을 읽을 수 없습니다. MP3 또는 WAV 파일을 사용해 주세요.');
  }
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType: format.type, videoBitsPerSecond: 5_000_000 });
  } catch {
    stream.getTracks().forEach(track => track.stop());
    await audioContext?.close();
    throw new Error("영상 녹화기를 시작할 수 없습니다. 다른 브라우저에서 다시 시도해 주세요.");
  }
  const chunks: BlobPart[] = [];
  const recorded = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => reject(new Error('영상 인코딩 중 오류가 발생했습니다.'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || format.type }));
  });
  const frameCounts = slides.map(slide => Math.max(1, Math.round((slide.durationSeconds ?? secondsPerSlide) * fps)));
  const totalFrames = frameCounts.reduce((sum, count) => sum + count, 0);
  let completedFrames = 0;
  const drawFrame = (index: number, progress: number, alpha = 1, offsetX = 0, scale = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(offsetX, 0);
    drawCover(ctx, images[index], width, height, scale * (1 + progress * 0.045));
    ctx.restore();
  };
  try {
    if (signal?.aborted) throw abortError();
    recorder.start(500);
    if (recorder.state !== 'recording') throw new Error('영상 녹화가 시작되지 않았습니다.');
    audioSource?.start();
    const startedAt = performance.now();
    for (let i = 0; i < slides.length; i++) {
      const frames = frameCounts[i];
      const currentTransition = slides[i].transition ?? transition;
      for (let f = 0; f < frames; f++) {
        if (signal?.aborted) throw abortError();
        const p = f / frames;
        ctx.fillStyle = '#17151d'; ctx.fillRect(0, 0, width, height);
        const entering = i > 0 && p < 0.22;
        const t = Math.min(1, p / 0.22);
        if (entering && currentTransition !== 'cut') {
          drawFrame(i - 1, 1, 1);
          if (currentTransition === 'fade') drawFrame(i, p, t);
          else if (currentTransition === 'slide') drawFrame(i, p, 1, width * (1 - t));
          else drawFrame(i, p, t, 0, 1.15 - 0.15 * t);
        } else drawFrame(i, p);
        if (background) {
          ctx.save(); ctx.globalAlpha = 0.22;
          drawCover(ctx, background, width, height);
          ctx.restore();
        }
        const gradient = ctx.createLinearGradient(0, height * .64, 0, height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(1, 'rgba(0,0,0,.7)');
        ctx.fillStyle = gradient; ctx.fillRect(0, height * .64, width, height * .36);
        caption(ctx, slides[i].caption || title, height * .868, width * .033, width);
        ctx.font = `${Math.round(width * .01875)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        ctx.fillText(subtitle.slice(0, 70), width / 2, height * .949, width * .91);
        // Use wall-clock scheduling so drawing time does not stretch the final video.
        const target = startedAt + ((completedFrames + 1) * 1000 / fps);
        await sleep(Math.max(0, target - performance.now()));
        if (signal?.aborted) throw abortError();
        completedFrames++;
        onProgress?.(Math.min(99, Math.round((completedFrames / totalFrames) * 100)));
      }
    }
    if (audioGain && audioContext) {
      audioGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.04);
      await sleep(120);
    }
    recorder.stop();
    const blob = await Promise.race([recorded, sleep(15000).then(() => { throw new Error('영상 인코딩 종료가 지연되고 있습니다. 다시 시도해 주세요.'); })]);
    if (!blob.size) throw new Error('영상 파일이 비어 있습니다.');
    if (blob.size < 1024) onWarning?.('생성된 영상이 비정상적으로 작습니다. 재생 여부를 확인해 주세요.');
    onProgress?.(100);
    if (signal?.aborted) throw abortError();
    if (blob.type && !blob.type.includes(format.extension)) onWarning?.('출력 컨테이너 형식을 재확인해 주세요.');
    return { blob, extension: format.extension };
  } catch (error) {
    if (recorder.state !== 'inactive') { try { recorder.stop(); } catch { /* already stopped */ } }
    // The recording promise may reject after cancellation; consume it safely.
    void recorded.catch(() => undefined);
    throw error;
  } finally {
    try { audioSource?.stop(); } catch { /* source may not have started */ }
    stream.getTracks().forEach((track) => track.stop());
    await audioContext?.close();
  }
}
export function saveVideo(blob: Blob, extension: string, filename = 'moafilm-video') {
  const url = URL.createObjectURL(blob);
  if (!blob.size) throw new Error('비어 있는 영상은 다운로드할 수 없습니다.');
  const safeName = filename.replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').slice(0, 100) || 'moafilm-video';
  const safeExtension = extension === 'mp4' ? 'mp4' : 'webm';
  const a = document.createElement('a'); a.href = url; a.download = `${safeName}.${safeExtension}`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
