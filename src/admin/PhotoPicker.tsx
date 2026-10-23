import { useRef, useState, type DragEvent } from 'react';
import { uploadPhoto } from '../catalog/api';
import { compressImage, isUploadedPhoto, usePhotoSrc } from '../catalog/photos';

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Called with each new "photo:<id>" so the editor can clean up photos that end up unused. */
  onUploaded: (ref: string) => void;
  label: string;
  /** The small version used in each size row. */
  compact?: boolean;
};

/** Pick a photo from the computer (or drop one on it). It is shrunk in the browser and saved to Firestore. */
export function PhotoPicker({ value, onChange, onUploaded, label, compact }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const src = usePhotoSrc(value || undefined);

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choose a photo file (JPG, PNG, WebP).');
    setBusy(true);
    setError('');
    try {
      const ref = await uploadPhoto(await compressImage(file));
      onUploaded(ref);
      onChange(ref);
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(
        code === 'permission-denied'
          ? 'Upload was refused. Publish the latest firestore.rules in the Firebase console, then try again.'
          : err instanceof Error && !code
            ? err.message
            : 'Upload failed. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={['photo-picker', compact && 'photo-picker--compact', dragging && 'is-dragging'].filter(Boolean).join(' ')}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <span className="photo-picker__preview">
        {busy ? <span className="admin-muted">…</span> : src ? <img src={src} alt="" /> : !compact && <span className="admin-muted">No photo</span>}
      </span>
      <div className="photo-picker__controls">
        {!compact && <span className="photo-picker__label">{label}</span>}
        <div className="photo-picker__buttons">
          <button type="button" className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? 'Uploading…' : compact ? 'Choose' : value ? 'Change photo' : 'Choose from computer'}
            <span className="sr-only"> {label}</span>
          </button>
          {value && !busy && (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => onChange('')}>
              {compact ? '✕' : 'Remove'}
              <span className="sr-only"> {label}</span>
            </button>
          )}
        </div>
        {!compact && !isUploadedPhoto(value) && (
          <details className="photo-picker__advanced" open={Boolean(value)}>
            <summary>Use a file name or link instead</summary>
            <input list="site-images" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} file name or link`} />
          </details>
        )}
        {!compact && <span className="admin-muted photo-picker__hint">Or drop a photo here. It is resized automatically.</span>}
        {error && <span className="admin-error">{error}</span>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}
