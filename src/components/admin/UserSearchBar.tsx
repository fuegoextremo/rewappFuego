'use client'

import { useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type SearchFilters = {
  search: string
  role: string
  branch: string
}

type UserSearchBarProps = {
  onSearch: (filters: SearchFilters) => void
  branches?: { id: string; name: string }[]
  isLoading?: boolean
}

export function UserSearchBar({ onSearch, branches = [], isLoading }: UserSearchBarProps) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [branch, setBranch] = useState('all')

  const handleSearch = () => {
    startTransition(() => {
      onSearch({ search, role, branch })
    })
  }

  const handleClear = () => {
    setSearch('')
    setRole('all')
    setBranch('all')
    startTransition(() => {
      onSearch({ search: '', role: 'all', branch: 'all' })
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const loading = isPending || isLoading

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
            disabled={loading}
          />
        </div>

        {/* Role Filter */}
        <Select value={role} onValueChange={setRole} disabled={loading}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="client">Cliente</SelectItem>
            <SelectItem value="verifier">Verificador</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        {/* Branch Filter */}
        {branches.length > 0 && (
          <Select value={branch} onValueChange={setBranch} disabled={loading}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sucursal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={loading}
            title="Limpiar filtros"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(search || role !== 'all' || branch !== 'all') && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted-foreground">Filtros activos:</span>
          {search && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded">
              Búsqueda: &quot;{search}&quot;
            </span>
          )}
          {role !== 'all' && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded">
              Rol: {role}
            </span>
          )}
          {branch !== 'all' && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded">
              Sucursal: {branches.find((b) => b.id === branch)?.name || branch}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
