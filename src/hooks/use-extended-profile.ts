'use client'

import { useQuery } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'

interface ProfileExtendedData {
  birth_date: string | null
  created_at: string | null
}

async function fetchExtendedProfileData(userId: string): Promise<ProfileExtendedData> {
  const supabase = createClientBrowser()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('birth_date, created_at')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('❌ Error fetching extended profile data:', error)
    return { birth_date: null, created_at: null }
  }

  return data
}

export function useExtendedProfileData(userId: string | undefined) {
  return useQuery({
    queryKey: ['user', 'extended', userId],
    queryFn: () => fetchExtendedProfileData(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos - datos que no cambian frecuentemente
  })
}
