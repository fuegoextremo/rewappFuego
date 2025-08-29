'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function useInstantNavigation() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = (href: string) => {
    startTransition(() => {
      router.push(href)
    })
  }

  const prefetch = (href: string) => {
    router.prefetch(href)
  }

  return {
    navigate,
    prefetch,
    isPending
  }
}
