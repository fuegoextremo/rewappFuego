# Spec Delta: Prize Image Storage

**Capability**: Prize Image Storage  
**Change ID**: `add-prize-image-upload`  
**Operation scope**: ADDED (bucket + policies) + MODIFIED (PrizeForm UI)

---

## ADDED Requirements

### Requirement: Bucket de Storage para Premios
WHEN el sistema inicializa el entorno de Supabase,
the system SHALL tener un bucket público llamado `prizes` disponible en Supabase Storage para almacenar imágenes de premios.

#### Scenario: Bucket creado correctamente
GIVEN que se aplica la migración `add-prize-image-upload`
WHEN se consulta el listado de buckets de Supabase Storage
THEN el bucket `prizes` existe con `public = true`
AND el bucket acepta archivos de tipo `image/png`, `image/jpeg`, `image/jpg`, `image/webp`

---

### Requirement: Políticas de Acceso al Bucket prizes
WHEN un usuario realiza una operación sobre el bucket `prizes`,
the system SHALL permitir la operación solo según el rol del usuario.

#### Scenario: Lectura pública sin autenticación
GIVEN que ningún usuario está autenticado
WHEN se solicita la URL pública de un archivo en el bucket `prizes`
THEN el sistema devuelve la URL accesible públicamente
AND no requiere token de autenticación

#### Scenario: Subida de archivo por administrador
GIVEN que el usuario está autenticado con rol `admin` o `superadmin`
WHEN el usuario sube una imagen al bucket `prizes`
THEN el sistema almacena el archivo correctamente
AND devuelve la URL pública del archivo

#### Scenario: Intento de subida sin autorización
GIVEN que el usuario no está autenticado o tiene un rol distinto de `admin`/`superadmin`
WHEN el usuario intenta subir un archivo al bucket `prizes`
THEN el sistema rechaza la operación con error de permisos (403)
AND no almacena ningún archivo

---

## MODIFIED Requirements

### Requirement: Campo de Imagen en Modal de Edición de Premio
WHEN un administrador abre el modal de creación o edición de un premio,
the system SHALL presentar un componente `ImageUploader` en lugar de un campo de texto plano para el campo `image_url`.

#### Scenario: Subida de imagen desde archivo local
GIVEN que el administrador está en el modal de edición de un premio
WHEN el administrador selecciona un archivo de imagen desde su dispositivo
THEN el sistema sube el archivo al bucket `prizes` de Supabase Storage
AND actualiza el campo `image_url` del formulario con la URL pública resultante
AND muestra una previsualización de la imagen subida

#### Scenario: Ingreso de URL externa
GIVEN que el administrador está en el modal de edición de un premio
WHEN el administrador activa la opción de URL externa e ingresa una URL válida
THEN el sistema actualiza el campo `image_url` del formulario con esa URL
AND muestra una previsualización de la imagen referenciada

#### Scenario: Eliminación de imagen actual
GIVEN que un premio tiene una imagen almacenada en el bucket `prizes`
WHEN el administrador pulsa el botón de eliminar imagen en el `ImageUploader`
THEN el sistema elimina el archivo del bucket `prizes`
AND limpia el campo `image_url` del formulario

#### Scenario: Compatibilidad con URLs existentes
GIVEN que un premio tiene `image_url` con valor de una ruta local (`/images/...`) o una URL de Vercel/CDN externo
WHEN el administrador abre el modal de edición de ese premio
THEN el `ImageUploader` muestra la URL existente correctamente en el campo de URL externa
AND no genera errores de validación

#### Scenario: Validación de formato y tamaño
GIVEN que el administrador intenta subir un archivo al bucket `prizes`
WHEN el archivo excede 2 MB o no es de tipo `image/png`, `image/jpeg`, `image/jpg` o `image/webp`
THEN el sistema rechaza la carga
AND muestra un mensaje de error descriptivo al administrador
AND no modifica el valor actual de `image_url`
