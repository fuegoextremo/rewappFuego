"use client";

import { useState, useRef, useCallback } from "react";
import { createClientBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CloudArrowUpIcon, TrashIcon, LinkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface ImageUploaderProps {
  /** Valor actual de la URL de la imagen */
  value: string;
  /** Callback cuando cambia la URL */
  onChange: (url: string) => void;
  /** Nombre del campo para identificar el archivo */
  fieldName: string;
  /** Label del campo */
  label: string;
  /** Descripción/ayuda del campo */
  description?: string;
  /** Tamaño recomendado (ej: "32x32", "180x180", "1200x630") */
  recommendedSize?: string;
  /** Tamaño máximo en bytes (default: 2MB) */
  maxSizeBytes?: number;
  /** Formatos permitidos */
  allowedFormats?: string[];
  /** Ancho del preview */
  previewWidth?: number;
  /** Alto del preview */
  previewHeight?: number;
  /** Si el campo está deshabilitado */
  disabled?: boolean;
  /** Bucket de Supabase Storage */
  bucket?: string;
}

export function ImageUploader({
  value,
  onChange,
  fieldName,
  label,
  description,
  recommendedSize,
  maxSizeBytes = 2 * 1024 * 1024, // 2MB default
  allowedFormats = ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  previewWidth = 100,
  previewHeight = 100,
  disabled = false,
  bucket = "branding",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const supabase = createClientBrowser();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar formato
    if (!allowedFormats.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: `Formatos permitidos: ${allowedFormats.map(f => f.replace("image/", ".")).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño
    if (file.size > maxSizeBytes) {
      toast({
        title: "Archivo muy grande",
        description: `El tamaño máximo es ${formatFileSize(maxSizeBytes)}. Tu archivo: ${formatFileSize(file.size)}`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
      const fileName = `${fieldName}_${Date.now()}.${fileExt}`;
      const filePath = `${fieldName}/${fileName}`;

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      
      onChange(publicUrl);
      setUrlInputValue(publicUrl);
      setShowUrlInput(false);

      toast({
        title: "¡Imagen subida!",
        description: "La imagen se ha guardado correctamente",
      });
    } catch (error) {
      console.error("Error uploading:", error);
      toast({
        title: "Error al subir",
        description: error instanceof Error ? error.message : "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Limpiar input para permitir subir el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [allowedFormats, bucket, fieldName, maxSizeBytes, onChange, supabase.storage, toast]);

  const handleUrlSubmit = () => {
    if (urlInputValue.trim()) {
      onChange(urlInputValue.trim());
      setShowUrlInput(false);
      toast({
        title: "URL actualizada",
        description: "Se usará la URL proporcionada",
      });
    }
  };

  const handleRemove = async () => {
    // Si la URL es del bucket, intentar eliminar el archivo
    if (value.includes(bucket)) {
      try {
        // Extraer path del archivo de la URL
        const urlParts = value.split(`${bucket}/`);
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from(bucket).remove([filePath]);
        }
      } catch (error) {
        console.warn("Could not delete file from storage:", error);
      }
    }
    
    onChange("");
    setUrlInputValue("");
    toast({
      title: "Imagen eliminada",
      description: "La imagen ha sido removida",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {recommendedSize && (
          <span className="text-xs text-gray-500">
            Recomendado: {recommendedSize}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      {/* Preview de imagen actual */}
      {value && (
        <div className="relative inline-block">
          <div className="border rounded-lg overflow-hidden bg-gray-50 p-2">
            <Image
              src={value}
              alt={`Preview ${label}`}
              width={previewWidth}
              height={previewHeight}
              className="object-contain"
              onError={() => {
                toast({
                  title: "Error",
                  description: "No se pudo cargar la imagen",
                  variant: "destructive",
                });
              }}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
            onClick={handleRemove}
            disabled={disabled}
          >
            <TrashIcon className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2 flex-wrap">
        {/* Input oculto para subir archivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedFormats.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="h-4 w-4" />
              Subir imagen
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={disabled || isUploading}
          className="gap-2"
        >
          <LinkIcon className="h-4 w-4" />
          Usar URL
        </Button>
      </div>

      {/* Input de URL manual */}
      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            placeholder="https://ejemplo.com/imagen.png"
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={disabled || !urlInputValue.trim()}
          >
            Aplicar
          </Button>
        </div>
      )}

      {/* Info de formatos */}
      <p className="text-xs text-gray-400">
        Formatos: {allowedFormats.map(f => f.replace("image/", "").toUpperCase()).join(", ")} • 
        Máximo: {formatFileSize(maxSizeBytes)}
      </p>
    </div>
  );
}
