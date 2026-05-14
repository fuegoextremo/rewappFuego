# Proposal: Prize Image Upload via Supabase Storage

**Change ID**: `add-prize-image-upload`  
**Date**: 2026-05-14  
**Status**: Pending Approval

---

## Why

Actualmente, el campo de imagen de un premio (`image_url`) en el modal de edición de premios acepta únicamente texto libre: una URL externa o una ruta local del servidor. Esto obliga al administrador a subir las imágenes manualmente al directorio de Vercel y conocer la URL resultante antes de poder asignarla al premio.

Este flujo es frágil y depende de un proceso externo al sistema. Al mismo tiempo, el proyecto ya cuenta con:
- Un bucket `branding` en Supabase Storage con un componente reutilizable `ImageUploader` que soporta carga de archivos, previsualización y URL externa.
- Una infraestructura de Storage en Supabase lista para crear buckets adicionales.

El cambio propone reemplazar el campo de texto plano en `PrizeForm` por el componente `ImageUploader`, apuntando a un nuevo bucket `prizes`, y manteniendo la opción de URL externa.

---

## What Changes

- **`PrizeForm.tsx`**: Reemplazar el `<Input type="text">` del campo `image_url` con el componente `<ImageUploader>`, configurado con `bucket="prizes"`, `fieldName="prize_image"` y soporte para URL externa.
- **Supabase Storage**: Crear un nuevo bucket público llamado `prizes` para almacenar las imágenes de los premios.
- **RLS Policies**: Agregar políticas en el bucket `prizes` para permitir lectura pública y escritura solo a usuarios autenticados con rol `admin` o `superadmin`.
- **No se modifica** el campo `image_url` en la tabla `prizes` de la base de datos (ya es `text | null`).
- **No se modifica** el server action `updatePrize` / `createPrize` (ya recibe `image_url` como string).

---

## Impact

| Área | Impacto |
|---|---|
| `src/components/admin/PrizeForm.tsx` | Modificado: reemplazar campo texto por `ImageUploader` |
| `src/components/shared/ImageUploader.tsx` | Sin cambios, se reutiliza tal cual |
| `supabase/migrations/` | Nueva migración SQL para crear bucket `prizes` y sus políticas |
| Base de datos (`prizes.image_url`) | Sin cambios de esquema |
| Server actions (`actions.ts`) | Sin cambios |
| Usuarios administradores | Mejora UX: pueden subir imágenes directamente desde el modal |
| Imágenes existentes | Compatible: las URLs ya guardadas (Vercel o externas) siguen funcionando |
