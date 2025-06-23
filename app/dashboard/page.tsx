"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, User, FileText, BookOpen, Newspaper, Calendar, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"


export default function DashboardPage() {
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [studentClass, setStudentClass] = useState<string>("")
  const [notices, setNotices] = useState<Array<{
    id: number;
    title: string;
    content: string;
    target_type: string;
    target_class: string;
    image_url: string | null;
    pdf_url: string | null;
    file_type: 'image' | 'pdf' | null;
  }>>([])
  const [email, setEmail] = useState("")
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlStudentId = searchParams.get("studentId")
  const urlUserType = searchParams.get("userType")
  const supabase = createClientComponentClient()
  const [userType, setUserType] = useState<'student' | 'parent'>('student')
  const [testScores, setTestScores] = useState<Array<{
    id: number;
    testDate: string;
    subject: string;
    score: number;
    maxScore: number;
    percentage: number;
  }>>([])
  const [newEmail, setNewEmail] = useState("")


  // お知らせを取得する関数
  const fetchNotices = useCallback(async (currentUserType?: string, currentStudentClass?: string) => {
    try {
      const userTypeToUse = currentUserType || userType
      const studentClassToUse = currentStudentClass || studentClass
      
      console.log('お知らせの取得を開始:', { userType: userTypeToUse, studentClass: studentClassToUse })
      const { data, error } = await supabase
        .from('notice')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('お知らせの取得に失敗:', {
          error,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint
        })
        toast({
          title: "エラー",
          description: "お知らせの取得に失敗しました",
          variant: "destructive",
        })
        return
      }

      if (data) {
        console.log('取得したお知らせ:', data)
        // ユーザータイプとクラスに基づいてフィルタリング
        const filteredNotices = data.filter(notice => {
          const typeMatch = notice.target_type === 'all' || notice.target_type === userTypeToUse
          const classMatch = notice.target_class === 'all' || notice.target_class === studentClassToUse
          console.log('お知らせフィルタリング:', {
            noticeId: notice.id,
            typeMatch,
            classMatch,
            targetType: notice.target_type,
            targetClass: notice.target_class,
            userType: userTypeToUse,
            studentClass: studentClassToUse
          })
          return typeMatch && classMatch
        })
        console.log('フィルタリング後のお知らせ:', filteredNotices)
        setNotices(filteredNotices)
      }
    } catch (error) {
      console.error('お知らせの取得中にエラーが発生:', {
        error,
        errorMessage: error instanceof Error ? error.message : '不明なエラー',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast({
        title: "エラー",
        description: "お知らせの取得中に予期せぬエラーが発生しました",
        variant: "destructive",
      })
    }
  }, [supabase, toast])


  // 初期化処理
  const initializeDashboard = async () => {
    try {
      console.log('ダッシュボード初期化開始')
      
      // セッションストレージからユーザー情報を取得
      const userInfoStr = sessionStorage.getItem('user')
      if (!userInfoStr) {
        console.error('セッションストレージからユーザー情報を取得できません')
        router.push('/login')
        return
      }
      
      const userInfo = JSON.parse(userInfoStr)
      console.log('セッションストレージから取得したユーザー情報:', userInfo)

      // ユーザー情報を設定
      setStudentId(userInfo.id.toString())
      setStudentName(userInfo.name)
      setStudentClass(userInfo.class)
      setUserType(userInfo.type)
      setIsLoading(false)
      setIsInitialized(true)
      
      // メールアドレスの取得
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('mail')
        .eq('id', userInfo.id)
        .single()
      
      if (studentError) {
        console.error('メールアドレスの取得に失敗:', studentError)
        toast({
          title: "エラー",
          description: "メールアドレスの取得に失敗しました",
          variant: "destructive",
        })
      } else if (studentData) {
        setEmail(studentData.mail)
      }
      
      // お知らせの取得（初期化完了後に実行）
      await fetchNotices(userInfo.type, userInfo.class)
      
    } catch (error) {
      console.error('ダッシュボード初期化エラー:', error)
      toast({
        title: "エラー",
        description: "ダッシュボードの初期化に失敗しました",
        variant: "destructive",
      })
      router.push('/login')
    }
  }


  // メールアドレスを更新する関数
  const handleEmailUpdate = async () => {
    try {
      if (!newEmail) {
        toast({
          title: "エラー",
          description: "メールアドレスを入力してください",
          variant: "destructive",
        })
        return
      }


      // セッションストレージからユーザー情報を取得
      const userInfoStr = sessionStorage.getItem('user')
      if (!userInfoStr) {
        console.error('セッションストレージからユーザー情報を取得できません')
        toast({
          title: "エラー",
          description: "セッション情報が見つかりません。再度ログインしてください。",
          variant: "destructive",
        })
        return
      }


      const userInfo = JSON.parse(userInfoStr)
      console.log('メールアドレス更新 - ユーザー情報:', userInfo)


      if (!userInfo.id) {
        console.error('ユーザーIDが見つかりません')
        toast({
          title: "エラー",
          description: "ユーザーIDが見つかりません。再度ログインしてください。",
          variant: "destructive",
        })
        return
      }


      // メールアドレスの更新
      const { error: updateError } = await supabase
        .from('students')
        .update({ mail: newEmail })
        .eq('id', userInfo.id)


      if (updateError) {
        console.error('メールアドレス更新エラー:', updateError)
        toast({
          title: "エラー",
          description: "メールアドレスの更新に失敗しました",
          variant: "destructive",
        })
        return
      }


      // 更新成功時の処理
      setEmail(newEmail)
      setNewEmail("")
      setIsEmailModalOpen(false)
      
      // 成功時のトースト通知
      toast({
        title: "更新完了",
        description: "メールアドレスを更新しました",
        variant: "default",
      })
    } catch (error) {
      console.error('メールアドレス更新中にエラーが発生:', error)
      toast({
        title: "エラー",
        description: "メールアドレスの更新中に予期せぬエラーが発生しました",
        variant: "destructive",
      })
    }
  }


  useEffect(() => {
    initializeDashboard()
  }, [router])


  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem("studentId")
      localStorage.removeItem("studentName")
      localStorage.removeItem("userType")
      router.push("/")
    } catch (error) {
      console.error("ログアウトエラー:", error)
      toast({
        title: "ログアウトエラー",
        description: "ログアウト中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <CharacterIcon size={40} animated={true} className="mx-auto mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle={`${studentName}${userType === 'parent' ? ' 保護者様' : ''}`} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* お知らせカード */}
          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CharacterIcon size={40} />
                  <CardTitle className="text-brown-800 dark:text-brown-100 text-lg sm:text-xl">
                    お知らせ
                  </CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </Button>
              </div>
            </CardHeader>
            <CardContent className="bg-white dark:bg-brown-900 rounded-b-lg">
              <div className="space-y-4">
                {notices.length > 0 ? (
                  notices.map((notice) => (
                    <div key={notice.id} className="border-b border-brown-200 dark:border-brown-800 pb-4">
                      <h3 className="font-medium text-brown-800 dark:text-brown-100">{notice.title}</h3>
                      <p className="text-sm text-brown-600 dark:text-brown-300 mt-1 whitespace-pre-line">
                        {notice.content}
                      </p>
                      {notice.image_url && (
                        <div className="mt-4">
                          <img
                            src={notice.image_url}
                            alt="添付画像"
                            className="max-w-full h-auto rounded-lg"
                          />
                        </div>
                      )}
                      {notice.pdf_url && (
                        <div className="mt-4">
                          <a
                            href={notice.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            PDFファイルを開く
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-brown-600 dark:text-brown-300">お知らせはありません</p>
                )}
              </div>
            </CardContent>
          </Card>


          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <div className="flex items-center gap-3">
                <CharacterIcon size={40} />
                <div>
                  <CardTitle className="text-brown-800 dark:text-brown-100 text-lg sm:text-xl">
                    {studentName}{userType === 'parent' ? ' 保護者様' : ''}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-white dark:bg-brown-900 rounded-b-lg p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card className="border-brown-200 dark:border-brown-800">
                  <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg pb-2">
                    <CardTitle className="text-lg text-brown-800 dark:text-brown-100">出欠・学期成績</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-brown-900 pt-4">
                    <p className="text-sm text-brown-600 dark:text-brown-300 mb-4">
                      出欠状況と学期ごとの各科目の成績が確認できます。
                    </p>
                    <Button asChild className="w-full bg-brown-600 hover:bg-brown-700 text-white">
                      <a 
                        href={userType === 'student' 
                          ? "https://j2.jgx.jp/PortalManagementWeb/html/login.html?lsc=TOY"
                          : "https://j2.jgx.jp/PortalManagementWeb/html/login.html?lsc=TOY&sp=1"
                        } 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        出欠・学期成績を見る
                      </a>
                    </Button>
                  </CardContent>
                </Card>


                <Card className="border-brown-200 dark:border-brown-800">
                  <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg pb-2">
                    <CardTitle className="text-lg text-brown-800 dark:text-brown-100">模擬試験日程</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-brown-900 pt-4">
                    <p className="text-sm text-brown-600 dark:text-brown-300 mb-4">
                      模擬試験の日程を確認することができます。
                    </p>
                    <Button asChild className="w-full bg-brown-600 hover:bg-brown-700 text-white">
                      <Link href={`/tests?studentId=${studentId}&userType=${userType}&studentName=${studentName}&studentClass=${studentClass}`}>
                        <Calendar className="mr-2 h-4 w-4" />
                        模擬試験の日程を見る
                      </Link>
                    </Button>
                  </CardContent>
                </Card>


                <Card className="border-brown-200 dark:border-brown-800">
                  <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg pb-2">
                    <CardTitle className="text-lg text-brown-800 dark:text-brown-100">模擬試験成績</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-brown-900 pt-4">
                    <p className="text-sm text-brown-600 dark:text-brown-300 mb-4">
                      各模擬試験の成績を確認することができます。
                    </p>
                    <Button asChild className="w-full bg-brown-600 hover:bg-brown-700 text-white">
                      <Link href={`/results?studentId=${studentId}&type=${userType}&studentName=${studentName}&studentClass=${studentClass}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        模擬試験の成績を見る
                      </Link>
                    </Button>
                  </CardContent>
                </Card>


                <Card className="border-brown-200 dark:border-brown-800">
                  <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg pb-2">
                    <CardTitle className="text-lg text-brown-800 dark:text-brown-100">成績分析</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-brown-900 pt-4">
                    <p className="text-sm text-brown-600 dark:text-brown-300 mb-4">
                      これまでの模擬試験の成績分析が確認できます。
                    </p>
                    <Button asChild className="w-full bg-brown-600 hover:bg-brown-700 text-white">
                      <Link 
                        href={`/profile?studentId=${studentId}&type=${userType}&studentName=${studentName}&studentClass=${studentClass}`}
                      >
                        <User className="mr-2 h-4 w-4" />
                        成績分析を見る
                      </Link>
                    </Button>
                  </CardContent>
                </Card>


                <Card className="border-brown-200 dark:border-brown-800">
                  <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg pb-2">
                    <CardTitle className="text-lg text-brown-800 dark:text-brown-100">ハロハロ通信(同窓会サイト)</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-brown-900 pt-4">
                    <p className="text-sm text-brown-600 dark:text-brown-300 mb-4">
                      学校生活についてお届け中です。学生記事もあります。
                    </p>
                    <Button asChild className="w-full bg-brown-600 hover:bg-brown-700 text-white">
                      <Link href="https://jihou-kai.com/halo/" target="_blank" rel="noopener noreferrer">
                        <Newspaper className="mr-2 h-4 w-4" />
                        ハロハロ通信を見る
                      </Link>
                    </Button>
                  </CardContent>
                </Card>


                <Card className="border-brown-200 dark:border-brown-800">
                  <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg pb-2">
                    <CardTitle className="text-lg text-brown-800 dark:text-brown-100">附属鍼灸院予約</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-brown-900 pt-4">
                    <p className="text-sm text-brown-600 dark:text-brown-300 mb-4">
                      学校の附属鍼灸院の予約ができます。
                    </p>
                    <Button asChild className="w-full bg-brown-600 hover:bg-brown-700 text-white">
                      <Link href="https://kenkounihari.seirin.jp/clinic/14531/reserve?staffMode=false&options=" target="_blank" rel="noopener noreferrer">
                        <Calendar className="mr-2 h-4 w-4" />
                        鍼灸院の予約をする
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>


          {/* 保護者専用のメールアドレス登録・変更カード（最下部に移動） */}
          {userType === 'parent' && (
            <Card className="border-brown-200 dark:border-brown-800">
              <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
                <CardTitle className="text-brown-800 dark:text-brown-100">
                  メールアドレス登録・変更
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white dark:bg-brown-900 pt-4">
                <p className="text-sm text-brown-600 dark:text-brown-300 mb-4">
                  登録するとお知らせメールが届きます。<br />
                  ※これまで郵送にてお知らせをお届けしておりましたが、<strong>今後はWebアプリを通じて保護者の皆様へ通知を行う形に移行</strong>いたします。<br />
                </p>
                {email && (
                  <p className="text-sm text-brown-600 dark:text-brown-300 mb-4">
                    現在のメールアドレス: {email}
                  </p>
                )}
                <Button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="w-full bg-brown-600 hover:bg-brown-700 text-white"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {email ? "メールアドレスを変更する" : "メールアドレスを登録する"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>


      {/* メールアドレス入力モーダル */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メールアドレス登録・変更</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentEmail">現在のメールアドレス</Label>
              <Input
                id="currentEmail"
                value={email || '未登録'}
                disabled
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newEmail">新しいメールアドレス</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEmailUpdate}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
