# 📱 Testing desde Celular con Supabase Local

## ✅ CONFIGURACIÓN COMPLETADA

Tu Supabase local ahora es accesible desde tu celular en la misma red WiFi.

---

## 🔧 Configuración Actual

```bash
Tu Mac IP: 192.168.1.113
Supabase Local: http://192.168.1.113:54321
Next.js App: http://192.168.1.113:3000
```

---

## 🚀 Pasos para Testear desde Celular

### 1. **Reiniciar Next.js (IMPORTANTE)**

Tu servidor de Next.js debe reiniciarse para tomar las nuevas variables de entorno:

```bash
# En la terminal donde corre npm run dev:
# 1. Detener con Ctrl+C
# 2. Iniciar de nuevo:
npm run dev
```

### 2. **Desde tu Celular**

1. Asegúrate de estar en la **misma red WiFi** que tu Mac
2. Abre el navegador en tu celular
3. Ve a: `http://192.168.1.113:3000`
4. Ahora deberías poder:
   - ✅ Registrarte
   - ✅ Iniciar sesión
   - ✅ Usar la app normalmente

---

## 🎯 ¿Por qué funciona ahora?

### ANTES:
```
Celular → App (192.168.1.113:3000)
          ↓
          Supabase (127.0.0.1:54321) ❌ FALLA
          (Celular busca en sí mismo)
```

### AHORA:
```
Celular → App (192.168.1.113:3000)
          ↓
          Supabase (192.168.1.113:54321) ✅ FUNCIONA
          (Celular busca en tu Mac correctamente)
```

---

## 🔍 Verificación

### Desde tu Mac:

```bash
# Verificar que Supabase escucha en todas las interfaces
npm run supabase:status
# Debe mostrar: API URL: http://127.0.0.1:54321
```

### Desde tu Celular:

```bash
# Abrir en el navegador del celular:
http://192.168.1.113:54321/rest/v1/

# Deberías ver un JSON de respuesta de Supabase
```

---

## ⚠️ Notas Importantes

### Si cambias de Red WiFi:

Tu IP local puede cambiar. Si eso pasa:

```bash
# 1. Obtener nueva IP
ipconfig getifaddr en0

# 2. Actualizar .env.local.supabase con la nueva IP

# 3. Aplicar cambios
npm run env:local

# 4. Reiniciar Next.js
```

### Para crear usuarios de prueba:

```bash
# Aplicar seed con datos de prueba
supabase db reset
```

Esto creará:
- **Admin**: admin@test.com / admin123
- **Clientes**: cliente1@test.com - cliente5@test.com / cliente123
- Sucursales, premios, check-ins de prueba

### URLs Importantes:

| Servicio | URL desde Mac | URL desde Celular |
|----------|---------------|-------------------|
| **Next.js App** | http://localhost:3000 | http://192.168.1.113:3000 |
| **Supabase API** | http://127.0.0.1:54321 | http://192.168.1.113:54321 |
| **Supabase Studio** | http://localhost:54323 | ❌ No accesible |

---

## 🐛 Troubleshooting

### Problema: "Network Error" al registrarse

**Causa:** Next.js no reinició con las nuevas variables

**Solución:**
```bash
# Detener Next.js (Ctrl+C)
npm run dev
```

### Problema: "Cannot connect to Supabase"

**Causa:** Firewall de Mac bloqueando conexiones

**Solución:**
```bash
# En Mac: Preferencias del Sistema > Seguridad > Firewall
# Permitir conexiones entrantes para Node/Next.js
```

### Problema: Celular no puede acceder a la app

**Causa 1:** No están en la misma red WiFi

**Solución:** Verifica que ambos dispositivos estén en la misma WiFi

**Causa 2:** IP cambió

**Solución:**
```bash
ipconfig getifaddr en0  # Obtener IP actual
# Actualizar .env.local.supabase y reiniciar
```

---

## 📝 Testing de Migración 031

Ahora puedes testear la migración 031 (email en user_profiles) desde tu celular:

1. **Registra un nuevo usuario desde el celular**
2. **Ve a Supabase Studio en tu Mac**: http://localhost:54323
3. **Table Editor → user_profiles**
4. **Verifica que el nuevo usuario tiene email** ✅

---

## 🎉 ¡Listo!

Tu setup está completo para:
- ✅ Desarrollo en local (Mac)
- ✅ Testing en móvil real (Celular)
- ✅ Base de datos local (sin afectar producción)
- ✅ Migración 031 funcionando con email sincronizado

**Siguiente paso:** Testear el sistema de paginación que implementaremos 🚀
