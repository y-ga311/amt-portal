"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { CharacterLoading } from "@/components/character-loading"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, BarChart, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"

interface TestData {
  id: number
  test_name: string
  test_date: string
  medical_overview: number | null
  public_health: number | null
  related_laws: number | null
  anatomy: number | null
  physiology: number | null
  pathology: number | null
  clinical_medicine_overview: number | null
  clinical_medicine_detail: number | null
  clinical_medicine_detail_total: number | null
  rehabilitation: number | null
  oriental_medicine_overview: number | null
  meridian_points: number | null
  oriental_medicine_clinical: number | null
  oriental_medicine_clinical_general: number | null
  acupuncture_theory: number | null
  moxibustion_theory: number | null
}

interface FormData {
  test_name: string
  test_date: string
  medical_overview: number | null
  public_health: number | null
  related_laws: number | null
  anatomy: number | null
  physiology: number | null
  pathology: number | null
  clinical_medicine_overview: number | null
  clinical_medicine_detail: number | null
  clinical_medicine_detail_total: number | null
  rehabilitation: number | null
  oriental_medicine_overview: number | null
  meridian_points: number | null
  oriental_medicine_clinical: number | null
  oriental_medicine_clinical_general: number | null
  acupuncture_theory: number | null
  moxibustion_theory: number | null
}

// 学年に応じた背景色を設定する関数
const getGradeColor = (testName: string): string => {
  return "bg-[#8B4513]" // 全ての試験を茶色に統一
}

function TestsContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [tests, setTests] = useState<TestData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [userClass, setUserClass] = useState<string | null>(null)
  const [allTests, setAllTests] = useState<TestData[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // URLからパラメータを取得
  const studentId = searchParams.get('studentId')
  const userType = searchParams.get('userType')
  const studentName = searchParams.get('studentName')
  const studentClass = searchParams.get('studentClass')

  useEffect(() => {
    console.log('URLパラメータ:', { studentId, userType, studentName, studentClass })
    
    if (!studentId || !userType) {
      console.error('必要なパラメータが不足しています')
      toast({
        title: "エラー",
        description: "必要な情報が不足しています。再度ログインしてください。",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    if (userType === 'parent') {
      // 保護者の場合は、保護者IDから子どもの学生IDを取得
      fetchChildStudentId(studentId)
    } else {
      // 学生の場合は直接クラス情報を取得
      setUserClass(studentClass || '')
    }
    fetchTests()
  }, [searchParams])

  // userClassが変更されたときにテストをフィルタリング
  useEffect(() => {
    if (allTests.length > 0 && userClass) {
      const userGrade = getGradeFromClass(userClass)
      console.log("ユーザーの学年:", userGrade)
      console.log("ユーザーのクラス:", userClass)
      
      const filteredTests = userGrade
        ? allTests.filter(test => test.test_name.includes(userGrade))
        : allTests

      console.log("フィルタリング後のテスト:", filteredTests)
      setTests(filteredTests)
    } else {
      setTests(allTests)
    }
  }, [userClass, allTests])

  const fetchChildStudentId = async (parentId: string) => {
    try {
      // 保護者IDから学生IDを取得
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('gakusei_id, class')
        .eq('hogosya_id', parentId)
        .maybeSingle()

      if (studentError) {
        console.error("学生データ取得エラー:", studentError)
        return
      }

      if (studentData) {
        console.log("取得した学生データ:", studentData)
        setUserClass(studentData.class)
      } else {
        console.log("学生データが見つかりませんでした")
        setUserClass(studentClass || '')
      }
    } catch (err) {
      console.error("データ取得エラー:", err)
      setUserClass(studentClass || '')
    }
  }

  const getGradeFromClass = (className: string | null): string | null => {
    if (!className) return null
    
    // 正規表現で「数字+期生」のパターンを抽出
    const match = className.match(/(\d+期生)/)
    if (match) {
      return match[1] // マッチした期生を返す
    }
    
    return null
  }

  const fetchTests = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // データを直接取得
      const { data, error, count } = await supabase
        .from("question_counts")
        .select("*", { count: 'exact' })
        .order("test_date", { ascending: true })

      console.log("Supabaseクエリ結果:", {
        data,
        error,
        count,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint
      })

      if (error) {
        console.error("テストデータ取得エラー:", error)
        setError(`データの取得に失敗しました: ${error.message}`)
        return
      }

      if (!data || data.length === 0) {
        console.log("データが存在しません")
        setError("テストデータが見つかりませんでした。管理者に連絡してください。")
        return
      }

      setAllTests(data)
      setIsLoading(false)
    } catch (err) {
      console.error("テストデータ取得エラー:", err)
      setError("データの取得中にエラーが発生しました")
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <CharacterLoading message="テスト情報を読み込んでいます..." />
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard?type=${userType}&studentId=${studentId}&studentName=${studentName}&studentClass=${studentClass}`} className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              ダッシュボードに戻る
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CharacterIcon size={40} />
              <div>
                <CardTitle>実施予定の試験</CardTitle>
                <CardDescription>今年度に実施予定の試験一覧</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <Button variant="outline" onClick={fetchTests}>
                  再読み込み
                </Button>
              </div>
            ) : tests.length > 0 ? (
              <div className="space-y-6">
                {tests.map((test) => (
                  <Card key={test.id} className="border-2 border-gray-100 hover:border-gray-200 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-6">
                        {/* ヘッダー部分 */}
                        <div className={`flex flex-col sm:flex-row justify-between items-start gap-4 ${getGradeColor(test.test_name)} text-white p-4 rounded-lg`}>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-white" />
                            <div>
                              <h3 className="text-xl font-semibold">{test.test_name}</h3>
                              <p className="text-sm text-gray-200">
                                実施日: {format(new Date(test.test_date), "yyyy年M月d日")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm">
                            <BarChart className="h-4 w-4" />
                            <span>合計: {
                              (test.medical_overview || 0) +
                              (test.public_health || 0) +
                              (test.related_laws || 0) +
                              (test.anatomy || 0) +
                              (test.physiology || 0) +
                              (test.pathology || 0) +
                              (test.clinical_medicine_overview || 0) +
                              (test.clinical_medicine_detail || 0) +
                              (test.clinical_medicine_detail_total || 0) +
                              (test.rehabilitation || 0) +
                              (test.oriental_medicine_overview || 0) +
                              (test.meridian_points || 0) +
                              (test.oriental_medicine_clinical || 0) +
                              (test.oriental_medicine_clinical_general || 0) +
                              (test.acupuncture_theory || 0) +
                              (test.moxibustion_theory || 0)
                            }問</span>
                          </div>
                        </div>

                        {/* 問題数一覧 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {/* 基礎医学系 */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium mb-2 bg-blue-600 text-white px-2 py-1 rounded">基礎医学系</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {test.medical_overview !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">医療概論</p>
                                  <p className="font-medium text-lg">{test.medical_overview}問</p>
                                </div>
                              )}
                              {test.public_health !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">衛生・公衆衛生学</p>
                                  <p className="font-medium text-lg">{test.public_health}問</p>
                                </div>
                              )}
                              {test.related_laws !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">関係法規</p>
                                  <p className="font-medium text-lg">{test.related_laws}問</p>
                                </div>
                              )}
                              {test.anatomy !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">解剖学</p>
                                  <p className="font-medium text-lg">{test.anatomy}問</p>
                                </div>
                              )}
                              {test.physiology !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">生理学</p>
                                  <p className="font-medium text-lg">{test.physiology}問</p>
                                </div>
                              )}
                              {test.pathology !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">病理学</p>
                                  <p className="font-medium text-lg">{test.pathology}問</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 臨床医学系 */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium mb-2 bg-green-600 text-white px-2 py-1 rounded">臨床医学系</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {test.clinical_medicine_overview !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">臨床医学総論</p>
                                  <p className="font-medium text-lg">{test.clinical_medicine_overview}問</p>
                                </div>
                              )}
                              {test.clinical_medicine_detail !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">臨床医学各論</p>
                                  <p className="font-medium text-lg">{test.clinical_medicine_detail}問</p>
                                </div>
                              )}
                              {test.clinical_medicine_detail_total !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">臨床医学各論（総合）</p>
                                  <p className="font-medium text-lg">{test.clinical_medicine_detail_total}問</p>
                                </div>
                              )}
                              {test.rehabilitation !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">リハビリテーション医学</p>
                                  <p className="font-medium text-lg">{test.rehabilitation}問</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 東洋医学系 */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium mb-2 bg-purple-600 text-white px-2 py-1 rounded">東洋医学系</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {test.oriental_medicine_overview !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">東洋医学概論</p>
                                  <p className="font-medium text-lg">{test.oriental_medicine_overview}問</p>
                                </div>
                              )}
                              {test.meridian_points !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">経絡経穴概論</p>
                                  <p className="font-medium text-lg">{test.meridian_points}問</p>
                                </div>
                              )}
                              {test.oriental_medicine_clinical !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">東洋医学臨床論</p>
                                  <p className="font-medium text-lg">{test.oriental_medicine_clinical}問</p>
                                </div>
                              )}
                              {test.oriental_medicine_clinical_general !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">東洋医学臨床論（総合）</p>
                                  <p className="font-medium text-lg">{test.oriental_medicine_clinical_general}問</p>
                                </div>
                                )}
                              </div>
                          </div>

                          {/* 専門系 */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium mb-2 bg-orange-600 text-white px-2 py-1 rounded">専門系</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {test.acupuncture_theory !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">はり理論</p>
                                  <p className="font-medium text-lg">{test.acupuncture_theory}問</p>
                                </div>
                              )}
                              {test.moxibustion_theory !== null && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-500">きゅう理論</p>
                                  <p className="font-medium text-lg">{test.moxibustion_theory}問</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <CharacterIcon size={64} />
                </div>
                <p className="text-gray-500">今年度の試験予定はありません</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function TestsPage() {
  return (
    <Suspense fallback={<CharacterLoading message="テスト情報を読み込んでいます..." />}>
      <TestsContent />
    </Suspense>
  )
}
