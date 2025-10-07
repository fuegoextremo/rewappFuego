"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
  itemName?: string // e.g., "usuarios", "visitas", "cupones"
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  isLoading?: boolean
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  itemName = "items",
  onPageChange,
  onPageSizeChange,
  isLoading = false
}: PaginationProps) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const canGoPrevious = page > 1
  const canGoNext = page < totalPages

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
      {/* Info de resultados */}
      <div className="text-sm text-muted-foreground">
        {total > 0 ? (
          <>
            Mostrando <span className="font-medium">{start}</span> a{" "}
            <span className="font-medium">{end}</span> de{" "}
            <span className="font-medium">{total}</span> {itemName}
          </>
        ) : (
          `No hay ${itemName} para mostrar`
        )}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Selector de tamaño de página */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Mostrar:
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={isLoading || total === 0}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-border" />

        {/* Botones de navegación */}
        <div className="flex items-center gap-1">
          {/* Primera página */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious || isLoading}
            title="Primera página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Página anterior */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious || isLoading}
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Indicador de página actual */}
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-medium">{page}</span>
            <span className="text-sm text-muted-foreground">de</span>
            <span className="text-sm font-medium">{totalPages || 1}</span>
          </div>

          {/* Página siguiente */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext || isLoading}
            title="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Última página */}
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
