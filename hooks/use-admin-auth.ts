"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/use-toast'

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      setIsAuthenticated(!!session)
    } catch (err) {
      console.error('認証チェックエラー:', err)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkAuth])

  const login = async (username: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      })
      if (error) throw error
      return true
    } catch (err) {
      console.error('ログインエラー:', err)
      return false
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setIsAuthenticated(false)
    } catch (err) {
      console.error('ログアウトエラー:', err)
    }
  }

  return {
    isAuthenticated,
    isLoading,
    checkAuth,
    login,
    logout
  }
} 