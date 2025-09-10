# 🎭 Animaciones Rive para Rachas

Esta carpeta contiene las animaciones Rive (.riv) para el sistema de rachas.

## 📁 Estructura de Carpetas

```
animations/streaks/
├── initial/           # Animaciones para estado inicial (currentCount = 0)
├── progress/          # Animaciones para progreso general  
├── complete/          # Animaciones para racha completa
├── 5-visits/          # Animaciones específicas para premio de 5 visitas
├── 10-visits/         # Animaciones específicas para premio de 10 visitas
├── 15-visits/         # Animaciones específicas para premio de 15 visitas
└── 20-visits/         # Animaciones específicas para premio de 20 visitas
```

## 🎯 Cómo Usar

1. **Crear/Obtener animación**: Usa Rive Editor para crear archivos .riv
2. **Subir al admin**: Ve a Admin > Premios > Editar Premio
3. **Configurar ruta**: Pon la ruta como `/animations/streaks/celebration.riv`
4. **Auto-detección**: El sistema detecta automáticamente si es .riv o imagen

## 🔧 Formatos Soportados

- ✅ **Rive (.riv)**: Animaciones nativas de Rive
- ✅ **Imágenes**: .jpg, .png, .gif, .webp, etc.
- ✅ **Emojis**: Fallback automático para contenido simple

## 💡 Ejemplos de Rutas

```typescript
// Animación Rive
image_url: "/animations/streaks/fire-buildup.riv"

// Imagen normal (sigue funcionando)
image_url: "/images/streak-start-default.png"

// URL externa
image_url: "https://example.com/animation.riv"
```

## 🎨 Recomendaciones

- **Tamaño**: Máximo 1-2MB por archivo .riv
- **Dimensiones**: Cuadrado (1:1 ratio) para mejor visualización
- **Loop**: Configurar como loop infinito en Rive Editor
- **Performance**: Optimizar para móviles

## 🔄 Backward Compatibility

- Todas las imágenes existentes siguen funcionando
- Si Rive falla, degrada gracefully a emoji/imagen por defecto
- No hay impacto en performance para usuarios sin animaciones
