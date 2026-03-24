import { useRef, useState } from 'react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export default function ImageUploader({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const upload = async (files) => {
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.secure_url) urls.push(data.secure_url);
    }
    onChange([...images, ...urls]);
    setUploading(false);
  };

  const remove = (url) => onChange(images.filter(i => i !== url));

  return (
    <div className="img-uploader">
      <div className="img-preview-grid">
        {images.map(url => (
          <div key={url} className="img-preview-item">
            <img src={url} alt="" />
            <button type="button" className="img-remove" onClick={() => remove(url)}>✕</button>
          </div>
        ))}
        <button
          type="button"
          className="img-add-btn"
          onClick={() => inputRef.current.click()}
          disabled={uploading}
        >
          {uploading ? <span className="img-spinner" /> : <><span>+</span><span>Add Image</span></>}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => upload(Array.from(e.target.files))}
      />
    </div>
  );
}
