import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Star, GripVertical, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface ImageUploaderProps {
  images: string[];
  uploadEndpoint: string;
  deleteEndpoint: string;
  reorderEndpoint?: string;
  maxImages?: number;
  onImagesChange: (images: string[]) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function ImageUploader({
  images,
  uploadEndpoint,
  deleteEndpoint,
  reorderEndpoint,
  maxImages = 5,
  onImagesChange,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [isDragOverZone, setIsDragOverZone] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Upload ---
  const uploadFiles = useCallback(
    async (files: File[]) => {
      const newErrors: string[] = [];
      const validFiles: File[] = [];

      for (const file of files) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          newErrors.push(`"${file.name}": tipo no permitido (solo JPEG, PNG, WEBP).`);
          continue;
        }
        if (file.size > MAX_SIZE_BYTES) {
          newErrors.push(`"${file.name}": supera el limite de 5 MB.`);
          continue;
        }
        validFiles.push(file);
      }

      const slots = maxImages - images.length;
      if (validFiles.length > slots) {
        newErrors.push(`Solo se pueden subir ${slots} imagen(es) mas.`);
        validFiles.splice(slots);
      }

      setErrors(newErrors);

      if (validFiles.length === 0) return;

      setUploading(true);
      const newImages = [...images];

      for (const file of validFiles) {
        try {
          const res = await apiClient.upload<{ url: string }>(uploadEndpoint, file);
          newImages.push(res.url);
          onImagesChange([...newImages]);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error desconocido';
          setErrors((prev) => [...prev, `Error subiendo "${file.name}": ${msg}`]);
        }
      }

      setUploading(false);
    },
    [images, uploadEndpoint, maxImages, onImagesChange]
  );

  // --- Delete ---
  const handleDelete = useCallback(
    async (index: number) => {
      try {
        await apiClient.delete(`${deleteEndpoint}/${index}`);
        const updated = images.filter((_, i) => i !== index);
        onImagesChange(updated);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setErrors([`Error eliminando imagen: ${msg}`]);
      }
    },
    [images, deleteEndpoint, onImagesChange]
  );

  // --- Reorder (native HTML5 drag) ---
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      setDragSourceIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    },
    []
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
      e.preventDefault();
      setDragOverIndex(null);

      if (dragSourceIndex === null || dragSourceIndex === targetIndex) {
        setDragSourceIndex(null);
        return;
      }

      const reordered = [...images];
      const [moved] = reordered.splice(dragSourceIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      setDragSourceIndex(null);

      onImagesChange(reordered);

      if (reorderEndpoint) {
        try {
          await apiClient.put(reorderEndpoint, { order: reordered });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error desconocido';
          setErrors([`Error al reordenar: ${msg}`]);
        }
      }
    },
    [dragSourceIndex, images, reorderEndpoint, onImagesChange]
  );

  const handleDragEnd = useCallback(() => {
    setDragSourceIndex(null);
    setDragOverIndex(null);
  }, []);

  // --- Drop zone ---
  const handleZoneDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverZone(true);
  }, []);

  const handleZoneDragLeave = useCallback(() => {
    setIsDragOverZone(false);
  }, []);

  const handleZoneDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOverZone(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) uploadFiles(files);
    },
    [uploadFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) uploadFiles(files);
      // Reset so same file can be re-selected
      e.target.value = '';
    },
    [uploadFiles]
  );

  const canUploadMore = images.length < maxImages && !uploading;

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {images.map((url, index) => (
            <div
              key={url + index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={[
                'relative aspect-square rounded-md overflow-hidden border cursor-grab active:cursor-grabbing transition-all',
                dragOverIndex === index && dragSourceIndex !== index
                  ? 'border-primary ring-2 ring-primary scale-105'
                  : 'border-border',
                dragSourceIndex === index ? 'opacity-40' : 'opacity-100',
              ].join(' ')}
            >
              <img
                src={url}
                alt={`Imagen ${index + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />

              {/* Primary star badge */}
              {index === 0 && (
                <span className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow">
                  <Star className="w-3 h-3 fill-current" />
                </span>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                <GripVertical className="w-5 h-5 text-white drop-shadow" />
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow transition-colors"
                  aria-label={`Eliminar imagen ${index + 1}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canUploadMore && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onDragOver={handleZoneDragOver}
          onDragLeave={handleZoneDragLeave}
          onDrop={handleZoneDrop}
          className={[
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors',
            isDragOverZone
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-primary/50 hover:bg-muted/30 text-muted-foreground',
          ].join(' ')}
        >
          {uploading ? (
            <>
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-sm font-medium">Subiendo...</span>
            </>
          ) : (
            <>
              <Upload className="w-7 h-7" />
              <span className="text-sm font-medium">
                Arrastra imagenes aqui o haz clic para seleccionar
              </span>
              <span className="text-xs">JPEG, PNG o WEBP · Max 5 MB</span>
            </>
          )}

          {/* Counter */}
          <span className="text-xs font-mono mt-1">
            {images.length}/{maxImages}
          </span>
        </div>
      )}

      {/* At max */}
      {images.length >= maxImages && (
        <p className="text-xs text-muted-foreground text-center">
          Limite de {maxImages} imagenes alcanzado.
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Validation errors */}
      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((msg, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-destructive">
              <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
