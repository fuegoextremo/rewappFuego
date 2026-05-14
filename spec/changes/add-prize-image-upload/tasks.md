# Implementation Tasks

## Change: `add-prize-image-upload`

1. Crear migración SQL para el bucket `prizes` en Supabase Storage con acceso público de lectura.
2. Agregar políticas RLS al bucket `prizes`: lectura pública (`SELECT`) y escritura autenticada solo para roles `admin` / `superadmin` (`INSERT`, `UPDATE`, `DELETE`).
3. Aplicar la migración en el entorno local con `supabase db push` y verificar que el bucket aparece en Supabase Studio.
4. En `PrizeForm.tsx`, agregar el import del componente `ImageUploader` de `@/components/shared/ImageUploader`.
5. En `PrizeForm.tsx`, reemplazar el bloque del campo `image_url` (el `<Input type="text">` y su `<div>` de ayuda) por `<ImageUploader>` con las props: `bucket="prizes"`, `fieldName="prize_image"`, `label="Imagen del premio"`, `value={formData.image_url ?? ""}`, `onChange={(url) => setFormData({ ...formData, image_url: url })}`.
6. Verificar que `ImageUploader` muestra correctamente la tab de "URL externa" para mantener la compatibilidad con URLs de Vercel o CDN externo.
7. Probar el flujo completo en local: subir una imagen desde archivo, verificar que se guarda en el bucket `prizes`, verificar que `image_url` se actualiza con la URL pública de Supabase.
8. Probar el flujo de URL externa: pegar una URL en el campo externo, guardar el premio, verificar que `image_url` almacena la URL externamente provista.
9. Probar compatibilidad regresiva: abrir un premio existente que ya tenga `image_url` con ruta `/images/...` o URL de Vercel, verificar que se muestra correctamente sin errores.
10. Aplicar la migración en producción (`supabase db push --linked`) una vez validado en local.
