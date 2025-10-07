"use client"

import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/shared/Pagination"
import CouponHistoryTable from "./CouponHistoryTable"
import {
  getCouponsPaginated,
  type CouponWithDetails,
} from "@/app/admin/users/[id]/actions"

interface CouponHistoryClientProps {
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
    initialPage: 1,
    initialPageSize: 20,
    fetchFn: async (page, pageSize) => {
      const result = await getCouponsPaginated(userId, page, pageSize)
      return {
        data: result.data,
        total: result.total,
      }
    },
  })

  return (
    <div className="space-y-4">
      {/* Tabla de cupones */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Cargando...</span>
            </div>
          </div>
        )}
        <CouponHistoryTable coupons={coupons} userId={userId} />
      </div>

      {/* Controles de paginación */}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        itemName="cupones"
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
      />
    </div>
  )
}
