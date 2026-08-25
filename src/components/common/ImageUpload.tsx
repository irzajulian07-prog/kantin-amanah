import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadMediaFile, StorageCategory } from '../../firebase/storage';

interface ImageUploadProps {
  id?: string;
  label?: string;
  category: StorageCategory;
  currentImageURL?: string;
  onImageUploaded: (url: string) => void;
  aspectRatio?: 'square' | 'wide';
  helperText?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  id = 'image-upload',
  label = 'Unggah Foto',
  category,
  currentImageURL,
  onImageUploaded,
  aspectRatio = 'square',
  helperText = 'Format JPG, PNG atau WebP (Maks. 2MB)'
}) => {
  const [preview, setPreview] = useState<string | null>(currentImageURL || null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 3MB.');
      return;
    }

    setIsUploading(true);
    try {
      // Local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      // Upload to Firebase Storage or local fallback
      const finalURL = await uploadMediaFile(file, category);
      setPreview(finalURL);
      onImageUploaded(finalURL);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Gagal mengunggah gambar. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-slate-700">{label}</label>}

      <div
        id={id}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group cursor-pointer border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden flex flex-col items-center justify-center p-4 text-center ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50'
            : preview
            ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/60'
        } ${aspectRatio === 'square' ? 'min-h-[140px]' : 'min-h-[120px]'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {preview ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={preview}
              alt="Preview"
              referrerPolicy="no-referrer"
              className={`max-h-36 object-contain rounded-lg shadow-sm ${
                aspectRatio === 'square' ? 'w-32 h-32 object-cover' : 'w-full h-32 object-cover'
              }`}
            />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg backdrop-blur-xs">
              <span className="text-xs font-medium text-white bg-slate-900/80 px-2.5 py-1 rounded-md">
                Ganti Gambar
              </span>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow transition-colors"
                title="Hapus foto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2 text-slate-500">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200/80 flex items-center justify-center mb-2 text-slate-600 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
            )}
            <p className="text-xs font-medium text-slate-700">
              {isUploading ? 'Mengunggah gambar...' : 'Klik atau seret gambar ke sini'}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">{helperText}</p>
          </div>
        )}
      </div>
    </div>
  );
};
