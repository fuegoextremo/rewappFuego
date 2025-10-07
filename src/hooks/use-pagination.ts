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
