"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, Users, BarChart2, Bell, LogOut } from "lucide-react"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [adminName, setAdminName] = useState("")
  const [adminRole, setAdminRole] = useState("")

  useEffect(() => {
    // 管理者情報を取得
    const adminLoggedIn = localStorage.getItem("adminLoggedIn")
    const adminId = localStorage.getItem("adminId")
    const name = localStorage.getItem("adminName")
    const role = localStorage.getItem("adminRole")

    if (!adminLoggedIn || !adminId) {
      router.push("/admin/login")
      return
    }

    setAdminName(name || "管理者")
    setAdminRole(role || "super_admin")
  }, [router])

  const handleLogout = () => {
    // 管理者情報をクリア
    localStorage.removeItem("adminLoggedIn")
    localStorage.removeItem("adminId")
    localStorage.removeItem("adminName")
    localStorage.removeItem("adminRole")

    toast({
      title: "ログアウトしました",
      description: "ログイン画面にリダイレクトします",
    })

    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle="管理者ダッシュボード" />
      <div className="flex-1 container mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brown-800 dark:text-brown-100 mb-2">
            管理者ダッシュボード
          </h1>
          <p className="text-lg text-brown-600 dark:text-brown-300">
            {adminName}さん、ようこそ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* テスト管理 */}
          <Card className="border-brown-200 dark:border-brown-800 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-brown-600 dark:text-brown-300" />
                <CardTitle className="text-xl text-brown-800 dark:text-brown-100">試験問題数管理</CardTitle>
              </div>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                試験問題数の編集を行います
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button
                className="w-full bg-brown-600 hover:bg-brown-700 text-white h-12 text-lg"
                onClick={() => router.push("/admin/tests")}
              >
                試験問題数画面へ
              </Button>
            </CardContent>
          </Card>

          {/* 学生管理 */}
          <Card className="border-brown-200 dark:border-brown-800 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-brown-600 dark:text-brown-300" />
                <CardTitle className="text-xl text-brown-800 dark:text-brown-100">学生管理</CardTitle>
              </div>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                学生の登録、編集、削除を行います
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button
                className="w-full bg-brown-600 hover:bg-brown-700 text-white h-12 text-lg"
                onClick={() => router.push("/admin/students")}
              >
                学生管理画面へ
              </Button>
            </CardContent>
          </Card>

          {/* 結果管理 */}
          <Card className="border-brown-200 dark:border-brown-800 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <BarChart2 className="h-6 w-6 text-brown-600 dark:text-brown-300" />
                <CardTitle className="text-xl text-brown-800 dark:text-brown-100">結果管理</CardTitle>
              </div>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                テスト結果の確認、分析を行います
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button
                className="w-full bg-brown-600 hover:bg-brown-700 text-white h-12 text-lg"
                onClick={() => router.push("/admin/results")}
              >
                結果管理画面へ
              </Button>
            </CardContent>
          </Card>

          {/* お知らせ管理 */}
          <Card className="border-brown-200 dark:border-brown-800 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Bell className="h-6 w-6 text-brown-600 dark:text-brown-300" />
                <CardTitle className="text-xl text-brown-800 dark:text-brown-100">お知らせ管理</CardTitle>
              </div>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                お知らせの作成、編集、削除を行います
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button
                className="w-full bg-brown-600 hover:bg-brown-700 text-white h-12 text-lg"
                onClick={() => router.push("/admin/notices")}
              >
                お知らせ管理画面へ
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ログアウトボタン */}
        <div className="mt-8 flex justify-end">
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900 h-12 px-6"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            ログアウト
          </Button>
        </div>
      </div>
    </div>
  )
} 