"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, CheckCircle, InfoIcon, AlertTriangle, User, Users } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import { authenticateStudent } from "@/app/actions/auth"
import { checkDatabaseConnection } from "@/app/actions/database"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { CharacterIcon } from "@/components/character-icon"
import Link from "next/link"
import { createClient } from '@supabase/supabase-js'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabaseの環境変数が設定されていません')
}

const supabase = createClient(supabaseUrl, supabaseKey)

function LoginContent() {
  const [studentId, setStudentId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{ message: string; details?: string }>({ message: "" })
  const [dbStatus, setDbStatus] = useState<{ checked: boolean; connected: boolean; students: number; error?: string }>({
    checked: false,
    connected: false,
    students: 0,
  })
  const [envStatus, setEnvStatus] = useState<{
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  }>({
    NEXT_PUBLIC_SUPABASE_URL: "確認中...",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "確認中...",
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const userType = searchParams.get('type') || 'parent'
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [loginType, setLoginType] = useState<'student' | 'parent'>('student')

  // 環境変数の確認
  useEffect(() => {
    setEnvStatus({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "設定済み" : "未設定",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "設定済み" : "未設定",
    })
  }, [])

  // ページロード時にデータベース接続を確認
  useEffect(() => {
    let isMounted = true

    async function checkDatabase() {
      if (!isMounted) return

      try {
        // 環境変数が設定されていない場合は早期リターン
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          setDbStatus({
            checked: true,
            connected: false,
            students: 0,
            error: "環境変数が設定されていません",
          })
          return
        }

        // サーバーサイドアクションを使用してデータベース接続を確認
        const result = await checkDatabaseConnection()

        if (!isMounted) return

        if (result.success) {
          setDbStatus({
            checked: true,
            connected: true,
            students: result.studentCount || 0,
          })
        } else {
          setDbStatus({
            checked: true,
            connected: false,
            students: 0,
            error: result.error || "データベース接続に失敗しました",
          })
        }
      } catch (err) {
        if (!isMounted) return

        setDbStatus({
          checked: true,
          connected: false,
          students: 0,
          error: err instanceof Error ? err.message : "不明なエラー",
        })
      }
    }

    checkDatabase()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'parent' || type === 'student') {
      setLoginType(type)
    }
  }, [searchParams])

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('gakusei_id', studentId)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        toast({
          title: "エラー",
          description: "学生IDが見つかりません。",
          variant: "destructive",
        })
        return
      }

      if (data.gakusei_password !== password) {
        toast({
          title: "エラー",
          description: "パスワードが正しくありません。",
          variant: "destructive",
        })
        return
      }

      // セッションストレージにユーザー情報を保存
      const userInfo = {
        id: data.id,
        name: data.name,
        class: data.class || '',
        type: 'student'
      }
      sessionStorage.setItem('user', JSON.stringify(userInfo))

      // リダイレクト前に少し待機
      await new Promise(resolve => setTimeout(resolve, 100))

      // リダイレクト
      router.push('/dashboard')
    } catch (error) {
      console.error('ログインエラー:', error)
      toast({
        title: "エラー",
        description: "ログイン処理中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 保護者IDで学生情報を検索
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('hogosya_id', studentId)
        .single()

      if (studentError) {
        throw studentError
      }

      if (!studentData) {
        toast({
          title: "エラー",
          description: "保護者IDが見つかりません。",
          variant: "destructive",
        })
        return
      }

      if (studentData.hogosya_pass !== password) {
        toast({
          title: "エラー",
          description: "パスワードが正しくありません。",
          variant: "destructive",
        })
        return
      }

      // セッションストレージにユーザー情報を保存
      const userInfo = {
        id: studentData.id,
        name: studentData.name,
        class: studentData.class || '',
        type: 'parent',
        studentId: studentData.id,
        studentName: studentData.name,
        studentClass: studentData.class || ''
      }
      sessionStorage.setItem('user', JSON.stringify(userInfo))

      // リダイレクト前に少し待機
      await new Promise(resolve => setTimeout(resolve, 100))

      // リダイレクト
      router.push('/dashboard')
    } catch (error) {
      console.error('ログインエラー:', error)
      toast({
        title: "エラー",
        description: "ログイン処理中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle={userType === 'student' ? "学生ログイン" : "保護者ログイン"} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <Image
                src="/images/character-icon-new.png"
                alt="キャラクターアイコン"
                width={40}
                height={40}
                className="object-contain w-10 h-10"
                style={{ width: '40px', height: '40px' }}
              />
            </div>
            <h1 className="text-2xl font-bold text-brown-800 dark:text-brown-100">AMTつながるポータル</h1>
          </div>

          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-white dark:bg-brown-900 rounded-t-lg">
              <CardTitle className="text-center text-2xl font-bold text-brown-900 dark:text-white">
                {userType === 'student' ? '学生ログイン' : '保護者ログイン'}
              </CardTitle>
            </CardHeader>
            <form onSubmit={loginType === 'student' ? handleStudentLogin : handleParentLogin} className="space-y-4">
              <CardContent className="pt-6 bg-white dark:bg-brown-900">
                {/* データベース接続ステータス */}
                {dbStatus.checked && (
                  <Alert variant={dbStatus.connected ? "default" : "destructive"} className="mb-4">
                    <AlertTitle>
                      {dbStatus.connected ? "データベース接続成功" : "データベース接続エラー"}
                    </AlertTitle>
                    <AlertDescription>
                      {dbStatus.connected
                        ? "データベースに正常に接続できました。"
                        : "データベースへの接続に失敗しました。管理者にお問い合わせください。"}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="ログインID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="border-brown-300 dark:border-brown-700 focus:ring-brown-500"
                    autoComplete="username"
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="パスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-brown-300 dark:border-brown-700 focus:ring-brown-500"
                    autoComplete="current-password"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 bg-white dark:bg-brown-900 rounded-b-lg">
                <Button 
                  type="submit" 
                  className="w-full bg-brown-600 hover:bg-brown-700"
                  onClick={loginType === 'student' ? handleStudentLogin : handleParentLogin}
                >
                  ログイン
                </Button>
                <div className="text-center text-sm text-brown-600 dark:text-brown-400">
                  {loginType === 'student' ? (
                    <Link href="/login?type=parent" className="hover:underline">
                      保護者の方はこちら
                    </Link>
                  ) : (
                    <Link href="/login?type=student" className="hover:underline">
                      学生の方はこちら
                    </Link>
                  )}
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
