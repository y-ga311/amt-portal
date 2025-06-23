"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { useToast } from "@/components/ui/use-toast"
import {
  ChevronLeft,
  User,
  School,
  Calendar,
  BookOpen,
  Award,
  Clock,
  Bug,
  Database,
  AlertCircle,
  BarChart,
  Star,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { CharacterLoading } from "@/components/character-loading"
import { getStudentTestResults } from "@/app/actions/test-scores"
import { Badge } from "@/components/ui/badge"
import { BadgeDisplay } from "@/components/badge-display"
import { LevelDisplay } from "@/components/level-display"
import { OverallRankingDisplay } from "@/components/overall-ranking-display"
import { calculateStudentLevel, getStudentOverallRanking } from "@/app/actions/rankings"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { redirect } from "next/navigation"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface TestResult {
  id: number
  student_id: number
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
  total_score: number
  basic_medicine_score: number
  clinical_medicine_score: number
  oriental_medicine_score: number
  specialized_score: number
  created_at: string
  updated_at: string
  question_counts: {
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
  } | null
  rank?: number
  total_participants?: number
  criteria?: {
    passing?: any
    failing?: any
  }
}

interface CriteriaData {
  passing: any
  failing: any
}

interface TestStats {
  testCount: number
  highestScore: number
  averageScore: number
  subjectStats: {
    [key: string]: {
      average: number
      highest: number
      lowest: number
    }
  }
}

interface NextTestDate {
  test_date: string
  test_name: string
}

interface SessionUser {
  id: number;
  name: string;
  class: string;
  type: 'student' | 'parent';
  studentId?: number;  // 保護者ログイン時に使用
  studentName?: string;
  studentClass?: string;
}

export default function ProfilePage() {
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [studentData, setStudentData] = useState<any>(null)
  const [testStats, setTestStats] = useState<TestStats | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [overallRanking, setOverallRanking] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [nextTestDate, setNextTestDate] = useState<NextTestDate | null>(null)
  const [selectedMetric, setSelectedMetric] = useState("total")
  const [chartData, setChartData] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [userInfo, setUserInfo] = useState<any>(null)
  const [testScores, setTestScores] = useState<any[]>([])
  const [userType, setUserType] = useState<'student' | 'parent'>('student')

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // セッションストレージからユーザー情報を取得
        const sessionUserStr = sessionStorage.getItem('user')
        if (!sessionUserStr) {
          console.error('セッションストレージからユーザー情報を取得できません')
          router.push('/login')
          return
        }

        const sessionUser = JSON.parse(sessionUserStr) as SessionUser
        console.log('セッションストレージから取得したユーザー情報:', sessionUser)

        if (!sessionUser?.id) {
          console.error('ユーザー情報が不正です')
          router.push('/login')
          return
        }

        // ローカルストレージの情報をクリア
        localStorage.removeItem('userInfo')

        // 学生情報を取得
        let studentData;
        if (sessionUser.type === 'parent') {
          // 保護者の場合、hogosya_idで検索
          const { data, error: studentError } = await supabase
          .from('students')
            .select('*')
            .eq('id', sessionUser.studentId)
          .single()

          if (!data) {
            console.error('学生情報が見つかりません')
            redirect('/login')
          return
        }
          studentData = data
        } else {
          // 学生の場合、idで検索
          const { data, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', sessionUser.id)
            .single()

          if (!data) {
          console.error('学生情報が見つかりません')
            redirect('/login')
          return
          }
          studentData = data
        }

        // 学生情報を設定
        setStudentId(studentData.id.toString())
        setStudentName(studentData.name)
        setStudentClass(studentData.class || '')
        setStudentInfo(studentData)
        setEmail(studentData.mail)
        setUserType(sessionUser.type)
        setIsLoading(false)

        // テストスコアを取得
        const { data: testScores, error: testScoresError } = await supabase
          .from('test_scores')
          .select('*')
          .eq('student_id', studentData.id)
          .order('test_date', { ascending: false })

        if (testScoresError) {
          console.error('テストスコアの取得に失敗:', testScoresError.message || '不明なエラー')
          return
        }

        if (!testScores || testScores.length === 0) {
          setTestResults([])
          return
        }

        // 問題数データを取得
        const testNames = testScores.map((r: TestResult) => r.test_name)
        console.log('取得する問題数のテスト名:', testNames)

        const { data: questionCounts } = await supabase
          .from('question_counts')
          .select('*')
          .in('test_name', testNames)

        // 基準値データを取得
        const { data: criteriaData, error: criteriaError } = await supabase
          .from('subject_criteria')
          .select(`
            test_name,
            criteria_type,
            medical_overview,
            public_health,
            related_laws,
            anatomy,
            physiology,
            pathology,
            clinical_medicine_overview,
            clinical_medicine_detail,
            clinical_medicine_detail_total,
            rehabilitation,
            oriental_medicine_overview,
            meridian_points,
            oriental_medicine_clinical,
            oriental_medicine_clinical_general,
            acupuncture_theory,
            moxibustion_theory
          `)
          .in('test_name', testNames)
          .order('test_name', { ascending: true })
          .order('criteria_type', { ascending: true })

        if (criteriaError) {
          console.error('基準値データの取得に失敗:', criteriaError)
          return
        }

        // 基準値データをテスト名ごとに整理
        const criteriaMap = testNames.reduce((acc: { [key: string]: CriteriaData }, testName) => {
          const testCriteria = criteriaData?.filter(item => item.test_name === testName) || []
          acc[testName] = {
            passing: testCriteria.find(item => item.criteria_type === 'passing') || null,
            failing: testCriteria.find(item => item.criteria_type === 'failing') || null
          }
          return acc
        }, {})

        // テスト結果に問題数と基準値データを追加
        const processedResults = testScores.map((result: TestResult) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === result.test_name)
          
          // 問題数データがない場合はデフォルト値を設定
          const defaultQuestionCount = {
            id: 0,
            test_name: result.test_name,
            test_date: result.test_date,
            medical_overview: 10,
            public_health: 10,
            related_laws: 10,
            anatomy: 10,
            physiology: 10,
            pathology: 10,
            clinical_medicine_overview: 10,
            clinical_medicine_detail: 10,
            clinical_medicine_detail_total: 10,
            rehabilitation: 10,
            oriental_medicine_overview: 10,
            meridian_points: 10,
            oriental_medicine_clinical: 10,
            oriental_medicine_clinical_general: 10,
            acupuncture_theory: 10,
            moxibustion_theory: 10
          }

          return {
            ...result,
            criteria: criteriaMap[result.test_name] || null,
            question_counts: questionCount || defaultQuestionCount
          } as TestResult
        }).filter(Boolean) as TestResult[]

        setTestResults(processedResults)
        console.log('テストスコア取得成功:', processedResults.length, '件')
      } catch (error) {
        console.error('データ取得エラー:', error)
        setError(error instanceof Error ? error.message : 'データの取得に失敗しました')
        router.push('/login')
      }
    }

    fetchUserData()
  }, [router, supabase])

  // ダッシュボード画面への遷移
  const handleDashboardClick = () => {
    router.push('/dashboard')
  }

  // テスト画面への遷移
  const handleTestClick = () => {
    router.push('/test')
  }

  useEffect(() => {
    async function fetchData() {
      try {
        // セッションストレージからユーザー情報を取得
        const sessionUserStr = sessionStorage.getItem('user')
        if (!sessionUserStr) {
          console.error('セッションストレージからユーザー情報を取得できません')
          redirect('/login')
          return
        }

        const sessionUser = JSON.parse(sessionUserStr) as SessionUser
        console.log('セッションストレージから取得したユーザー情報:', sessionUser)

        if (!sessionUser?.id) {
          console.error('ユーザー情報が不正です')
          redirect('/login')
          return
        }

        // 学生情報を取得
          const { data: studentData, error: studentError } = await supabase
            .from('students')
          .select('*')
          .eq('id', sessionUser.type === 'parent' ? sessionUser.studentId : sessionUser.id)
            .single()

        if (!studentData) {
          console.error('学生情報が見つかりません')
            redirect('/login')
            return
          }

        // 学生情報を設定
        setStudentId(studentData.id.toString())
        setStudentName(studentData.name)
        setStudentClass(studentData.class || '')
        setStudentInfo(studentData)
        setEmail(studentData.mail)
        setUserType(sessionUser.type)
        setIsLoading(false)

        // テストスコアを取得
        const { data: testScores, error: testScoresError } = await supabase
          .from('test_scores')
          .select('*')
          .eq('student_id', studentData.id)
          .order('test_date', { ascending: false })

        if (testScoresError) {
          console.error('テストスコアの取得に失敗:', testScoresError.message || '不明なエラー')
          return
        }

        if (!testScores || testScores.length === 0) {
          setTestResults([])
          return
        }

        // 問題数データを取得
        const testNames = testScores.map((r: TestResult) => r.test_name)
        console.log('取得する問題数のテスト名:', testNames)

        const { data: questionCounts } = await supabase
          .from('question_counts')
          .select('*')
          .in('test_name', testNames)

        // 基準値データを取得
        const { data: criteriaData, error: criteriaError } = await supabase
          .from('subject_criteria')
          .select(`
            test_name,
            criteria_type,
            medical_overview,
            public_health,
            related_laws,
            anatomy,
            physiology,
            pathology,
            clinical_medicine_overview,
            clinical_medicine_detail,
            clinical_medicine_detail_total,
            rehabilitation,
            oriental_medicine_overview,
            meridian_points,
            oriental_medicine_clinical,
            oriental_medicine_clinical_general,
            acupuncture_theory,
            moxibustion_theory
          `)
          .in('test_name', testNames)
          .order('test_name', { ascending: true })
          .order('criteria_type', { ascending: true })

        if (criteriaError) {
          console.error('基準値データの取得に失敗:', criteriaError)
          return
        }

        // 基準値データをテスト名ごとに整理
        const criteriaMap = testNames.reduce((acc: { [key: string]: CriteriaData }, testName) => {
          const testCriteria = criteriaData?.filter(item => item.test_name === testName) || []
          acc[testName] = {
            passing: testCriteria.find(item => item.criteria_type === 'passing') || null,
            failing: testCriteria.find(item => item.criteria_type === 'failing') || null
          }
          return acc
        }, {})

        // テスト結果に問題数と基準値データを追加
        const processedResults = testScores.map((result: TestResult) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === result.test_name)
          
          // 問題数データがない場合はデフォルト値を設定
          const defaultQuestionCount = {
            id: 0,
            test_name: result.test_name,
            test_date: result.test_date,
            medical_overview: 10,
            public_health: 10,
            related_laws: 10,
            anatomy: 10,
            physiology: 10,
            pathology: 10,
            clinical_medicine_overview: 10,
            clinical_medicine_detail: 10,
            clinical_medicine_detail_total: 10,
            rehabilitation: 10,
            oriental_medicine_overview: 10,
            meridian_points: 10,
            oriental_medicine_clinical: 10,
            oriental_medicine_clinical_general: 10,
            acupuncture_theory: 10,
            moxibustion_theory: 10
          }

          return {
            ...result,
            criteria: criteriaMap[result.test_name] || null,
            question_counts: questionCount || defaultQuestionCount
          } as TestResult
        }).filter(Boolean) as TestResult[]

        setTestResults(processedResults)
        setIsLoading(false)
      } catch (error) {
        console.error('データ取得中にエラーが発生:', error)
        setError('データの取得に失敗しました')
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  // 学生IDが設定された後に学生情報を取得
  useEffect(() => {
    if (studentId) {
      fetchStudentProfile()
    }
  }, [studentId])

  const fetchStudentProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!studentId) {
        throw new Error("学生IDが見つかりません")
      }

      // 学生情報を取得
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single()

      if (studentError) {
        console.error("学生情報取得エラー:", studentError)
        throw new Error("学生情報の取得に失敗しました")
      }

      if (!student) {
        console.log("学生が見つかりません - 学生ID:", studentId)
        throw new Error("学生が見つかりません")
      }

      console.log("学生情報取得成功:", student)
      setStudentInfo(student)

      // テスト結果を取得
      const { data: testScores, error: testScoresError } = await supabase
        .from('test_scores')
        .select(`
          id,
          student_id,
          test_name,
          test_date,
          medical_overview,
          public_health,
          related_laws,
          anatomy,
          physiology,
          pathology,
          clinical_medicine_overview,
          clinical_medicine_detail,
          clinical_medicine_detail_total,
          rehabilitation,
          oriental_medicine_overview,
          meridian_points,
          oriental_medicine_clinical,
          oriental_medicine_clinical_general,
          acupuncture_theory,
          moxibustion_theory,
          total_score,
          basic_medicine_score,
          clinical_medicine_score,
          oriental_medicine_score,
          specialized_score,
          created_at,
          updated_at,
          question_counts!test_scores_test_name_fkey (
            id,
            test_name,
            test_date,
            medical_overview,
            public_health,
            related_laws,
            anatomy,
            physiology,
            pathology,
            clinical_medicine_overview,
            clinical_medicine_detail,
            clinical_medicine_detail_total,
            rehabilitation,
            oriental_medicine_overview,
            meridian_points,
            oriental_medicine_clinical,
            oriental_medicine_clinical_general,
            acupuncture_theory,
            moxibustion_theory
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (testScoresError) {
        console.error("テストスコアの取得に失敗:", testScoresError)
        throw new Error("テストスコアの取得に失敗しました")
      }

      if (!testScores || testScores.length === 0) {
        console.log("テストスコアがありません")
        setTestResults([])
        setTestStats(null)
        return
      }

      console.log("テストスコア取得成功:", testScores.length, "件")
      setTestScores(testScores || [])

      // テスト結果を設定
      const typedTestScores = testScores?.map(score => ({
        ...score,
        question_counts: score.question_counts?.[0] || null
      })) as TestResult[]
      setTestResults(typedTestScores)

      // テスト統計を計算
      const stats = calculateTestStats(typedTestScores)
      setTestStats(stats)
    } catch (error) {
      console.error("プロフィール取得エラー:", error)
      setError(error instanceof Error ? error.message : "プロフィールの取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  // 選択された指標が変更されたときにグラフデータを更新
  useEffect(() => {
    if (testResults && testResults.length > 0) {
      // 問題数データを取得
      const fetchQuestionCounts = async () => {
        const testNames = testResults.map(r => r.test_name)
        const { data: questionCounts, error: questionCountsError } = await supabase
          .from('question_counts')
          .select('*')
          .in('test_name', testNames)

        if (questionCountsError) {
          console.error("問題数データ取得エラー:", questionCountsError)
          return
        }

        updateChartData(selectedMetric, questionCounts || [])
      }

      fetchQuestionCounts()
    }
  }, [selectedMetric, testResults])

  // 昼間部・夜間部の判定
  const getDepartment = (studentId: string | number) => {
    const studentIdStr = String(studentId)
    if (studentIdStr.length >= 3) {
      const thirdDigit = studentIdStr.charAt(2)
      if (thirdDigit === "2") return "昼間部"
      if (thirdDigit === "3") return "夜間部"
    }
    return "その他"
  }

  // 入学年度の推定
  const getEnrollmentYear = (studentId: string | number) => {
    const studentIdStr = String(studentId)
    if (studentIdStr.length >= 2) {
      const firstTwoDigits = studentIdStr.substring(0, 2)
      return `20${firstTwoDigits}年度`
    }
    return "不明"
  }

  const runDebugQuery = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/debug-query?studentId=${encodeURIComponent(studentId)}`)
      const data = await response.json()
      setDebugInfo(data)

      if (data.success && data.results && data.results.length > 0) {
        calculateTestStats(data.results)
        setTestResults(data.results)
        setError(`デバッグクエリで ${data.results.length} 件の結果が見つかりました。`)
      } else {
        setError("デバッグクエリでもテスト結果が見つかりませんでした。")
      }

      toast({
        title: "デバッグ情報取得完了",
        description: `${data.resultCount || 0}件のテスト結果が見つかりました`,
      })
    } catch (error) {
      console.error("デバッグクエリエラー:", error)
      toast({
        title: "デバッグエラー",
        description: error instanceof Error ? error.message : "デバッグ情報の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // テスト結果の合計点を計算する関数
  const calculateTotalScore = (test: any) => {
    return (
      (Number(test.medical_overview) || 0) +
      (Number(test.public_health) || 0) +
      (Number(test.related_laws) || 0) +
      (Number(test.anatomy) || 0) +
      (Number(test.physiology) || 0) +
      (Number(test.pathology) || 0) +
      (Number(test.clinical_medicine_overview) || 0) +
      (Number(test.clinical_medicine_detail) || 0) +
      (Number(test.rehabilitation) || 0) +
      (Number(test.oriental_medicine_overview) || 0) +
      (Number(test.meridian_points) || 0) +
      (Number(test.oriental_medicine_clinical) || 0) +
      (Number(test.oriental_medicine_clinical_general) || 0) +
      (Number(test.acupuncture_theory) || 0) +
      (Number(test.moxibustion_theory) || 0)
    )
  }

  // 合格判定を行う関数
  const isTestPassing = (test: any) => {
    const commonScore =
      (Number(test.medical_overview) || 0) +
      (Number(test.public_health) || 0) +
      (Number(test.related_laws) || 0) +
      (Number(test.anatomy) || 0) +
      (Number(test.physiology) || 0) +
      (Number(test.pathology) || 0) +
      (Number(test.clinical_medicine_overview) || 0) +
      (Number(test.clinical_medicine_detail) || 0) +
      (Number(test.rehabilitation) || 0) +
      (Number(test.oriental_medicine_overview) || 0) +
      (Number(test.meridian_points) || 0) +
      (Number(test.oriental_medicine_clinical) || 0) +
      (Number(test.oriental_medicine_clinical_general) || 0)

    const acupuncturistScore = commonScore + (Number(test.acupuncture_theory) || 0)
    const moxibustionistScore = commonScore + (Number(test.moxibustion_theory) || 0)

    const COMMON_MAX_SCORE = 180
    const SPECIALIZED_MAX_SCORE = 10
    const PASSING_PERCENTAGE = 0.6
    const passingScore = (COMMON_MAX_SCORE + SPECIALIZED_MAX_SCORE) * PASSING_PERCENTAGE

    return {
      acupuncturist: acupuncturistScore >= passingScore,
      moxibustionist: moxibustionistScore >= passingScore,
      both: acupuncturistScore >= passingScore && moxibustionistScore >= passingScore,
    }
  }

  // 科目ごとの得点率を計算する関数
  const calculateSubjectPercentage = (test: any, subject: string) => {
    const score = Number(test[subject])
    const questionCount = test.question_counts?.[subject] || 0
    if (questionCount === 0 || isNaN(score)) return null
    return Math.round((score / questionCount) * 100 * 10) / 10 // 小数点第一位まで
  }

  // 総合得点率を計算する関数
  const calculateTotalPercentage = (test: any) => {
    const subjects = [
      'medical_overview',
      'public_health',
      'related_laws',
      'anatomy',
      'physiology',
      'pathology',
      'clinical_medicine_overview',
      'clinical_medicine_detail',
      'clinical_medicine_detail_total',
      'rehabilitation',
      'oriental_medicine_overview',
      'meridian_points',
      'oriental_medicine_clinical',
      'oriental_medicine_clinical_general',
      'acupuncture_theory',
      'moxibustion_theory'
    ]

    let totalScore = 0
    let totalQuestions = 0

    subjects.forEach(subject => {
      const score = Number(test[subject])
      const questionCount = test.question_counts?.[subject] || 0
      if (!isNaN(score) && questionCount > 0) {
      totalScore += score
      totalQuestions += questionCount
      }
    })

    if (totalQuestions === 0) return null
    return Math.round((totalScore / totalQuestions) * 100 * 10) / 10 // 小数点第一位まで
  }

  // グラフデータを更新する関数
  const updateChartData = (metric: string, questionCounts: any[]) => {
    if (!testResults || testResults.length === 0) return

    // テスト結果を時系列でソート（古い順）
    const sortedResults = [...testResults].sort((a, b) => {
      const dateA = new Date(a.test_date)
      const dateB = new Date(b.test_date)
      return dateA.getTime() - dateB.getTime()
    })

    // 有効なデータポイントのみを抽出
    const validResults = sortedResults.filter(test => {
      switch (metric) {
        case 'total':
          return test.total_score !== null && test.total_score !== undefined
        case 'medical_overview':
          return test.medical_overview !== null
        case 'public_health':
          return test.public_health !== null
        case 'anatomy':
          return test.anatomy !== null
        case 'physiology':
          return test.physiology !== null
        case 'pathology':
          return test.pathology !== null
        case 'clinical_medicine_overview':
          return test.clinical_medicine_overview !== null
        case 'clinical_medicine_detail':
          return test.clinical_medicine_detail !== null
        case 'clinical_medicine_detail_total':
          return test.clinical_medicine_detail_total !== null
        case 'rehabilitation':
          return test.rehabilitation !== null
        case 'oriental_medicine_overview':
          return test.oriental_medicine_overview !== null
        case 'meridian_points':
          return test.meridian_points !== null
        case 'oriental_medicine_clinical':
          return test.oriental_medicine_clinical !== null
        case 'oriental_medicine_clinical_general':
          return test.oriental_medicine_clinical_general !== null
        case 'acupuncture_theory':
          return test.acupuncture_theory !== null
        case 'moxibustion_theory':
          return test.moxibustion_theory !== null
        default:
          return false
      }
    })

    console.log(`[DEBUG] Metric: ${metric}, ValidResults count: ${validResults.length}`)
    console.log(`[DEBUG] ValidResults:`, validResults.map(r => ({ 
      test_name: r.test_name, 
      test_date: r.test_date, 
      [metric]: r[metric as keyof TestResult] 
    })))

    if (validResults.length === 0) {
      setChartData(null)
      return
    }

    const labels = validResults.map(test => 
      new Date(test.test_date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    )

    let data: number[] = []
    let label = ''
    let color = ''
    let filteredLabels: string[] = []

    switch (metric) {
      case 'total':
        data = validResults.map(test => {
          const totalScore = test.total_score || 0
          const maxScore = 190 // 総合得点の最大値（基礎医学90点 + 臨床医学50点 + 東洋医学50点）
          return Math.round((totalScore / maxScore) * 100)
        })
        filteredLabels = labels
        label = '総合得点率'
        color = 'rgb(75, 192, 192)'
        break
      case 'medical_overview':
        const medicalData = validResults.map((test, index) => {
          console.log(`[DEBUG] Processing medical_overview for ${test.test_name}:`, test.medical_overview)
          // question_countsテーブルから問題数を取得
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.medical_overview
          
          // 問題数が0またはnullの場合は科目が実施されていない
          if (!questionCount || questionCount === 0) {
            console.log(`[DEBUG] Skipping ${test.test_name} - medical_overview not implemented (questionCount: ${questionCount})`)
            return { value: null, label: labels[index] }
          }
          
          // 得点がnullまたはundefinedの場合は除外
          if (test.medical_overview === null || test.medical_overview === undefined) {
            console.log(`[DEBUG] Skipping ${test.test_name} - medical_overview is null/undefined`)
            return { value: null, label: labels[index] }
          }
          
          const score = Number(test.medical_overview)
          if (isNaN(score)) {
            console.log(`[DEBUG] Skipping ${test.test_name} - medical_overview is NaN`)
            return { value: null, label: labels[index] }
          }
          
          const percentage = Math.round((score / questionCount) * 100)
          console.log(`[DEBUG] ${test.test_name} medical_overview: ${score}/${questionCount} = ${percentage}%`)
          return { value: percentage, label: labels[index] }
        })
        data = medicalData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = medicalData.filter(item => item.value !== null).map(item => item.label)
        console.log(`[DEBUG] Final medical_overview data:`, data)
        console.log(`[DEBUG] Final medical_overview labels:`, filteredLabels)
        label = '医療概論'
        color = 'rgb(255, 99, 132)'
        break
      case 'public_health':
        const publicHealthData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.public_health
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.public_health === null || test.public_health === undefined) return { value: null, label: labels[index] }
          const score = Number(test.public_health)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = publicHealthData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = publicHealthData.filter(item => item.value !== null).map(item => item.label)
        label = '衛生・公衆衛生学'
        color = 'rgb(54, 162, 235)'
        break
      case 'anatomy':
        const anatomyData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.anatomy
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.anatomy === null || test.anatomy === undefined) return { value: null, label: labels[index] }
          const score = Number(test.anatomy)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = anatomyData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = anatomyData.filter(item => item.value !== null).map(item => item.label)
        label = '解剖学'
        color = 'rgb(255, 206, 86)'
        break
      case 'physiology':
        const physiologyData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.physiology
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.physiology === null || test.physiology === undefined) return { value: null, label: labels[index] }
          const score = Number(test.physiology)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = physiologyData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = physiologyData.filter(item => item.value !== null).map(item => item.label)
        label = '生理学'
        color = 'rgb(75, 192, 192)'
        break
      case 'pathology':
        const pathologyData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.pathology
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.pathology === null || test.pathology === undefined) return { value: null, label: labels[index] }
          const score = Number(test.pathology)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = pathologyData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = pathologyData.filter(item => item.value !== null).map(item => item.label)
        label = '病理学'
        color = 'rgb(153, 102, 255)'
        break
      case 'clinical_medicine_overview':
        const clinicalOverviewData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.clinical_medicine_overview
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.clinical_medicine_overview === null || test.clinical_medicine_overview === undefined) return { value: null, label: labels[index] }
          const score = Number(test.clinical_medicine_overview)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = clinicalOverviewData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = clinicalOverviewData.filter(item => item.value !== null).map(item => item.label)
        label = '臨床医学総論'
        color = 'rgb(255, 159, 64)'
        break
      case 'clinical_medicine_detail':
        const clinicalDetailData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.clinical_medicine_detail
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.clinical_medicine_detail === null || test.clinical_medicine_detail === undefined) return { value: null, label: labels[index] }
          const score = Number(test.clinical_medicine_detail)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = clinicalDetailData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = clinicalDetailData.filter(item => item.value !== null).map(item => item.label)
        label = '臨床医学各論'
        color = 'rgb(75, 192, 192)'
        break
      case 'rehabilitation':
        const rehabilitationData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.rehabilitation
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.rehabilitation === null || test.rehabilitation === undefined) return { value: null, label: labels[index] }
          const score = Number(test.rehabilitation)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = rehabilitationData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = rehabilitationData.filter(item => item.value !== null).map(item => item.label)
        label = 'リハビリテーション医学'
        color = 'rgb(153, 102, 255)'
        break
      case 'oriental_medicine_overview':
        const orientalOverviewData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.oriental_medicine_overview
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.oriental_medicine_overview === null || test.oriental_medicine_overview === undefined) return { value: null, label: labels[index] }
          const score = Number(test.oriental_medicine_overview)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = orientalOverviewData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = orientalOverviewData.filter(item => item.value !== null).map(item => item.label)
        label = '東洋医学概論'
        color = 'rgb(255, 99, 132)'
        break
      case 'meridian_points':
        const meridianData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.meridian_points
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.meridian_points === null || test.meridian_points === undefined) return { value: null, label: labels[index] }
          const score = Number(test.meridian_points)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = meridianData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = meridianData.filter(item => item.value !== null).map(item => item.label)
        label = '経絡経穴概論'
        color = 'rgb(54, 162, 235)'
        break
      case 'oriental_medicine_clinical':
        const orientalClinicalData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.oriental_medicine_clinical
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.oriental_medicine_clinical === null || test.oriental_medicine_clinical === undefined) return { value: null, label: labels[index] }
          const score = Number(test.oriental_medicine_clinical)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = orientalClinicalData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = orientalClinicalData.filter(item => item.value !== null).map(item => item.label)
        label = '東洋医学臨床論'
        color = 'rgb(255, 206, 86)'
        break
      case 'acupuncture_theory':
        const acupunctureData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.acupuncture_theory
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.acupuncture_theory === null || test.acupuncture_theory === undefined) return { value: null, label: labels[index] }
          const score = Number(test.acupuncture_theory)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = acupunctureData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = acupunctureData.filter(item => item.value !== null).map(item => item.label)
        label = 'はり理論'
        color = 'rgb(75, 192, 192)'
        break
      case 'moxibustion_theory':
        const moxibustionData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.moxibustion_theory
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.moxibustion_theory === null || test.moxibustion_theory === undefined) return { value: null, label: labels[index] }
          const score = Number(test.moxibustion_theory)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = moxibustionData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = moxibustionData.filter(item => item.value !== null).map(item => item.label)
        label = 'きゅう理論'
        color = 'rgb(153, 102, 255)'
        break
      case 'clinical_medicine_detail_total':
        const clinicalDetailTotalData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.clinical_medicine_detail_total
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.clinical_medicine_detail_total === null || test.clinical_medicine_detail_total === undefined) return { value: null, label: labels[index] }
          const score = Number(test.clinical_medicine_detail_total)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = clinicalDetailTotalData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = clinicalDetailTotalData.filter(item => item.value !== null).map(item => item.label)
        label = '臨床医学各論（総合）'
        color = 'rgb(75, 192, 192)'
        break
      case 'oriental_medicine_clinical_general':
        const orientalClinicalGeneralData = validResults.map((test, index) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === test.test_name)?.oriental_medicine_clinical_general
          if (!questionCount || questionCount === 0) return { value: null, label: labels[index] }
          if (test.oriental_medicine_clinical_general === null || test.oriental_medicine_clinical_general === undefined) return { value: null, label: labels[index] }
          const score = Number(test.oriental_medicine_clinical_general)
          if (isNaN(score)) return { value: null, label: labels[index] }
          return { value: Math.round((score / questionCount) * 100), label: labels[index] }
        })
        data = orientalClinicalGeneralData.map(item => item.value).filter((value): value is number => value !== null)
        filteredLabels = orientalClinicalGeneralData.filter(item => item.value !== null).map(item => item.label)
        label = '東洋医学臨床論（総合）'
        color = 'rgb(255, 206, 86)'
        break
    }

    const newChartData = {
      labels: filteredLabels,
      datasets: [
        {
          label,
          data,
          borderColor: color,
          tension: 0.1,
        },
        {
          label: '全体平均得点率',
          data: data.map((_, index) => {
            const sum = data.slice(0, index + 1).reduce((acc, val) => acc + val, 0)
            return Math.round((sum / (index + 1)) * 10) / 10
          }),
          borderColor: 'rgb(128, 128, 128)',
          borderDash: [5, 5],
          tension: 0.1,
        }
      ],
    }

    setChartData(newChartData)
  }

  // テスト結果を時系列でソート（古い順）
  const sortedResults = [...testResults].sort((a, b) => {
    const dateA = new Date(a.test_date)
    const dateB = new Date(b.test_date)
    return dateA.getTime() - dateB.getTime()
  })

  // テスト統計を計算する関数
  const calculateTestStats = (results: TestResult[]) => {
    if (!results || results.length === 0) return null

    const stats: TestStats = {
      testCount: results.length,
      highestScore: Math.max(...results.map(r => r.total_score)),
      averageScore: results.reduce((acc, r) => acc + r.total_score, 0) / results.length,
      subjectStats: {}
    }

    // 各科目の統計を計算
    const subjects = [
      'medical_overview',
      'public_health',
      'related_laws',
      'anatomy',
      'physiology',
      'pathology',
      'clinical_medicine_overview',
      'clinical_medicine_detail',
      'clinical_medicine_detail_total',
      'rehabilitation',
      'oriental_medicine_overview',
      'meridian_points',
      'oriental_medicine_clinical',
      'oriental_medicine_clinical_general',
      'acupuncture_theory',
      'moxibustion_theory'
    ]

    subjects.forEach(subject => {
      const scores = results
        .map(r => Number(r[subject as keyof TestResult]))
        .filter(s => !isNaN(s) && s !== null)
      
      if (scores.length > 0) {
        const sum = scores.reduce((acc, s) => acc + s, 0)
        stats.subjectStats[subject] = {
          average: sum / scores.length,
          highest: Math.max(...scores),
          lowest: Math.min(...scores)
        }
      }
    })

    return stats
  }

  if (isLoading) {
    return <CharacterLoading message="プロフィール情報を読み込んでいます..." />
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard" className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              ダッシュボードに戻る
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-1">
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  成績分析
                </CardTitle>
                <CardDescription>これまでの模擬試験の成績分析</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-red-800">{error}</p>
                        <div className="mt-3 flex gap-2">
                          <Button asChild variant="outline" size="sm" className="text-red-600 border-red-300">
                            <Link href={`/debug/student/${studentId}`} className="flex items-center">
                              <Database className="mr-1 h-4 w-4" />
                              データベース情報を確認する
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" onClick={runDebugQuery} className="flex items-center">
                            <Bug className="mr-1 h-4 w-4" />
                            デバッグクエリを実行
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {testStats && testStats.testCount > 0 ? (
                  <div className="space-y-6">
                    {/* 総合成績 */}
                    <div className="bg-white rounded-lg border p-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">受験回数</p>
                          <p className="text-2xl font-bold text-gray-900">{testStats.testCount}回</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">最高点</p>
                          <p className="text-2xl font-bold text-gray-900">{testStats.highestScore}点</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">平均点</p>
                          <p className="text-2xl font-bold text-gray-900">{testStats.averageScore.toFixed(1)}点</p>
                        </div>
                      </div>
                    </div>

                    {/* 科目別成績 */}
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-medium mb-6">科目別成績</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* 基礎医学系 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-4 text-blue-600 border-b border-blue-100 pb-2">基礎医学系</h4>
                          <div className="space-y-4">
                            {[
                              { name: "医療概論", key: "medical_overview" },
                              { name: "衛生・公衆衛生学", key: "public_health" },
                              { name: "関係法規", key: "related_laws" },
                              { name: "解剖学", key: "anatomy" },
                              { name: "生理学", key: "physiology" },
                              { name: "病理学", key: "pathology" }
                            ].map((subject) => (
                              <div key={subject.key} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">{subject.name}</span>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      平均 {testStats.subjectStats?.[subject.key]?.average !== undefined ? testStats.subjectStats[subject.key].average.toFixed(1) : '-'}点
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-500">
                                      <span>最高: {testStats.subjectStats?.[subject.key]?.highest !== undefined ? testStats.subjectStats[subject.key].highest : '-'}点</span>
                                      <span>最低: {testStats.subjectStats?.[subject.key]?.lowest !== undefined ? testStats.subjectStats[subject.key].lowest : '-'}点</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 臨床医学系 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-4 text-green-600 border-b border-green-100 pb-2">臨床医学系</h4>
                          <div className="space-y-4">
                            {[
                              { name: "臨床医学総論", key: "clinical_medicine_overview" },
                              { name: "臨床医学各論", key: "clinical_medicine_detail" },
                              { name: "臨床医学各論（総合）", key: "clinical_medicine_detail_total" },
                              { name: "リハビリテーション医学", key: "rehabilitation" }
                            ].map((subject) => (
                              <div key={subject.key} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">{subject.name}</span>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      平均 {testStats.subjectStats?.[subject.key]?.average !== undefined ? testStats.subjectStats[subject.key].average.toFixed(1) : '-'}点
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-500">
                                      <span>最高: {testStats.subjectStats?.[subject.key]?.highest !== undefined ? testStats.subjectStats[subject.key].highest : '-'}点</span>
                                      <span>最低: {testStats.subjectStats?.[subject.key]?.lowest !== undefined ? testStats.subjectStats[subject.key].lowest : '-'}点</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 東洋医学系 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-4 text-purple-600 border-b border-purple-100 pb-2">東洋医学系</h4>
                          <div className="space-y-4">
                            {[
                              { name: "東洋医学概論", key: "oriental_medicine_overview" },
                              { name: "経絡経穴概論", key: "meridian_points" },
                              { name: "東洋医学臨床論", key: "oriental_medicine_clinical" },
                              { name: "東洋医学臨床論（総合）", key: "oriental_medicine_clinical_general" }
                            ].map((subject) => (
                              <div key={subject.key} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">{subject.name}</span>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      平均 {testStats.subjectStats?.[subject.key]?.average !== undefined ? testStats.subjectStats[subject.key].average.toFixed(1) : '-'}点
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-500">
                                      <span>最高: {testStats.subjectStats?.[subject.key]?.highest !== undefined ? testStats.subjectStats[subject.key].highest : '-'}点</span>
                                      <span>最低: {testStats.subjectStats?.[subject.key]?.lowest !== undefined ? testStats.subjectStats[subject.key].lowest : '-'}点</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 専門系 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-4 text-orange-600 border-b border-orange-100 pb-2">専門系</h4>
                          <div className="space-y-4">
                            {[
                              { name: "はり理論", key: "acupuncture_theory" },
                              { name: "きゅう理論", key: "moxibustion_theory" }
                            ].map((subject) => (
                              <div key={subject.key} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">{subject.name}</span>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      平均 {testStats.subjectStats?.[subject.key]?.average !== undefined ? testStats.subjectStats[subject.key].average.toFixed(1) : '-'}点
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-500">
                                      <span>最高: {testStats.subjectStats?.[subject.key]?.highest !== undefined ? testStats.subjectStats[subject.key].highest : '-'}点</span>
                                      <span>最低: {testStats.subjectStats?.[subject.key]?.lowest !== undefined ? testStats.subjectStats[subject.key].lowest : '-'}点</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <CharacterIcon size={64} />
                    </div>
                    <p className="text-gray-500">テスト結果がありません</p>
                    <div className="mt-4">
                      <Button asChild variant="outline">
                        <Link href="/tests">テスト一覧を見る</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {debugInfo && (
                  <div className="mt-6 border-t pt-4">
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium text-gray-700">デバッグ情報</summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded-md overflow-auto max-h-96">
                        <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
                      </div>
                    </details>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  成績状況
                </CardTitle>
                <CardDescription>模擬試験の成績推移と推奨アクション</CardDescription>
              </CardHeader>
              <CardContent>
                {testStats && testStats.testCount > 0 ? (
                  <div className="space-y-6">
                    {/* 成績推移グラフ */}
                    <div className="bg-white rounded-lg border p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">成績推移</h3>
                        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="表示する指標を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="total">総合得点率</SelectItem>
                            <SelectItem value="medical_overview">医療概論</SelectItem>
                            <SelectItem value="public_health">衛生・公衆衛生学</SelectItem>
                            <SelectItem value="anatomy">解剖学</SelectItem>
                            <SelectItem value="physiology">生理学</SelectItem>
                            <SelectItem value="pathology">病理学</SelectItem>
                            <SelectItem value="clinical_medicine_overview">臨床医学総論</SelectItem>
                            <SelectItem value="clinical_medicine_detail">臨床医学各論</SelectItem>
                            <SelectItem value="clinical_medicine_detail_total">臨床医学各論（総合）</SelectItem>
                            <SelectItem value="rehabilitation">リハビリテーション医学</SelectItem>
                            <SelectItem value="oriental_medicine_overview">東洋医学概論</SelectItem>
                            <SelectItem value="meridian_points">経絡経穴概論</SelectItem>
                            <SelectItem value="oriental_medicine_clinical">東洋医学臨床論</SelectItem>
                            <SelectItem value="oriental_medicine_clinical_general">東洋医学臨床論（総合）</SelectItem>
                            <SelectItem value="acupuncture_theory">はり理論</SelectItem>
                            <SelectItem value="moxibustion_theory">きゅう理論</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="h-[300px]">
                        {chartData && (
                          <Line
                            data={chartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  max: 100,
                                  title: {
                                    display: true,
                                    text: '得点率 (%)'
                                  }
                                },
                                x: {
                                  title: {
                                    display: true,
                                    text: '試験日'
                                  }
                                }
                              },
                              plugins: {
                                legend: {
                                  position: 'top' as const,
                                },
                              },
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">テスト結果がないため、成績状況を分析できません</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
