"use client"

import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/shared/Pagination"
import CheckinHistoryTable from "./CheckinHistoryTable"
import {
  getCheckinsPaginated,
  type CheckInWithDetails,
} from "@/app/admin/users/[id]/actions"

interface CheckinHistoryClientProps {
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
    initialPage: 1,
    initialPageSize: 20,
    fetchFn: async (page, pageSize) => {
      const result = await getCheckinsPaginated(userId, page, pageSize)
      return {
        data: result.data,
        total: result.total,
      }
    },
  })

  const handleCheckinDeleted = () => {
    // Refrescar la página actual para actualizar la lista
    handlePageChange(page);
  };

  return (
    <div className="space-y-4">
      {/* Tabla de check-ins */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Cargando...</span>
            </div>
          </div>
        )}
        <CheckinHistoryTable 
          checkins={checkins} 
          userId={userId}
          onCheckinDeleted={handleCheckinDeleted}
        />
      </div>

      {/* Controles de paginación */}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        itemName="visitas"
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
      />
    </div>
  )
}
