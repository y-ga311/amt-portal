"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import bcrypt from "bcryptjs"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("ログイン試行:", { username, password })

      // admin_usersテーブルからユーザーを検索
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("username", username)
        .maybeSingle()

      console.log("ユーザー検索結果:", {
        adminData: adminData ? {
          ...adminData,
          password: "***" // パスワードは表示しない
        } : null,
        adminError
      })

      if (adminError) {
        console.error("管理者検索エラー:", adminError)
        throw new Error("認証に失敗しました")
      }

      if (!adminData) {
        console.log("ユーザーが見つかりません:", username)
        setError("ユーザー名またはパスワードが正しくありません")
        return
      }

      // パスワード検証
      console.log("パスワード検証開始:", {
        username,
        storedHash: adminData.password
      })

      // bcryptjsを使用してパスワードを検証
      const isPasswordValid = await bcrypt.compare(password, adminData.password)

      console.log("パスワード検証結果:", {
        isPasswordValid,
        storedHash: adminData.password
      })

      if (!isPasswordValid) {
        console.log("パスワードが一致しません")
        setError("ユーザー名またはパスワードが正しくありません")
        return
      }

      // 管理者情報を取得
      const { data: adminInfo, error: adminInfoError } = await supabase
        .from("admins")
        .select("*")
        .eq("admin_user_id", adminData.id)
        .maybeSingle()

      console.log("管理者情報取得結果:", {
        adminInfo,
        adminInfoError
      })

      if (adminInfoError) {
        console.error("管理者情報取得エラー:", adminInfoError)
      }

      // 認証成功時の処理
      localStorage.setItem("adminLoggedIn", "true")
      localStorage.setItem("adminId", adminData.id)
      localStorage.setItem("adminName", adminInfo?.name || "管理者")
      localStorage.setItem("adminRole", adminInfo?.role || "super_admin")

      console.log("ログイン成功:", {
        adminId: adminData.id,
        adminName: adminInfo?.name || "管理者",
        adminRole: adminInfo?.role || "super_admin"
      })

      toast({
        title: "ログイン成功",
        description: "管理者ダッシュボードにリダイレクトします",
      })

      router.push("/admin/dashboard")
    } catch (err) {
      console.error("ログインエラー:", err)
      setError("ログインに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle="管理者ログイン" />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <Image
                src="/images/character-icon-new.png"
                alt="キャラクターアイコン"
                width={100}
                height={100}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-brown-800 dark:text-brown-100">AMTつながるポータル</h1>
          </div>

          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <CardTitle className="text-brown-800 dark:text-brown-100">管理者ログイン</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                管理者機能にアクセスするにはログインしてください
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-6 bg-white dark:bg-brown-900">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-brown-700 dark:text-brown-200">
                    ユーザー名
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="border-brown-300 dark:border-brown-700 focus:ring-brown-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-brown-700 dark:text-brown-200">
                    パスワード
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-brown-300 dark:border-brown-700 focus:ring-brown-500"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 bg-white dark:bg-brown-900 rounded-b-lg">
                <Button
                  type="submit"
                  className="w-full bg-brown-600 hover:bg-brown-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ログイン中...
                    </>
                  ) : (
                    "ログイン"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
} 