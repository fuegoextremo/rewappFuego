'use client'

import { useState, useCallback } from 'react'
import { UserSearchBar, SearchFilters } from './UserSearchBar'
import { UserPagination } from './UserPagination'
import UserTable from './UserTable'
import { getUsersPaginated, UserWithDetails } from '@/app/admin/users/actions'

type UsersListClientProps = {
  initialUsers: UserWithDetails[]
  initialTotal: number
  initialPage: number
  initialPageSize: number
  branches?: { id: string; name: string }[]
}

export function UsersListClient({
  initialUsers,
  initialTotal,
  initialPage,
  initialPageSize,
  branches = [],
}: UsersListClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [totalPages, setTotalPages] = useState(Math.ceil(initialTotal / initialPageSize))
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    role: 'all',
    branch: 'all',
  })

  const fetchUsers = useCallback(async (newPage: number, newPageSize: number, newFilters: SearchFilters) => {
    setIsLoading(true)
    try {
      const result = await getUsersPaginated({
        search: newFilters.search,
        role: newFilters.role === 'all' ? undefined : newFilters.role,
        branch: newFilters.branch === 'all' ? undefined : newFilters.branch,
        page: newPage,
        pageSize: newPageSize,
      })

      setUsers(result.users)
      setTotal(result.total)
      setPage(result.page)
      setPageSize(result.pageSize)
      setTotalPages(result.totalPages)

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSearch = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
    fetchUsers(1, pageSize, newFilters) // Reset to page 1 on new search
  }, [fetchUsers, pageSize])

  const handlePageChange = useCallback((newPage: number) => {
    fetchUsers(newPage, pageSize, filters)
  }, [fetchUsers, pageSize, filters])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    fetchUsers(1, newPageSize, filters) // Reset to page 1 on page size change
  }, [fetchUsers, filters])

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <UserSearchBar
        onSearch={handleSearch}
        branches={branches}
        isLoading={isLoading}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {total > 0 ? (
            <>
              {total} {total === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
            </>
          ) : (
            'No se encontraron usuarios'
          )}
        </h2>
      </div>

      {/* User Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-card rounded-lg border">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
          </div>
        </div>
      ) : users.length > 0 ? (
        <UserTable users={users} />
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border">
          <p className="text-muted-foreground">
            No se encontraron usuarios con los filtros seleccionados.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Intenta ajustar los filtros de búsqueda.
          </p>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <UserPagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
