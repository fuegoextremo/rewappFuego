'use client'

import { usePagination } from '@/hooks/use-pagination'
import { Pagination } from '@/components/shared/Pagination'
import ScanHistoryTable from './ScanHistoryTable'
import { getScanHistoryPaginated, type ScanActivity } from '@/app/admin/scanner/queries'

interface ScanHistoryClientProps {
  initialData: ScanActivity[]
  initialTotal: number
}

export function ScanHistoryClient({ initialData, initialTotal }: ScanHistoryClientProps) {
  const {
    data: activities,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination<ScanActivity>({
    initialData,
    initialTotal,
    initialPage: 1,
    initialPageSize: 20,
    fetchFn: async (page, pageSize) => {
      return await getScanHistoryPaginated(page, pageSize)
    },
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Cargando...</span>
            </div>
          </div>
        )}
        <ScanHistoryTable activities={activities} />
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        itemName="registros"
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
      />
    </div>
  )
}
