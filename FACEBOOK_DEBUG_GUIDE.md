# 🔍 Guía de Debug para Facebook OAuth

## 📱 1. Herramientas de Facebook para Pruebas

### Graph API Explorer
- **URL**: https://developers.facebook.com/tools/explorer/
- **Uso**: Probar llamadas a la API de Facebook
- **Endpoints importantes**:
  ```
  GET /me?fields=id,name,email,first_name,last_name,picture
  GET /me/permissions
  ```

### Access Token Debugger
- **URL**: https://developers.facebook.com/tools/debug/accesstoken/
- **Uso**: Validar que el token tenga los permisos correctos
- **Verificar**: `email`, `public_profile` permissions

## 🔧 2. Configuración Requerida en Facebook App

### App Settings → Basic
```
App ID: [Tu App ID]
App Secret: [Tu App Secret]
App Domains: localhost, tudominio.com
```

### Facebook Login → Settings
```
Valid OAuth Redirect URIs:
- http://localhost:3000/auth/callback
- https://tudominio.com/auth/callback

Client OAuth Login: ✅ Yes
Web OAuth Login: ✅ Yes
```

## 🧪 3. Pasos para Probar el Login

### Método 1: Navegador (Recomendado)
1. Abrir: `http://localhost:3000/login`
2. Clic en "Continuar con Facebook"
3. Autorizar permisos
4. Verificar redirección final

### Método 2: Graph API Explorer
1. Generar User Access Token
2. Probar endpoint: `/me?fields=id,name,email,first_name,last_name`
3. Verificar que devuelve datos esperados

## 🔍 4. Debugging en el Código

### A. Logs en Callback OAuth
```typescript
// En src/app/auth/callback/route.ts
console.log('🔍 Facebook user data:', {
  id: user.id,
  email: user.email,
  user_metadata: user.user_metadata
})
```

### B. Logs en ProfileForm
```typescript
// En ProfileForm.tsx
console.log('📝 Enviando datos:', {
  first_name: formData.first_name,
  last_name: formData.last_name,
  phone: formData.phone,
  birth_date: formData.birth_date
})
```

## ⚠️ 5. Problemas Comunes

### Error: "Invalid OAuth redirect URI"
- **Causa**: URL de callback no registrada
- **Solución**: Agregar URL exacta en Facebook App Settings

### Error: "App Not Setup"
- **Causa**: App en modo desarrollo
- **Solución**: Publicar app o agregar tester roles

### Error: "Permissions Error"
- **Causa**: Faltan permisos email/public_profile
- **Solución**: Verificar en App Review → Permissions

## 📊 6. Comandos de Debug Útiles

### Verificar variables de entorno
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Ver logs del servidor
```bash
npm run dev
# Observar logs de OAuth en consola
```

### Inspeccionar Network Tab
1. F12 → Network
2. Filtrar por "auth" o "callback"
3. Verificar respuestas de Supabase

## 📋 7. Checklist de Validación

- [ ] App ID configurado en .env.local
- [ ] Redirect URIs registradas en Facebook
- [ ] Permisos email y public_profile aprobados
- [ ] Supabase Auth configurado con Facebook
- [ ] Middleware permite rutas /auth/callback y /welcome
- [ ] ProfileForm maneja campos faltantes correctamente

## 🚀 8. Testing en Producción

### Variables de entorno
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

### URLs de producción
```
Facebook App → Settings → Basic:
App Domains: tudominio.com

Facebook Login → Settings:
Valid OAuth Redirect URIs: https://tudominio.com/auth/callback
```