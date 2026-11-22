import { createWorker } from 'tesseract.js';

/**
 * runOcr(fileOrUrl, onProgress?) -> Promise<string>
 * fileOrUrl: File | Blob | image URL (e.g. '/sample-rx.png'). onProgress(0..1) while recognizing.
 * Runs fully in the browser; the worker is always terminated afterwards.
 */
export async function runOcr(fileOrUrl, onProgress) {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') onProgress(m.progress);
    },
  });
  try {
    const { data } = await worker.recognize(fileOrUrl);
    onProgress?.(1);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
