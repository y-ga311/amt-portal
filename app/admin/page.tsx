"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { NoticeForm } from '@/components/notice-form'
import { NoticeList } from '@/components/notice-list'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import crypto from 'crypto'
import Image from 'next/image'
import { Notice } from "@/types/notice"

// ハッシュ化の設定
const FIXED_SALT = 'toyoiryo_admin_salt_2024'  // 固定のソルト

// パスワードのハッシュ化関数
const hashPassword = (password: string): string => {
  const combinedString = password + FIXED_SALT
  const hash = crypto
    .createHash('sha256')
    .update(combinedString)
    .digest('hex')
  
  console.log('ハッシュ化の詳細:', {
    password,
    salt: FIXED_SALT,
    combinedString,
    hash
  })
  
  return hash
}

// パスワードの検証関数
const verifyPassword = (password: string, hash: string): boolean => {
  const hashedPassword = hashPassword(password)
  const isValid = hashedPassword === hash
  
  console.log('パスワード検証の詳細:', {
    inputPassword: password,
    storedHash: hash,
    calculatedHash: hashedPassword,
    isValid
  })
  
  return isValid
}

export default function AdminPage() {
  const router = useRouter()
  const { isAuthenticated, checkAuth, isLoading } = useAdminAuth()
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoadingNotices, setIsLoadingNotices] = useState(false)
  const [error, setError] = useState('')
  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotices()
    }
  }, [isAuthenticated])

  const fetchNotices = async () => {
    setIsLoadingNotices(true)
    try {
      const { data, error } = await supabase
        .from('notice')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotices((data as Notice[]) || [])
    } catch (err) {
      console.error('お知らせの取得エラー:', err)
      setError('お知らせの取得に失敗しました')
    } finally {
      setIsLoadingNotices(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoggingIn(true)

    try {
      console.log('ログイン試行:', { adminId, password })

      // テーブルの構造を確認
      const { data: tableInfo, error: tableInfoError } = await supabase
        .from('admin_users')
        .select('*')
        .limit(1)

      console.log('テーブル構造確認:', {
        tableInfo,
        tableInfoError
      })

      // テーブル名を確認
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', adminId)
        .maybeSingle()

      // デバッグ用：テーブル内の全ユーザーを取得
      const { data: allUsers, error: allUsersError } = await supabase
        .from('admin_users')
        .select('username, password')
        .limit(10)

      console.log('admin_usersテーブル内のユーザー:', allUsers?.map(user => ({
        ...user,
        password: '***' // パスワードは表示しない
      })))
      console.log('admin_usersテーブル検索結果:', { 
        adminData: adminData ? {
          ...adminData,
          password: '***' // パスワードは表示しない
        } : null,
        adminError,
        query: {
          table: 'admin_users',
          username: adminId
        },
        allUsersError,
        // エラーの詳細を表示
        errorDetails: {
          adminError: adminError ? {
            message: adminError.message,
            details: adminError.details,
            hint: adminError.hint,
            code: adminError.code
          } : null,
          allUsersError: allUsersError ? {
            message: allUsersError.message,
            details: allUsersError.details,
            hint: allUsersError.hint,
            code: allUsersError.code
          } : null
        }
      })

      if (adminError) {
        console.error('データベースエラー:', adminError)
        throw new Error('認証処理中にエラーが発生しました。')
      }

      if (!adminData) {
        console.log('ユーザーが見つかりません:', adminId)
        throw new Error('IDまたはパスワードが正しくありません。')
      }

      // パスワードを照合
      console.log('パスワード照合開始:', {
        inputPassword: password,
        storedPasswordHash: adminData.password
      })

      const isPasswordValid = verifyPassword(password, adminData.password)
      console.log('パスワード照合結果:', { isPasswordValid })

      if (!isPasswordValid) {
        console.log('パスワードが一致しません')
        throw new Error('IDまたはパスワードが正しくありません。')
      }

      // 認証成功後、Supabaseのセッションを作成
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: `${adminId}@toyoiryo.ac.jp`,
        password: password,
      })

      console.log('Supabase認証結果:', { 
        authData: authData ? {
          ...authData,
          session: authData.session ? '***' : null
        } : null,
        signInError 
      })

      if (signInError) {
        console.error('認証エラー:', signInError)
        throw new Error('セッションの作成に失敗しました。')
      }

      await checkAuth()
      router.push('/admin')
    } catch (err) {
      console.error('ログインエラー:', err)
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。IDとパスワードを確認してください。')
    } finally {
      setIsLoggingIn(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">管理者ログイン</CardTitle>
            <CardDescription className="text-center">
              管理者IDとパスワードを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="adminId">管理者ID</Label>
                <Input
                  id="adminId"
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  required
                  placeholder="管理者IDを入力"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="パスワードを入力"
                  className="w-full"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ログイン中...
                  </>
                ) : (
                  'ログイン'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/')
            }}
          >
            ログアウト
          </Button>
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>お知らせの投稿</CardTitle>
              <CardDescription>
                新しいお知らせを作成します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NoticeForm onNoticeCreated={fetchNotices} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>お知らせ一覧</CardTitle>
              <CardDescription>
                投稿されたお知らせの一覧です
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingNotices ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : (
                <NoticeList notices={notices} onNoticeDeleted={fetchNotices} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
