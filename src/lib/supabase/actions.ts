import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export const createActionClient = () => {
  return createServerActionClient<Database>({
    cookies,
  })
}
