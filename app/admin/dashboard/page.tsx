"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, Users, BarChart2, Bell, LogOut, Activity } from "lucide-react"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [adminName, setAdminName] = useState("")
  const [adminRole, setAdminRole] = useState("")
  const [loginStats, setLoginStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    totalLogins: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

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

    // ログイン統計を取得
    fetchLoginStats()
  }, [router])

  const fetchLoginStats = async () => {
    try {
      setIsLoadingStats(true)
      
      // 全学生数を取得
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // アクティブな学生数（過去30日以内にログイン）を取得
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: activeStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .not('last_login', 'is', null)
        .gte('last_login', thirtyDaysAgo.toISOString())

      // 非アクティブな学生数（30日以上ログインしていない、または未ログイン）
      const { count: inactiveStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .or('last_login.is.null,last_login.lt.' + thirtyDaysAgo.toISOString())

      // 総ログイン回数を取得
      const { data: loginData } = await supabase
        .from('students')
        .select('login_count')

      const totalLogins = loginData?.reduce((sum, student) => sum + (student.login_count || 0), 0) || 0

      setLoginStats({
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        inactiveStudents: inactiveStudents || 0,
        totalLogins
      })
    } catch (error) {
      console.error('ログイン統計取得エラー:', error)
      toast({
        title: "エラー",
        description: "ログイン統計の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

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

        {/* ログイン統計カード */}
        <div className="mb-6">
          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Activity className="h-6 w-6 text-brown-600 dark:text-brown-300" />
                <CardTitle className="text-xl text-brown-800 dark:text-brown-100">ログイン状況</CardTitle>
              </div>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                学生のログイン状況の概要
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingStats ? (
                <div className="text-center py-4">統計を読み込み中...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brown-800 dark:text-brown-100">
                      {loginStats.totalStudents}
                    </div>
                    <div className="text-sm text-brown-600 dark:text-brown-300">総学生数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {loginStats.activeStudents}
                    </div>
                    <div className="text-sm text-brown-600 dark:text-brown-300">アクティブ（30日以内）</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {loginStats.inactiveStudents}
                    </div>
                    <div className="text-sm text-brown-600 dark:text-brown-300">非アクティブ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {loginStats.totalLogins}
                    </div>
                    <div className="text-sm text-brown-600 dark:text-brown-300">総ログイン回数</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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