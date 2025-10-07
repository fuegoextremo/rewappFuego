# Plan: Implementación de Paginación en Historiales de Usuario

**Fecha:** 6 de octubre de 2025  
**Rama:** `feature/supabase-local-migrations`  
**Prioridad:** Media - Performance  
**Estado:** Listo para implementar

---

## 📋 Índice

1. [Problema Actual](#problema-actual)
2. [Solución Propuesta](#solución-propuesta)
3. [Arquitectura](#arquitectura)
4. [Plan de Implementación](#plan-de-implementación)
5. [Testing](#testing)

---

## 🔴 Problema Actual

### Situación
Las tablas de **Historial de Visitas** y **Historial de Cupones** en el detalle de usuario (`/admin/users/[id]`) cargan **TODOS** los registros de una vez, sin paginación.

### Impacto por Volumen de Datos

**Usuario con 500 check-ins:**
```
Query actual: SELECT * FROM check_ins WHERE user_id = '123'
Resultado: 500 registros
Tiempo: ~800ms
Memoria: ~5MB
HTML generado: ~50KB
```

**Usuario con 300 cupones:**
```
Query actual: SELECT * FROM coupons WHERE user_id = '123'
Resultado: 300 registros
Tiempo: ~600ms
Memoria: ~3MB
HTML generado: ~40KB
```

### Problemas Identificados

| Problema | Descripción | Impacto |
|----------|-------------|---------|
| **Performance** | Queries lentas con muchos registros | UX degradada |
| **Memoria** | Carga excesiva de datos en cliente | Navegador lento |
| **UX** | Scroll infinito sin navegación | Difícil encontrar datos |
| **Escalabilidad** | No funciona con miles de registros | Sistema frágil |

---

## ✅ Solución Propuesta

### Estrategia: Paginación Client-Side con Server Actions

**Patrón ya probado en `/admin/users`** (reutilizaremos el mismo enfoque)

#### Componentes a Crear:
1. **Hook genérico:** `usePagination<T>()` - Maneja estado de paginación
2. **Componente UI:** `Pagination` - UI reutilizable de navegación
3. **Server Actions:** Queries paginadas para check-ins y cupones
4. **Client Wrappers:** Componentes que orquestan la paginación

#### Ventajas:
- ✅ Reutiliza patrón existente y probado
- ✅ Interactividad instantánea (sin full page reload)
- ✅ Mantiene consistencia con `/admin/users`
- ✅ Permite agregar filtros en el futuro
- ✅ **CERO cambios en base de datos**

---

## 🏗️ Arquitectura

### Estructura de Componentes

```
┌─────────────────────────────────────────────────────────┐
│  page.tsx (Server Component)                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │  - Fetch inicial (20 registros por tabla)      │   │
│  │  - Pasa initialData a componentes client       │   │
│  └─────────────────────────────────────────────────┘   │
│                        ↓                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  CheckinHistoryClient (Client Component)        │   │
│  │  ┌───────────────────────────────────────────┐ │   │
│  │  │  usePagination<CheckInWithDetails>        │ │   │
│  │  │  - Estado: page, pageSize, total          │ │   │
│  │  │  - Llama: getCheckinsPaginated()          │ │   │
│  │  └───────────────────────────────────────────┘ │   │
│  │                    ↓                            │   │
│  │  ┌───────────────────────────────────────────┐ │   │
│  │  │  CheckinHistoryTable (Presentation)       │ │   │
│  │  │  ✅ SIN CAMBIOS - Solo renderiza datos   │ │   │
│  │  └───────────────────────────────────────────┘ │   │
│  │                    ↓                            │   │
│  │  ┌───────────────────────────────────────────┐ │   │
│  │  │  Pagination (Generic UI)                  │ │   │
│  │  │  - Navegación: ◀ 1 2 3 ▶                 │ │   │
│  │  │  - Selector: 10, 20, 50, 100 items       │ │   │
│  │  └───────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

[Misma estructura para CouponHistoryClient]
```

---

## 📝 Plan de Implementación

### Fase 1: Crear Componentes Genéricos Reutilizables

#### 1.1. Hook de Paginación Genérico

**Archivo:** `src/hooks/use-pagination.ts` (NUEVO)

```typescript
import { useState, useCallback } from 'react'

export type UsePaginationOptions<T> = {
  initialData: T[]
  initialTotal: number
  initialPage?: number
  initialPageSize?: number
  fetchFn: (page: number, pageSize: number) => Promise<{
    data: T[]
    total: number
  }>
}

export function usePagination<T>({ 
  initialData, 
  initialTotal,
  initialPage = 1,
  initialPageSize = 20,
  fetchFn 
}: UsePaginationOptions<T>) {
  const [data, setData] = useState<T[]>(initialData)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [isLoading, setIsLoading] = useState(false)
  
  const totalPages = Math.ceil(total / pageSize)
  
  const fetchData = useCallback(async (newPage: number, newPageSize: number) => {
    setIsLoading(true)
    try {
      const result = await fetchFn(newPage, newPageSize)
      setData(result.data)
      setTotal(result.total)
      setPage(newPage)
      setPageSize(newPageSize)
    } catch (error) {
      console.error('Error fetching paginated data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn])
  
  const handlePageChange = useCallback((newPage: number) => {
    fetchData(newPage, pageSize)
  }, [fetchData, pageSize])
  
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    fetchData(1, newPageSize) // Reset a página 1
  }, [fetchData])
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    handlePageChange,
    handlePageSizeChange,
  }
}
```

**Características:**
- ✅ Genérico con TypeScript: `<T>`
- ✅ Maneja estado de paginación completo
- ✅ Callbacks optimizados con `useCallback`
- ✅ Loading states
- ✅ Reutilizable para cualquier tipo de datos

---

#### 1.2. Componente de Paginación Genérico

**Archivo:** `src/components/shared/Pagination.tsx` (NUEVO)

```typescript
'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type PaginationProps = {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  itemName: string // "usuarios", "visitas", "cupones"
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  isLoading?: boolean
  pageSizeOptions?: number[] // default: [10, 20, 50, 100]
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  itemName,
  onPageChange,
  onPageSizeChange,
  isLoading,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg border">
      {/* Results Info */}
      <div className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">{startItem}</span> a{' '}
        <span className="font-medium text-foreground">{endItem}</span> de{' '}
        <span className="font-medium text-foreground">{totalItems}</span> {itemName}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Por página:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious || isLoading}
            title="Primera página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrevious || isLoading}
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 px-3">
            <span className="text-sm font-medium">{currentPage}</span>
            <span className="text-sm text-muted-foreground">de</span>
            <span className="text-sm font-medium">{totalPages || 1}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext || isLoading}
            title="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext || isLoading}
            title="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Características:**
- ✅ Basado en `UserPagination` existente
- ✅ Prop `itemName` para pluralización dinámica
- ✅ Responsive (mobile y desktop)
- ✅ Estados de carga
- ✅ Navegación completa: Primera, Anterior, Siguiente, Última

---

### Fase 2: Crear Server Actions Paginadas

#### 2.1. Server Action para Check-ins

**Archivo:** `src/app/admin/users/[id]/actions.ts` (AGREGAR)

```typescript
// ============================================
// PAGINACIÓN DE CHECK-INS
// ============================================

import { CheckInWithDetails } from '@/components/admin/CheckinHistoryTable'

export type PaginatedCheckinsResponse = {
  checkins: CheckInWithDetails[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  error?: string
}

/**
 * Server Action para obtener check-ins paginados de un usuario
 * 
 * @param userId - ID del usuario
 * @param page - Número de página (1-indexed)
 * @param pageSize - Cantidad de items por página
 * @returns Check-ins paginados con totales
 */
export async function getCheckinsPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedCheckinsResponse> {
  const supabase = createAdminClient()
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  try {
    const { data, error, count } = await supabase
      .from("check_ins")
      .select(
        `*,
         branches ( name ),
         user_profiles!check_ins_verified_by_fkey ( first_name, last_name )`,
        { count: 'exact' }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(start, end)

    if (error) {
      console.error('❌ Error fetching check-ins:', error)
      return {
        checkins: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        error: error.message
      }
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    console.log(`✅ Check-ins fetched: ${data?.length}/${count} (page ${page}/${totalPages})`)

    return {
      checkins: (data || []) as CheckInWithDetails[],
      total: count || 0,
      page,
      pageSize,
      totalPages
    }
  } catch (error) {
    console.error('❌ Unexpected error in getCheckinsPaginated:', error)
    return {
      checkins: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

**Características:**
- ✅ Usa `.range(start, end)` para paginación
- ✅ Usa `{ count: 'exact' }` para total
- ✅ Mantiene los mismos JOINs existentes
- ✅ Mismo orden: `created_at DESC`
- ✅ Manejo de errores robusto
- ✅ Logs para debugging

---

#### 2.2. Server Action para Cupones

**Archivo:** `src/app/admin/users/[id]/actions.ts` (AGREGAR)

```typescript
// ============================================
// PAGINACIÓN DE CUPONES
// ============================================

import { CouponWithDetails } from '@/components/admin/CouponHistoryTable'

export type PaginatedCouponsResponse = {
  coupons: CouponWithDetails[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  error?: string
}

/**
 * Server Action para obtener cupones paginados de un usuario
 * 
 * @param userId - ID del usuario
 * @param page - Número de página (1-indexed)
 * @param pageSize - Cantidad de items por página
 * @returns Cupones paginados con totales
 */
export async function getCouponsPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedCouponsResponse> {
  const supabase = createAdminClient()
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  try {
    const { data, error, count } = await supabase
      .from("coupons")
      .select(
        `*, prizes ( name, description )`,
        { count: 'exact' }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(start, end)

    if (error) {
      console.error('❌ Error fetching coupons:', error)
      return {
        coupons: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        error: error.message
      }
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    console.log(`✅ Coupons fetched: ${data?.length}/${count} (page ${page}/${totalPages})`)

    return {
      coupons: (data || []) as CouponWithDetails[],
      total: count || 0,
      page,
      pageSize,
      totalPages
    }
  } catch (error) {
    console.error('❌ Unexpected error in getCouponsPaginated:', error)
    return {
      coupons: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

**Características:**
- ✅ Mismo patrón que check-ins
- ✅ Mantiene JOIN con `prizes`
- ✅ Mismo orden: `created_at DESC`
- ✅ Manejo de errores consistente

---

### Fase 3: Crear Client Components Paginados

#### 3.1. CheckinHistoryClient

**Archivo:** `src/components/admin/CheckinHistoryClient.tsx` (NUEVO)

```typescript
'use client'

import { CheckinHistoryTable, CheckInWithDetails } from './CheckinHistoryTable'
import { Pagination } from '@/components/shared/Pagination'
import { usePagination } from '@/hooks/use-pagination'
import { getCheckinsPaginated } from '@/app/admin/users/[id]/actions'

type CheckinHistoryClientProps = {
  userId: string
  initialCheckins: CheckInWithDetails[]
  initialTotal: number
}

export function CheckinHistoryClient({
  userId,
  initialCheckins,
  initialTotal,
}: CheckinHistoryClientProps) {
  const {
    data: checkins,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination<CheckInWithDetails>({
    initialData: initialCheckins,
    initialTotal,
    initialPageSize: 20,
    fetchFn: async (page, pageSize) => {
      const result = await getCheckinsPaginated(userId, page, pageSize)
      return {
        data: result.checkins,
        total: result.total,
      }
    },
  })

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-card rounded-lg border">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando visitas...</p>
          </div>
        </div>
      ) : (
        <CheckinHistoryTable checkins={checkins} />
      )}
      
      {/* Pagination */}
      {total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={total}
          itemName="visitas"
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
```

**Características:**
- ✅ Usa hook `usePagination`
- ✅ Pasa `userId` a la server action
- ✅ Loading state dedicado
- ✅ Paginación condicional (solo si hay datos)

---

#### 3.2. CouponHistoryClient

**Archivo:** `src/components/admin/CouponHistoryClient.tsx` (NUEVO)

```typescript
'use client'

import { CouponHistoryTable, CouponWithDetails } from './CouponHistoryTable'
import { Pagination } from '@/components/shared/Pagination'
import { usePagination } from '@/hooks/use-pagination'
import { getCouponsPaginated } from '@/app/admin/users/[id]/actions'

type CouponHistoryClientProps = {
  userId: string
  initialCoupons: CouponWithDetails[]
  initialTotal: number
}

export function CouponHistoryClient({
  userId,
  initialCoupons,
  initialTotal,
}: CouponHistoryClientProps) {
  const {
    data: coupons,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination<CouponWithDetails>({
    initialData: initialCoupons,
    initialTotal,
    initialPageSize: 20,
    fetchFn: async (page, pageSize) => {
      const result = await getCouponsPaginated(userId, page, pageSize)
      return {
        data: result.coupons,
        total: result.total,
      }
    },
  })

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-card rounded-lg border">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando cupones...</p>
          </div>
        </div>
      ) : (
        <CouponHistoryTable coupons={coupons} userId={userId} />
      )}
      
      {/* Pagination */}
      {total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={total}
          itemName="cupones"
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
```

**Características:**
- ✅ Mismo patrón que CheckinHistoryClient
- ✅ Pasa `userId` tanto a server action como a tabla (para botón eliminar)
- ✅ itemName: "cupones"

---

### Fase 4: Actualizar Página Principal

#### 4.1. Modificar page.tsx

**Archivo:** `src/app/admin/users/[id]/page.tsx` (MODIFICAR)

**Cambios a realizar:**

1. **Importar nuevos componentes:**
```typescript
import { CheckinHistoryClient } from '@/components/admin/CheckinHistoryClient'
import { CouponHistoryClient } from '@/components/admin/CouponHistoryClient'
import { getCheckinsPaginated, getCouponsPaginated } from './actions'
```

2. **Cambiar fetch de datos en Promise.all:**
```typescript
// ANTES:
const [profileResult, authUserResult, checkinsResult, couponsResult, prizesResult] =
  await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", id).single(),
    supabase.auth.admin.getUserById(id),
    supabase
      .from("check_ins")
      .select(`*, branches ( name ), user_profiles!check_ins_verified_by_fkey ( first_name, last_name )`)
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("coupons")
      .select(`*, prizes ( name, description )`)
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("prizes").select("*").eq("is_active", true),
  ])

// DESPUÉS:
const [profileResult, authUserResult, checkinsResult, couponsResult, prizesResult] =
  await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", id).single(),
    supabase.auth.admin.getUserById(id),
    getCheckinsPaginated(id, 1, 20), // ✅ Primera página, 20 items
    getCouponsPaginated(id, 1, 20),  // ✅ Primera página, 20 items
    supabase.from("prizes").select("*").eq("is_active", true),
  ])
```

3. **Actualizar destructuring de resultados:**
```typescript
// ANTES:
const { data: checkins, error: checkinsError } = checkinsResult
const { data: coupons, error: couponsError } = couponsResult

// DESPUÉS:
const checkinsError = checkinsResult.error
const couponsError = couponsResult.error
```

4. **Cambiar renderizado de Card de Check-ins:**
```typescript
// ANTES:
<Card>
  <CardHeader>
    <CardTitle>Historial de Visitas</CardTitle>
    <CardDescription>
      Lista de todos los check-ins registrados para este usuario.
    </CardDescription>
  </CardHeader>
  <CardContent>
    {checkinsError ? (
      <p className="text-red-500">Error al cargar el historial de visitas.</p>
    ) : (
      <CheckinHistoryTable checkins={checkins || []} />
    )}
  </CardContent>
</Card>

// DESPUÉS:
<Card>
  <CardHeader>
    <CardTitle>Historial de Visitas</CardTitle>
    <CardDescription>
      Lista de todos los check-ins registrados para este usuario.
    </CardDescription>
  </CardHeader>
  <CardContent>
    {checkinsError ? (
      <p className="text-red-500">Error al cargar el historial de visitas.</p>
    ) : (
      <CheckinHistoryClient
        userId={id}
        initialCheckins={checkinsResult.checkins}
        initialTotal={checkinsResult.total}
      />
    )}
  </CardContent>
</Card>
```

5. **Cambiar renderizado de Card de Cupones:**
```typescript
// ANTES:
<Card>
  <CardHeader>
    <CardTitle>Historial de Cupones</CardTitle>
    <CardDescription>
      Lista de todos los cupones que ha ganado este usuario.
    </CardDescription>
  </CardHeader>
  <CardContent>
    {couponsError ? (
      <p className="text-red-500">Error al cargar el historial de cupones.</p>
    ) : (
      <CouponHistoryTable coupons={coupons || []} userId={id} />
    )}
  </CardContent>
</Card>

// DESPUÉS:
<Card>
  <CardHeader>
    <CardTitle>Historial de Cupones</CardTitle>
    <CardDescription>
      Lista de todos los cupones que ha ganado este usuario.
    </CardDescription>
  </CardHeader>
  <CardContent>
    {couponsError ? (
      <p className="text-red-500">Error al cargar el historial de cupones.</p>
    ) : (
      <CouponHistoryClient
        userId={id}
        initialCoupons={couponsResult.coupons}
        initialTotal={couponsResult.total}
      />
    )}
  </CardContent>
</Card>
```

---

## 📊 Resumen de Cambios

### Archivos Nuevos (5)

| Archivo | Propósito | Líneas (aprox) |
|---------|-----------|----------------|
| `src/hooks/use-pagination.ts` | Hook genérico de paginación | ~60 |
| `src/components/shared/Pagination.tsx` | Componente UI genérico | ~120 |
| `src/components/admin/CheckinHistoryClient.tsx` | Wrapper client de check-ins | ~60 |
| `src/components/admin/CouponHistoryClient.tsx` | Wrapper client de cupones | ~60 |
| Server actions en `actions.ts` | 2 funciones paginadas | ~150 |

**Total:** ~450 líneas de código nuevo

### Archivos Modificados (1)

| Archivo | Cambios | Líneas afectadas |
|---------|---------|------------------|
| `src/app/admin/users/[id]/page.tsx` | Imports + Promise.all + renderizado Cards | ~20 |

### Archivos Sin Cambios (2)

| Archivo | Motivo |
|---------|--------|
| `CheckinHistoryTable.tsx` | ✅ Solo recibe y renderiza datos (sin cambios) |
| `CouponHistoryTable.tsx` | ✅ Solo recibe y renderiza datos (sin cambios) |

---

## 🧪 Testing

### Plan de Pruebas

#### 1. Testing con Datos de Prueba

**Preparación:**
```sql
-- Crear usuario con muchos registros para testing
INSERT INTO check_ins (user_id, branch_id, verified_by, created_at)
SELECT 
  'test-user-id',
  (SELECT id FROM branches LIMIT 1),
  (SELECT id FROM user_profiles WHERE role = 'verifier' LIMIT 1),
  NOW() - (interval '1 day' * generate_series(1, 100))
FROM generate_series(1, 100);

INSERT INTO coupons (user_id, prize_id, created_at)
SELECT 
  'test-user-id',
  (SELECT id FROM prizes LIMIT 1),
  NOW() - (interval '1 day' * generate_series(1, 50))
FROM generate_series(1, 50);
```

#### 2. Test Cases por Funcionalidad

**Historial de Visitas:**

| Test Case | Acción | Resultado Esperado |
|-----------|--------|-------------------|
| **Carga inicial** | Abrir detalle de usuario | Ver 20 check-ins + paginación |
| **Cambio de página** | Click en "Página 2" | Ver siguientes 20 check-ins |
| **Cambio de tamaño** | Seleccionar "50 por página" | Ver 50 check-ins, página 1 |
| **Primera página** | Click en ⏮ | Ir a página 1 |
| **Última página** | Click en ⏭ | Ir a última página |
| **Loading state** | Durante fetch | Ver spinner + mensaje "Cargando visitas..." |
| **Sin datos** | Usuario sin check-ins | Ver mensaje "No hay visitas registradas" |

**Historial de Cupones:**

| Test Case | Acción | Resultado Esperado |
|-----------|--------|-------------------|
| **Carga inicial** | Abrir detalle de usuario | Ver 20 cupones + paginación |
| **Cambio de página** | Click en "Página 2" | Ver siguientes 20 cupones |
| **Cambio de tamaño** | Seleccionar "50 por página" | Ver 50 cupones, página 1 |
| **Primera página** | Click en ⏮ | Ir a página 1 |
| **Última página** | Click en ⏭ | Ir a última página |
| **Loading state** | Durante fetch | Ver spinner + mensaje "Cargando cupones..." |
| **Eliminar cupón** | Click en 🗑️ en página 2 | Eliminar y mantener página 2 |
| **Sin datos** | Usuario sin cupones | Ver mensaje "No hay cupones" |

#### 3. Testing de Performance

**Métricas a validar:**

| Métrica | Antes | Objetivo | Cómo Medir |
|---------|-------|----------|------------|
| **Tiempo de carga** | ~800ms (500 checkins) | <100ms (20 checkins) | Chrome DevTools Network |
| **Memoria usada** | ~5MB | <500KB | Chrome DevTools Memory |
| **HTML generado** | ~50KB | ~2KB | View Page Source |
| **Queries DB** | 2 (todas) | 4 (con count) | Supabase Logs |

#### 4. Testing de Regresión

**Verificar que NO se rompió:**

- [ ] Editar perfil de usuario funciona
- [ ] Otorgar spins funciona
- [ ] Otorgar cupón manual funciona
- [ ] Eliminar usuario funciona
- [ ] Eliminar cupón funciona (en cualquier página)
- [ ] Iconos y formato de fechas se mantienen
- [ ] Estados de cupones (Activo, Canjeado, Caducado) funcionan
- [ ] Verificador mostrado en check-ins
- [ ] Sucursal mostrada en check-ins
- [ ] Premio mostrado en cupones

#### 5. Testing de Edge Cases

| Caso | Escenario | Resultado Esperado |
|------|-----------|-------------------|
| **Exactamente 20 items** | Usuario con 20 check-ins | Ver 1 página, sin flechas next |
| **21 items** | Usuario con 21 check-ins | Ver 2 páginas, 20 + 1 |
| **0 items** | Usuario nuevo sin datos | Mensaje de vacío, sin paginación |
| **Error de red** | Desconectar durante fetch | Mantener datos anteriores + error |
| **Paginación y eliminación** | Eliminar último item de página | Auto-ir a página anterior |

---

## ⏱️ Estimación de Tiempo

| Fase | Tarea | Tiempo Estimado |
|------|-------|-----------------|
| **Fase 1** | Crear `use-pagination.ts` | 15 min |
| **Fase 1** | Crear `Pagination.tsx` | 15 min |
| **Fase 2** | Agregar `getCheckinsPaginated()` | 15 min |
| **Fase 2** | Agregar `getCouponsPaginated()` | 15 min |
| **Fase 3** | Crear `CheckinHistoryClient.tsx` | 20 min |
| **Fase 3** | Crear `CouponHistoryClient.tsx` | 20 min |
| **Fase 4** | Modificar `page.tsx` | 20 min |
| **Testing** | Pruebas funcionales | 20 min |
| **Testing** | Pruebas de performance | 10 min |
| **Testing** | Pruebas de regresión | 10 min |
| **Total** | | **~2.5 horas** |

---

## 🎯 Beneficios Esperados

### Performance

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Tiempo de carga** | 800ms | <100ms | **8x más rápido** |
| **Memoria cliente** | 5MB | <500KB | **10x menos memoria** |
| **HTML generado** | 50KB | <2KB | **25x más liviano** |
| **Queries DB** | 2 full scans | 2 ranged + 2 counts | **Más eficiente** |

### User Experience

- ✅ Navegación clara y rápida entre páginas
- ✅ No más scroll infinito buscando datos
- ✅ Feedback visual inmediato (loading states)
- ✅ Control del usuario sobre items por página
- ✅ Consistencia con otras páginas del admin

### Escalabilidad

- ✅ Soporta usuarios con miles de registros
- ✅ No degrada performance con volumen
- ✅ Preparado para agregar filtros futuros
- ✅ Exportación CSV más eficiente (futuro)

### Mantenibilidad

- ✅ Código reutilizable (hook + componente genérico)
- ✅ Patrón consistente en toda la app
- ✅ Fácil agregar paginación a otras tablas
- ✅ TypeScript garantiza type safety

---

## 🚀 Orden de Implementación

### Secuencia Recomendada

1. ✅ **Fase 1.1:** Crear `use-pagination.ts` (15 min)
2. ✅ **Fase 1.2:** Crear `Pagination.tsx` (15 min)
3. ✅ **Fase 2.1:** Agregar `getCheckinsPaginated()` (15 min)
4. ⏸️ **Testing Parcial:** Verificar server action funciona (5 min)
5. ✅ **Fase 3.1:** Crear `CheckinHistoryClient.tsx` (20 min)
6. ✅ **Fase 4.1:** Actualizar `page.tsx` para check-ins (10 min)
7. ⏸️ **Testing Check-ins:** Probar historial de visitas completo (10 min)
8. ✅ **Fase 2.2:** Agregar `getCouponsPaginated()` (15 min)
9. ✅ **Fase 3.2:** Crear `CouponHistoryClient.tsx` (20 min)
10. ✅ **Fase 4.2:** Actualizar `page.tsx` para cupones (10 min)
11. ⏸️ **Testing Cupones:** Probar historial de cupones completo (10 min)
12. ✅ **Testing Final:** Regresión + Performance + Edge cases (20 min)
13. ✅ **Commit y Push:** Guardar cambios (5 min)

**Total:** ~2.5 horas

### Strategy: Implementar por Tabla

**Ventaja:** Verificar cada tabla independientemente antes de pasar a la siguiente.

```
Check-ins Completo → Testing → Cupones Completo → Testing Final
```

---

## 📚 Referencias

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase Pagination](https://supabase.com/docs/guides/api/pagination)
- [React Hooks Best Practices](https://react.dev/reference/react/hooks)
- Código de referencia: `/admin/users` (UsersListClient.tsx)

---

## 📝 Notas Adicionales

### Consideraciones de Diseño

- **Ubicación de paginación:** Al final de cada tabla (no al inicio)
- **Tamaño por defecto:** 20 items (balance performance/UX)
- **Opciones disponibles:** 10, 20, 50, 100
- **Loading state:** Spinner centrado con mensaje descriptivo
- **Responsive:** Paginación se adapta a móvil y desktop

### Futuras Mejoras

Después de esta implementación, se podrá agregar fácilmente:

- [ ] **Filtros:** Por fecha, sucursal, estado
- [ ] **Búsqueda:** Por texto en descripción
- [ ] **Ordenamiento:** Por columna (fecha, sucursal, etc.)
- [ ] **Exportación:** CSV/Excel de datos paginados
- [ ] **Gráficas:** Estadísticas por período

### Compatibilidad

- ✅ Compatible con sistema de eliminación de cupones existente
- ✅ Compatible con sistema de otorgar cupones/spins
- ✅ No interfiere con edición de perfil
- ✅ No interfiere con eliminación de usuario

---

**Preparado por:** AI Copilot  
**Fecha:** 6 de octubre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Listo para implementar

---

## 🎬 ¡Manos a la Obra!

Este plan está listo para seguirse paso a paso. Cada fase es independiente y se puede testear antes de continuar. La implementación es segura, no requiere cambios en base de datos, y mejorará significativamente la experiencia de usuario.

**Próximo paso:** Fase 1.1 - Crear `use-pagination.ts` 🚀
