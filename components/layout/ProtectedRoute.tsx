'use client'
import { useAppSelector } from '@/hooks/useAppDispatch'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { Role } from '@/types'
import { Spinner } from '@/components/ui/Spinner'

interface Props {
  children: React.ReactNode
  allowedRoles?: Role[]
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useAppSelector((s) => s.auth)
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/auth/login')
      else if (allowedRoles && !allowedRoles.includes(user.role)) router.replace('/')
    }
  }, [user, loading, allowedRoles, router])

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Spinner /></div>
  if (!user) return null
  if (allowedRoles && !allowedRoles.includes(user.role)) return null
  return <>{children}</>
}
