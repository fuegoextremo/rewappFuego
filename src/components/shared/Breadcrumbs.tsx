'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export type BreadcrumbItem = {
  label: string
  href?: string
  current?: boolean
}

type Props = {
  items: BreadcrumbItem[]
  showHome?: boolean
}

export default function Breadcrumbs({ items, showHome = true }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-gray-600">
      {showHome && (
        <>
          <Link 
            href="/admin/dashboard" 
            className="flex items-center hover:text-gray-900 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Dashboard</span>
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </>
      )}
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const isCurrent = item.current || isLast
        
        return (
          <div key={index} className="flex items-center">
            {item.href && !isCurrent ? (
              <Link 
                href={item.href}
                className="hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isCurrent ? 'font-medium text-gray-900' : ''}>
                {item.label}
              </span>
            )}
            
            {!isLast && (
              <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
