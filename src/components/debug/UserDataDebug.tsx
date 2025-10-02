'use client'

import { useCurrentStreak, useLastCheckIn, useMaxStreak, useAvailableSpins, useTotalCheckIns, useAppSelector } from '@/store/hooks'

export default function UserDataDebug() {
  const currentStreak = useCurrentStreak()
  const lastCheckIn = useLastCheckIn()
  const maxStreak = useMaxStreak()
  const availableSpins = useAvailableSpins()
  const totalCheckIns = useTotalCheckIns()
  const userDataState = useAppSelector(state => state.userData)

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 space-y-2">
      <h3 className="font-bold text-lg">UserData Debug</h3>
      <div className="text-sm space-y-1">
        <div>Current Streak: {currentStreak || 'null'}</div>
        <div>Max Streak: {maxStreak || 'null'}</div>
        <div>Last Check-in: {lastCheckIn || 'null'}</div>
        <div>Available Spins: {availableSpins || 'null'}</div>
        <div>Total Check-ins: {totalCheckIns || 'null'}</div>
        <div>UserData Loading: {userDataState?.userStatsLoading ? 'Yes' : 'No'}</div>
        <div>UserData Error: {userDataState?.userStatsError || 'None'}</div>
        <div>Data Available: {userDataState?.userStats ? 'Yes' : 'No'}</div>
      </div>
    </div>
  )
}