// Camera capture for OCR. Errors are thrown as { code: 'no-camera' | 'denied', message }
// so the UI can fall back to file upload.

/** startCamera(videoEl) -> Promise<MediaStream> (rear camera preferred) */
export async function startCamera(videoEl) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw { code: 'no-camera', message: 'This browser cannot use the camera. Please upload a photo instead.' };
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } },
      audio: false,
    });
  } catch (e) {
    const denied = e?.name === 'NotAllowedError' || e?.name === 'SecurityError';
    throw denied
      ? { code: 'denied', message: 'Camera permission was blocked. Please upload a photo instead.' }
      : { code: 'no-camera', message: 'No camera found. Please upload a photo instead.' };
  }
  if (videoEl) {
    videoEl.srcObject = stream;
    videoEl.setAttribute('playsinline', ''); // iOS: no fullscreen takeover
    videoEl.muted = true;
    await videoEl.play().catch(() => {});
  }
  return stream;
}

/** stopCamera(stream) — turns the camera light off. */
export function stopCamera(stream) {
  stream?.getTracks().forEach((t) => t.stop());
}

/** captureFrame(videoEl, contrast = 1.5) -> Promise<Blob> PNG, grayscale + contrast boost for OCR. */
export function captureFrame(videoEl, contrast = 1.5) {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(videoEl, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const v = Math.max(0, Math.min(255, (gray - 128) * contrast + 128));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject({ code: 'no-camera', message: 'Could not capture the photo.' })), 'image/png'));
}
