"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { toast } from '@/components/ui/use-toast'
import { createBrowserClient } from '@supabase/ssr'

interface Test {
  id: number
  title: string
  description: string
  created_at: string
}

interface TestScore {
  id: number
  student_id: number
  test_id: number
  score: number
  created_at: string
  test_title: string
  tests: {
    title: string
  } | null
}

interface RawTestScore {
  id: number
  student_id: number
  test_id: number
  score: number
  created_at: string
  tests: {
    title: string
  } | null
}

interface TestScoreResponse {
  id: number
  student_id: number
  test_id: number
  score: number
  created_at: string
  tests: {
    title: string
  } | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TestPage: React.FC = () => {
  const router = useRouter()
  const [studentName, setStudentName] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [email, setEmail] = useState("")
  const [tests, setTests] = useState<Test[]>([])
  const [testScores, setTestScores] = useState<TestScore[]>([])
  const [studentId, setStudentId] = useState<string | null>(null)
  const [userName, setUserName] = useState("")
  const [userType, setUserType] = useState<'student' | 'parent'>('student')
  const [isLoading, setIsLoading] = useState(true)
  const supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const initializeTest = async () => {
      try {
        setIsLoading(true)

        // セッションストレージからユーザー情報を取得
        const userInfoStr = sessionStorage.getItem('user')
        if (!userInfoStr) {
          console.error('セッションストレージからユーザー情報を取得できません')
          router.push('/login')
          return
        }

        const userInfo = JSON.parse(userInfoStr)
        setUserType(userInfo.type)
        setStudentId(userInfo.id.toString())

        // 学生情報を取得
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id, name, class')
          .eq('id', userInfo.id)
          .single()

        if (studentError || !studentData) {
          console.error('学生情報の取得に失敗:', studentError)
          router.push('/login')
          return
        }

        console.log('学生情報取得成功:', studentData)

        setStudentId(studentData.id)
        setStudentName(studentData.name)
        setStudentClass(studentData.class)

        // テストスコアを取得
        const { data: scores, error: scoresError } = await supabase
          .from('test_scores')
          .select('*')
          .eq('student_id', studentData.id)
          .order('test_date', { ascending: false })

        if (scoresError) {
          console.error('テストスコアの取得に失敗:', scoresError)
        } else {
          setTestScores(scores || [])
        }

      } catch (error) {
        console.error('テスト画面初期化エラー:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    initializeTest()
  }, [supabase, router])

  // テスト情報の取得
  useEffect(() => {
    const fetchTests = async () => {
      if (!studentId) {
        console.log('学生IDが設定されていないため、テスト情報を取得しません')
        return
      }

      try {
        console.log('=== テスト情報取得開始 ===')
        const { data: testData, error: testError } = await supabase
          .from("tests")
          .select("*")
          .order("created_at", { ascending: false })

        console.log('テスト情報取得結果:', { testData, testError })

        if (testError) {
          console.error("テスト情報取得エラー:", testError)
          toast({
            title: "エラー",
            description: "テスト情報の取得に失敗しました",
            variant: "destructive",
          })
          return
        }

        if (!testData || testData.length === 0) {
          console.log("テスト情報が見つかりません")
          setTests([])
          return
        }

        console.log('取得したテスト情報:', testData)
        setTests(testData as Test[])
        console.log('=== テスト情報取得完了 ===')
      } catch (error) {
        console.error("テスト情報取得エラー:", error)
        toast({
          title: "エラー",
          description: "テスト情報の取得に失敗しました",
          variant: "destructive",
        })
      }
    }

    fetchTests()
  }, [studentId, toast])

  // テストスコアの取得
  useEffect(() => {
    const fetchTestScores = async () => {
      if (!studentId) {
        console.error('学生IDが指定されていません')
        return
      }

      try {
        console.log('テストスコア取得開始:', { studentId })
        const { data: scores, error: scoresError } = await supabaseClient
          .from('test_scores')
          .select(`
            id,
            student_id,
            test_id,
            score,
            created_at,
            tests (
              title
            )
          `)
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })

        if (scoresError) throw scoresError

        console.log('テストスコア取得結果:', { scores, scoresError, query: `student_id = ${studentId}` })

        const formattedScores: TestScore[] = (scores as unknown as TestScoreResponse[]).map((score) => ({
          id: score.id,
          student_id: score.student_id,
          test_id: score.test_id,
          score: score.score,
          created_at: score.created_at,
          test_title: score.tests?.title || '不明なテスト',
          tests: score.tests
        }))

        console.log('整形後のテストスコア:', formattedScores)
        setTestScores(formattedScores)
      } catch (error) {
        console.error('テストスコアの取得に失敗しました:', error)
        toast({
          title: 'エラー',
          description: 'テストスコアの取得に失敗しました',
          variant: 'destructive',
        })
      }
    }

    fetchTestScores()
  }, [studentId, supabaseClient])

  const handleTestClick = (testId: number) => {
    console.log('テスト選択:', { testId, studentId })
    if (studentId) {
      router.push(`/test/${testId}`)
    } else {
      console.error('テスト選択エラー: 学生IDが設定されていません')
      toast({
        title: "エラー",
        description: "テストを選択できませんでした",
        variant: "destructive",
      })
    }
  }

  // ダッシュボード画面への遷移
  const handleDashboardClick = () => {
    if (!studentId) return
    const params = new URLSearchParams()
    params.set('userType', userType)
    params.set('studentId', studentId)
    params.set('studentName', studentName)
    params.set('studentClass', studentClass)
    router.push(`/dashboard?${params.toString()}`)
  }

  // プロフィール画面への遷移
  const handleProfileClick = () => {
    if (!studentId) return
    const params = new URLSearchParams()
    params.set('userType', userType)
    params.set('studentId', studentId)
    params.set('studentName', studentName)
    params.set('studentClass', studentClass)
    router.push(`/profile?${params.toString()}`)
  }

  console.log('現在の状態:', {
    tests,
    testScores,
    studentId,
    studentName,
    studentClass
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">テスト一覧</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => {
              const score = testScores.find(s => s.test_id === test.id)
              const isCompleted = score !== undefined
              const scoreValue = score?.score || 0

              return (
                <div
                  key={test.id}
                  className={`border rounded-lg p-6 cursor-pointer transition-all ${
                    isCompleted
                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTestClick(test.id)}
                >
                  <h2 className="text-xl font-semibold mb-2">{test.title}</h2>
                  <p className="text-gray-600 mb-4">{test.description}</p>
                  {isCompleted ? (
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 font-medium">完了</span>
                      <span className="text-lg font-bold">{scoreValue}点</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">未受験</span>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        受験する
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 学生情報表示 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">学生情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">名前</p>
            <p className="font-medium">{studentName}</p>
          </div>
          <div>
            <p className="text-gray-600">クラス</p>
            <p className="font-medium">{studentClass}</p>
          </div>
          <div>
            <p className="text-gray-600">メールアドレス</p>
            <p className="font-medium">{email}</p>
          </div>
        </div>
      </div>

      {/* テストスコア一覧 */}
      {testScores.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">テストスコア一覧</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    テスト名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    スコア
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    受験日時
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testScores.map((score) => (
                  <tr key={score.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {score.test_title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{score.score}点</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(score.created_at).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestPage 