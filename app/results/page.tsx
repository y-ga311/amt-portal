"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { CharacterLoading } from "@/components/character-loading"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, AlertCircle, Database, Bug } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getStudentTestResults } from "@/app/actions/test-scores"
import useEmblaCarousel from 'embla-carousel-react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js"
import { Radar } from "react-chartjs-2"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface TestResult {
  test_name: string
  test_date: string
  totalScore: number
  totalQuestions: number
  rank?: number
  total_participants?: number
  anatomy: number
  physiology: number
  clinical_medicine_overview: number
  clinical_medicine_detail: number
  oriental_medicine_overview: number
  meridian_points: number
  oriental_medicine_clinical: number
  oriental_medicine_clinical_general: number
  medical_overview: number
  public_health: number
  related_laws: number
  pathology: number
  clinical_medicine_detail_total: number
  rehabilitation: number
  acupuncture_theory: number
  moxibustion_theory: number
  basicMedicineScore: number
  basicMedicineTotal: number
  clinicalMedicineScore: number
  clinicalMedicineTotal: number
  orientalMedicineScore: number
  orientalMedicineTotal: number
  acupunctureScore: number
  acupunctureTotal: number
  moxibustionScore: number
  moxibustionTotal: number
  acupunctureTotalScore: number
  acupunctureTotalQuestions: number
  moxibustionTotalScore: number
  moxibustionTotalQuestions: number
  criteria?: {
    passing: {
      anatomy: number
      physiology: number
      clinical_medicine_overview: number
      clinical_medicine_detail: number
      oriental_medicine_overview: number
      meridian_points: number
      oriental_medicine_clinical: number
      oriental_medicine_clinical_general: number
    }
  }
  question_counts: {
    anatomy: number
    physiology: number
    clinical_medicine_overview: number
    clinical_medicine_detail: number
    oriental_medicine_overview: number
    meridian_points: number
    oriental_medicine_clinical: number
    oriental_medicine_clinical_general: number
    medical_overview: number
    public_health: number
    related_laws: number
    pathology: number
    clinical_medicine_detail_total: number
    rehabilitation: number
    acupuncture_theory: number
    moxibustion_theory: number
  }
}

export default function ResultsPage() {
  const [emblaRef, emblaApi] = useEmblaCarousel()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [testResults, setTestResults] = useState<any[]>([])
  const [filteredResults, setFilteredResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const testParam = searchParams.get("test")
  
  const supabase = createClientComponentClient()

  // データベース接続の確認
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('students').select('count').limit(1)
        console.log("データベース接続状態:", { success: !error, error })
      } catch (error) {
        console.error("データベース接続エラー:", error)
      }
    }
    checkConnection()
  }, [])

  const onSelect = () => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
  }, [emblaApi])

  useEffect(() => {
    // セッションストレージからユーザー情報を取得
    const userInfoStr = sessionStorage.getItem('user')
    if (!userInfoStr) {
      console.error('セッションストレージからユーザー情報を取得できません')
      router.push('/login')
      return
    }

    const userInfo = JSON.parse(userInfoStr)
    console.log('セッションストレージから取得したユーザー情報:', userInfo)

    // 学生情報の設定
    if (userInfo.name) {
      setStudentName(userInfo.name)
    }

    // studentsテーブルからidを取得
    const fetchStudentInfo = async () => {
      try {
        console.log("検索開始 - 学生ID:", userInfo.id)
        let foundStudentId = null

        // idカラムで直接検索
        const { data: students, error: studentError } = await supabase
          .from("students")
          .select("id, name")
          .eq("id", userInfo.id)
          .single()

        if (studentError) {
          console.error("学生情報取得エラー詳細:", {
            error: studentError,
            message: studentError.message,
            details: studentError.details,
            hint: studentError.hint
          })
          throw new Error("学生情報の取得に失敗しました")
        }

        if (!students) {
          console.log("学生が見つかりません - ID:", userInfo.id)
          throw new Error("学生が見つかりません")
        }

        console.log("学生情報取得成功:", {
          id: students.id,
          name: students.name
          })
        foundStudentId = students.id
        setStudentName(students.name)

        // 学生IDを設定
        setStudentId(foundStudentId)

        // テスト結果を取得
        if (foundStudentId) {
          console.log("テスト結果検索開始 - student_id =", foundStudentId)
          const { data: testScores, error: testScoresError } = await supabase
            .from("test_scores")
            .select("*")
            .eq("student_id", foundStudentId)
            .order("test_date", { ascending: false })

          if (testScoresError) {
            console.error("テスト結果取得エラー詳細:", {
              error: testScoresError,
              message: testScoresError.message,
              details: testScoresError.details,
              hint: testScoresError.hint
            })
            throw new Error("テスト結果の取得に失敗しました")
          }

          if (!testScores || testScores.length === 0) {
            console.log("テスト結果が見つかりません - 学生ID:", foundStudentId)
            setTestResults([])
            setError("テスト結果が見つかりませんでした")
            return
          }

          // 問題数データを取得
          const testNames = testScores.map(score => score.test_name)
          console.log("問題数データ検索 - テスト名:", testNames)
          
          const { data: questionCounts, error: questionCountsError } = await supabase
            .from("question_counts")
            .select("*")
            .in("test_name", testNames)

          if (questionCountsError) {
            console.error("問題数データ取得エラー:", questionCountsError)
            // エラーが発生しても処理を続行
          }

          // テスト結果と問題数データをマージし、小計を計算
          const processedTestScores = testScores.map(score => {
            const questionCount = questionCounts?.find(q => q.test_name === score.test_name)
            const result = {
              ...score,
              question_counts: questionCount || {}
            }

            // 基礎医学系の小計
            const basicMedicineScore = (
              (result.medical_overview || 0) +
              (result.public_health || 0) +
              (result.related_laws || 0) +
              (result.anatomy || 0) +
              (result.physiology || 0) +
              (result.pathology || 0)
            )
            const basicMedicineTotal = (
              (result.question_counts.medical_overview || 0) +
              (result.question_counts.public_health || 0) +
              (result.question_counts.related_laws || 0) +
              (result.question_counts.anatomy || 0) +
              (result.question_counts.physiology || 0) +
              (result.question_counts.pathology || 0)
            )

            // 臨床医学系の小計
            const clinicalMedicineScore = (
              (result.clinical_medicine_overview || 0) +
              (result.clinical_medicine_detail || 0) +
              (result.clinical_medicine_detail_total || 0) +
              (result.rehabilitation || 0)
            )
            const clinicalMedicineTotal = (
              (result.question_counts.clinical_medicine_overview || 0) +
              (result.question_counts.clinical_medicine_detail || 0) +
              (result.question_counts.clinical_medicine_detail_total || 0) +
              (result.question_counts.rehabilitation || 0)
            )

            // 東洋医学系の小計
            const orientalMedicineScore = (
              (result.oriental_medicine_overview || 0) +
              (result.meridian_points || 0) +
              (result.oriental_medicine_clinical || 0) +
              (result.oriental_medicine_clinical_general || 0)
            )
            const orientalMedicineTotal = (
              (result.question_counts.oriental_medicine_overview || 0) +
              (result.question_counts.meridian_points || 0) +
              (result.question_counts.oriental_medicine_clinical || 0) +
              (result.question_counts.oriental_medicine_clinical_general || 0)
            )

            // 専門系の小計
            const acupunctureScore = (result.acupuncture_theory || 0)
            const acupunctureTotal = (result.question_counts.acupuncture_theory || 0)
            const moxibustionScore = (result.moxibustion_theory || 0)
            const moxibustionTotal = (result.question_counts.moxibustion_theory || 0)

            // はり師合格判定の計算
            const acupunctureTotalScore = basicMedicineScore + clinicalMedicineScore + orientalMedicineScore + acupunctureScore
            const acupunctureTotalQuestions = basicMedicineTotal + clinicalMedicineTotal + orientalMedicineTotal + acupunctureTotal

            // きゅう師合格判定の計算
            const moxibustionTotalScore = basicMedicineScore + clinicalMedicineScore + orientalMedicineScore + moxibustionScore
            const moxibustionTotalQuestions = basicMedicineTotal + clinicalMedicineTotal + orientalMedicineTotal + moxibustionTotal

            return {
              ...result,
              basicMedicineScore,
              basicMedicineTotal,
              clinicalMedicineScore,
              clinicalMedicineTotal,
              orientalMedicineScore,
              orientalMedicineTotal,
              acupunctureScore,
              acupunctureTotal,
              moxibustionScore,
              moxibustionTotal,
              acupunctureTotalScore,
              acupunctureTotalQuestions,
              moxibustionTotalScore,
              moxibustionTotalQuestions
            }
          })

          console.log("テスト結果取得成功:", {
            件数: processedTestScores.length,
            最初のテスト: processedTestScores[0]?.test_name,
            最後のテスト: processedTestScores[processedTestScores.length - 1]?.test_name,
            問題数データ: processedTestScores[0]?.question_counts
          })
          setTestResults(processedTestScores)
          setFilteredResults(processedTestScores)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("学生情報取得エラー:", error)
        setError(error instanceof Error ? error.message : "学生情報の取得に失敗しました")
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    fetchStudentInfo()
  }, [router, supabase])

  // テスト結果のフィルタリング
  useEffect(() => {
    if (testResults.length > 0 && testParam) {
      console.log("テスト結果フィルタリング:", testParam)
      const filtered = testResults.filter((result) => result.test_name === testParam)
      console.log("フィルタリング後の結果数:", filtered.length)
      setFilteredResults(filtered)
    } else {
      setFilteredResults(testResults)
    }
  }, [testResults, testParam])

  const runDebugQuery = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/debug-query?studentId=${encodeURIComponent(studentId)}`)
      const data = await response.json()
      setDebugInfo(data)

      if (data.success && data.results && data.results.length > 0) {
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

  const calculateScore = (score: number | null | undefined, total: number | null | undefined) => {
    if (score === null || score === undefined || total === null || total === undefined || total === 0) {
      return null
    }
    return Math.round((score / total) * 100)
  }

  const calculateSubtotal = (result: TestResult) => {
    // 基礎医学系の小計
    const basicMedicineScore = (
      (result.medical_overview || 0) +
      (result.public_health || 0) +
      (result.related_laws || 0) +
      (result.anatomy || 0) +
      (result.physiology || 0) +
      (result.pathology || 0)
    )
    const basicMedicineTotal = (
      (result.question_counts.medical_overview || 0) +
      (result.question_counts.public_health || 0) +
      (result.question_counts.related_laws || 0) +
      (result.question_counts.anatomy || 0) +
      (result.question_counts.physiology || 0) +
      (result.question_counts.pathology || 0)
    )

    // 臨床医学系の小計
    const clinicalMedicineScore = (
      (result.clinical_medicine_overview || 0) +
      (result.clinical_medicine_detail || 0) +
      (result.clinical_medicine_detail_total || 0) +
      (result.rehabilitation || 0)
    )
    const clinicalMedicineTotal = (
      (result.question_counts.clinical_medicine_overview || 0) +
      (result.question_counts.clinical_medicine_detail || 0) +
      (result.question_counts.clinical_medicine_detail_total || 0) +
      (result.question_counts.rehabilitation || 0)
    )

    // 東洋医学系の小計
    const orientalMedicineScore = (
      (result.oriental_medicine_overview || 0) +
      (result.meridian_points || 0) +
      (result.oriental_medicine_clinical || 0) +
      (result.oriental_medicine_clinical_general || 0)
    )
    const orientalMedicineTotal = (
      (result.question_counts.oriental_medicine_overview || 0) +
      (result.question_counts.meridian_points || 0) +
      (result.question_counts.oriental_medicine_clinical || 0) +
      (result.question_counts.oriental_medicine_clinical_general || 0)
    )

    // 専門系の小計
    const acupunctureScore = (result.acupuncture_theory || 0)
    const acupunctureTotal = (result.question_counts.acupuncture_theory || 0)
    const moxibustionScore = (result.moxibustion_theory || 0)
    const moxibustionTotal = (result.question_counts.moxibustion_theory || 0)

    // はり師合格判定の計算
    const acupunctureTotalScore = basicMedicineScore + clinicalMedicineScore + orientalMedicineScore + acupunctureScore
    const acupunctureTotalQuestions = basicMedicineTotal + clinicalMedicineTotal + orientalMedicineTotal + acupunctureTotal

    // きゅう師合格判定の計算
    const moxibustionTotalScore = basicMedicineScore + clinicalMedicineScore + orientalMedicineScore + moxibustionScore
    const moxibustionTotalQuestions = basicMedicineTotal + clinicalMedicineTotal + orientalMedicineTotal + moxibustionTotal

    // 結果を更新
    result.basicMedicineScore = basicMedicineScore
    result.basicMedicineTotal = basicMedicineTotal
    result.clinicalMedicineScore = clinicalMedicineScore
    result.clinicalMedicineTotal = clinicalMedicineTotal
    result.orientalMedicineScore = orientalMedicineScore
    result.orientalMedicineTotal = orientalMedicineTotal
    result.acupunctureScore = acupunctureScore
    result.acupunctureTotal = acupunctureTotal
    result.moxibustionScore = moxibustionScore
    result.moxibustionTotal = moxibustionTotal
    result.acupunctureTotalScore = acupunctureTotalScore
    result.acupunctureTotalQuestions = acupunctureTotalQuestions
    result.moxibustionTotalScore = moxibustionTotalScore
    result.moxibustionTotalQuestions = moxibustionTotalQuestions

    return result
  }

  const isPassing = (result: TestResult) => {
    if (!result.criteria?.passing) return {
      anatomy: false,
      physiology: false,
      clinical_medicine_overview: false,
      clinical_medicine_detail: false,
      oriental_medicine_overview: false,
      meridian_points: false,
      oriental_medicine_clinical: false
    }

    const passing = result.criteria.passing
    const questionCounts = result.question_counts

    // 各科目の得点率を計算
    const scores = {
      medical_overview: calculateScore(result.medical_overview, questionCounts.medical_overview),
      public_health: calculateScore(result.public_health, questionCounts.public_health),
      related_laws: calculateScore(result.related_laws, questionCounts.related_laws),
      anatomy: calculateScore(result.anatomy, questionCounts.anatomy),
      physiology: calculateScore(result.physiology, questionCounts.physiology),
      pathology: calculateScore(result.pathology, questionCounts.pathology),
      clinical_medicine_overview: calculateScore(result.clinical_medicine_overview, questionCounts.clinical_medicine_overview),
      clinical_medicine_detail: calculateScore(result.clinical_medicine_detail, questionCounts.clinical_medicine_detail),
      clinical_medicine_detail_total: calculateScore(result.clinical_medicine_detail_total, questionCounts.clinical_medicine_detail_total),
      rehabilitation: calculateScore(result.rehabilitation, questionCounts.rehabilitation),
      oriental_medicine_overview: calculateScore(result.oriental_medicine_overview, questionCounts.oriental_medicine_overview),
      meridian_points: calculateScore(result.meridian_points, questionCounts.meridian_points),
      oriental_medicine_clinical: calculateScore(result.oriental_medicine_clinical, questionCounts.oriental_medicine_clinical),
      oriental_medicine_clinical_general: calculateScore(result.oriental_medicine_clinical_general, questionCounts.oriental_medicine_clinical_general),
      acupuncture_theory: calculateScore(result.acupuncture_theory, questionCounts.acupuncture_theory),
      moxibustion_theory: calculateScore(result.moxibustion_theory, questionCounts.moxibustion_theory)
    }

    // 各科目の基準値を計算
    const criteria = {
      anatomy: calculateScore(passing.anatomy, questionCounts.anatomy),
      physiology: calculateScore(passing.physiology, questionCounts.physiology),
      clinical_medicine_overview: calculateScore(passing.clinical_medicine_overview, questionCounts.clinical_medicine_overview),
      clinical_medicine_detail: calculateScore(passing.clinical_medicine_detail, questionCounts.clinical_medicine_detail),
      oriental_medicine_overview: calculateScore(passing.oriental_medicine_overview, questionCounts.oriental_medicine_overview),
      meridian_points: calculateScore(passing.meridian_points, questionCounts.meridian_points),
      oriental_medicine_clinical: calculateScore(passing.oriental_medicine_clinical, questionCounts.oriental_medicine_clinical),
      oriental_medicine_clinical_general: calculateScore(passing.oriental_medicine_clinical_general, questionCounts.oriental_medicine_clinical_general)
    }

    // 各科目が基準値を超えているかチェック
    const isPassingSubject = (score: number | null | undefined, criterion: number | null | undefined) => {
      if (score === null || score === undefined || criterion === null || criterion === undefined) {
        return false
      }
      return score >= criterion
    }

    return {
      anatomy: isPassingSubject(scores.anatomy, criteria.anatomy),
      physiology: isPassingSubject(scores.physiology, criteria.physiology),
      clinical_medicine_overview: isPassingSubject(scores.clinical_medicine_overview, criteria.clinical_medicine_overview),
      clinical_medicine_detail: isPassingSubject(scores.clinical_medicine_detail, criteria.clinical_medicine_detail),
      oriental_medicine_overview: isPassingSubject(scores.oriental_medicine_overview, criteria.oriental_medicine_overview),
      meridian_points: isPassingSubject(scores.meridian_points, criteria.meridian_points),
      oriental_medicine_clinical: isPassingSubject(scores.oriental_medicine_clinical, criteria.oriental_medicine_clinical)
    }
  }

  const getChartData = (result: TestResult) => {
    if (!result.question_counts) {
      console.log('question_countsが存在しません:', result)
      return null
    }

    const questionCounts = result.question_counts

    console.log('レーダーチャート用データ:', {
      questionCounts,
      result
    })

    // 各科目の得点率を計算
    const scores = {
      medical_overview: calculateScore(result.medical_overview, questionCounts.medical_overview),
      public_health: calculateScore(result.public_health, questionCounts.public_health),
      related_laws: calculateScore(result.related_laws, questionCounts.related_laws),
      anatomy: calculateScore(result.anatomy, questionCounts.anatomy),
      physiology: calculateScore(result.physiology, questionCounts.physiology),
      pathology: calculateScore(result.pathology, questionCounts.pathology),
      clinical_medicine_overview: calculateScore(result.clinical_medicine_overview, questionCounts.clinical_medicine_overview),
      clinical_medicine_detail: calculateScore(result.clinical_medicine_detail, questionCounts.clinical_medicine_detail),
      clinical_medicine_detail_total: calculateScore(result.clinical_medicine_detail_total, questionCounts.clinical_medicine_detail_total),
      rehabilitation: calculateScore(result.rehabilitation, questionCounts.rehabilitation),
      oriental_medicine_overview: calculateScore(result.oriental_medicine_overview, questionCounts.oriental_medicine_overview),
      meridian_points: calculateScore(result.meridian_points, questionCounts.meridian_points),
      oriental_medicine_clinical: calculateScore(result.oriental_medicine_clinical, questionCounts.oriental_medicine_clinical),
      oriental_medicine_clinical_general: calculateScore(result.oriental_medicine_clinical_general, questionCounts.oriental_medicine_clinical_general),
      acupuncture_theory: calculateScore(result.acupuncture_theory, questionCounts.acupuncture_theory),
      moxibustion_theory: calculateScore(result.moxibustion_theory, questionCounts.moxibustion_theory)
    }

    console.log('計算された得点率:', scores)

    // 値がある科目のみを抽出（null、undefined、NaNを除外）
    const validSubjects = Object.entries(scores).filter(([_, score]) => {
      return score !== null && score !== undefined && !isNaN(score) && score >= 0
    })

    const labels = validSubjects.map(([key]) => {
      const labelMap: { [key: string]: string } = {
        anatomy: '解剖学',
        physiology: '生理学',
        clinical_medicine_overview: '臨床医学概論',
        clinical_medicine_detail: '臨床医学各論',
        oriental_medicine_overview: '東洋医学概論',
        meridian_points: '経絡経穴概論',
        oriental_medicine_clinical: '東洋医学臨床論',
        oriental_medicine_clinical_general: '東洋医学臨床論（総合）',
        medical_overview: '医療概論',
        public_health: '衛生学・公衆衛生学',
        related_laws: '関係法規',
        pathology: '病理学',
        clinical_medicine_detail_total: '臨床医学各論（総合）',
        rehabilitation: 'リハビリテーション医学',
        acupuncture_theory: 'はり理論',
        moxibustion_theory: 'きゅう理論'
      }
      return labelMap[key] || key
    })

    const chartData = {
      labels,
        datasets: [
          {
            label: '得点率',
          data: validSubjects.map(([_, score]) => score),
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2
        },
        {
          label: '合格基準（60%）',
          data: Array(validSubjects.length).fill(60),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          borderDash: [5, 5]
        },
        {
          label: '不合格基準（40%）',
          data: Array(validSubjects.length).fill(40),
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          borderDash: [5, 5]
        }
      ]
    }

    console.log('最終的なチャートデータ:', chartData)
    return chartData
  }

  const chartOptions = {
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const
      }
    }
  }

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true)
        const response = await getStudentTestResults(studentId)
        console.log('取得したテスト結果:', response)

        if (!response.success || !response.data) {
          throw new Error(response.error || 'テスト結果の取得に失敗しました')
        }

        // 各テスト結果に小計を計算
        const resultsWithSubtotals = response.data.map((result: TestResult) => {
          // 基礎医学系の小計
          const basicMedicineScore = (
            (result.medical_overview || 0) +
            (result.public_health || 0) +
            (result.related_laws || 0) +
            (result.anatomy || 0) +
            (result.physiology || 0) +
            (result.pathology || 0)
          )
          const basicMedicineTotal = (
            (result.question_counts.medical_overview || 0) +
            (result.question_counts.public_health || 0) +
            (result.question_counts.related_laws || 0) +
            (result.question_counts.anatomy || 0) +
            (result.question_counts.physiology || 0) +
            (result.question_counts.pathology || 0)
          )

          // 臨床医学系の小計
          const clinicalMedicineScore = (
            (result.clinical_medicine_overview || 0) +
            (result.clinical_medicine_detail || 0) +
            (result.clinical_medicine_detail_total || 0) +
            (result.rehabilitation || 0)
          )
          const clinicalMedicineTotal = (
            (result.question_counts.clinical_medicine_overview || 0) +
            (result.question_counts.clinical_medicine_detail || 0) +
            (result.question_counts.clinical_medicine_detail_total || 0) +
            (result.question_counts.rehabilitation || 0)
          )

          // 東洋医学系の小計
          const orientalMedicineScore = (
            (result.oriental_medicine_overview || 0) +
            (result.meridian_points || 0) +
            (result.oriental_medicine_clinical || 0) +
            (result.oriental_medicine_clinical_general || 0)
          )
          const orientalMedicineTotal = (
            (result.question_counts.oriental_medicine_overview || 0) +
            (result.question_counts.meridian_points || 0) +
            (result.question_counts.oriental_medicine_clinical || 0) +
            (result.question_counts.oriental_medicine_clinical_general || 0)
          )

          // 専門系の小計
          const acupunctureScore = (result.acupuncture_theory || 0)
          const acupunctureTotal = (result.question_counts.acupuncture_theory || 0)
          const moxibustionScore = (result.moxibustion_theory || 0)
          const moxibustionTotal = (result.question_counts.moxibustion_theory || 0)

          // はり師合格判定の計算
          const acupunctureTotalScore = basicMedicineScore + clinicalMedicineScore + orientalMedicineScore + acupunctureScore
          const acupunctureTotalQuestions = basicMedicineTotal + clinicalMedicineTotal + orientalMedicineTotal + acupunctureTotal

          // きゅう師合格判定の計算
          const moxibustionTotalScore = basicMedicineScore + clinicalMedicineScore + orientalMedicineScore + moxibustionScore
          const moxibustionTotalQuestions = basicMedicineTotal + clinicalMedicineTotal + orientalMedicineTotal + moxibustionTotal

          return {
            ...result,
            basicMedicineScore,
            basicMedicineTotal,
            clinicalMedicineScore,
            clinicalMedicineTotal,
            orientalMedicineScore,
            orientalMedicineTotal,
            acupunctureScore,
            acupunctureTotal,
            moxibustionScore,
            moxibustionTotal,
            acupunctureTotalScore,
            acupunctureTotalQuestions,
            moxibustionTotalScore,
            moxibustionTotalQuestions
          }
        })

        setTestResults(resultsWithSubtotals)
        setFilteredResults(resultsWithSubtotals)
        setIsLoading(false)
      } catch (error) {
        console.error('テスト結果の取得に失敗:', error)
        setError('テスト結果の取得に失敗しました')
        setIsLoading(false)
      }
    }

    if (studentId) {
      fetchResults()
    }
  }, [studentId])

  if (isLoading) {
    return <CharacterLoading message="テスト結果を読み込んでいます..." />
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard?studentId=${studentId}&studentName=${studentName}`} className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              ダッシュボードに戻る
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center gap-3">
            <CharacterIcon size={40} />
            <div>
              <CardTitle>{testParam ? `${testParam}の結果` : `${studentName || studentId}さん`}</CardTitle>
              <CardDescription>
                {testParam ? "選択したテストの詳細結果" : "受験した模擬試験の結果一覧"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-red-800">{error}</p>
                    <p className="text-sm text-red-600 mt-2">
                      ログインID: {studentId} でテスト結果を検索しましたが、結果が見つかりませんでした。
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/debug/student/${studentId}`} className="flex items-center">
                          <Database className="mr-1 h-4 w-4" />
                          データベースを確認する
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

            {filteredResults.length > 0 ? (
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => emblaApi?.scrollPrev()}
                    disabled={selectedIndex === 0}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    前の試験
                  </Button>
                  <div className="text-sm text-gray-500">
                    {selectedIndex + 1} / {filteredResults.length}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => emblaApi?.scrollNext()}
                    disabled={selectedIndex === filteredResults.length - 1}
                    className="flex items-center gap-2"
                  >
                    次の試験
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {filteredResults.map((result, index) => {
                return (
                        <div key={index} className="flex-[0_0_100%] min-w-0">
                          <Card className="overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{result.test_name}</CardTitle>
                          <CardDescription>実施日: {result.test_date}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">総合得点</h3>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xl font-bold">
                                      {result.basicMedicineScore + result.clinicalMedicineScore + result.orientalMedicineScore + result.acupunctureScore + result.moxibustionScore}点/{result.basicMedicineTotal + result.clinicalMedicineTotal + result.orientalMedicineTotal + result.acupunctureTotal + result.moxibustionTotal}問中
                                    </p>
                                    {result.rank && result.total_participants && (
                                      <span className="text-sm text-gray-600">
                                        （{result.rank}位 / {result.total_participants}人中）
                                      </span>
                                    )}
                                  </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border p-3 rounded-md">
                            <h4 className="text-sm font-medium mb-2 bg-blue-600 text-white px-2 py-1 rounded">基礎医学系</h4>
                            <div className="space-y-1 text-sm">
                              {result.question_counts?.medical_overview && result.question_counts.medical_overview > 0 && (
                                <div className="flex justify-between">
                                  <span>医療概論</span>
                                  <span>{result.medical_overview !== null ? `${result.medical_overview}/${result.question_counts.medical_overview}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.public_health && result.question_counts.public_health > 0 && (
                                <div className="flex justify-between">
                                  <span>衛生学・公衆衛生学</span>
                                  <span>{result.public_health !== null ? `${result.public_health}/${result.question_counts.public_health}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.related_laws && result.question_counts.related_laws > 0 && (
                                <div className="flex justify-between">
                                  <span>関係法規</span>
                                  <span>{result.related_laws !== null ? `${result.related_laws}/${result.question_counts.related_laws}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.anatomy && result.question_counts.anatomy > 0 && (
                                <div className="flex justify-between">
                                  <span>解剖学</span>
                                  <span>{result.anatomy !== null ? `${result.anatomy}/${result.question_counts.anatomy}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.physiology && result.question_counts.physiology > 0 && (
                                <div className="flex justify-between">
                                  <span>生理学</span>
                                  <span>{result.physiology !== null ? `${result.physiology}/${result.question_counts.physiology}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.pathology && result.question_counts.pathology > 0 && (
                                <div className="flex justify-between">
                                  <span>病理学</span>
                                  <span>{result.pathology !== null ? `${result.pathology}/${result.question_counts.pathology}点` : "-"}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-medium pt-1 border-t">
                                <span>小計</span>
                                <span>{result.basicMedicineScore}点/{result.basicMedicineTotal}問中</span>
                              </div>
                            </div>
                          </div>

                          <div className="border p-3 rounded-md">
                            <h4 className="text-sm font-medium mb-2 bg-green-600 text-white px-2 py-1 rounded">臨床医学系</h4>
                            <div className="space-y-1 text-sm">
                              {result.question_counts?.clinical_medicine_overview && result.question_counts.clinical_medicine_overview > 0 && (
                                <div className="flex justify-between">
                                  <span>臨床医学総論</span>
                                  <span>{result.clinical_medicine_overview !== null ? `${result.clinical_medicine_overview}/${result.question_counts.clinical_medicine_overview}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.clinical_medicine_detail && result.question_counts.clinical_medicine_detail > 0 && (
                                <div className="flex justify-between">
                                  <span>臨床医学各論</span>
                                  <span>{result.clinical_medicine_detail !== null ? `${result.clinical_medicine_detail}/${result.question_counts.clinical_medicine_detail}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.clinical_medicine_detail_total && result.question_counts.clinical_medicine_detail_total > 0 && (
                                <div className="flex justify-between">
                                  <span>臨床医学各論（総合）</span>
                                  <span>{result.clinical_medicine_detail_total !== null ? `${result.clinical_medicine_detail_total}/${result.question_counts.clinical_medicine_detail_total}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.rehabilitation && result.question_counts.rehabilitation > 0 && (
                                <div className="flex justify-between">
                                  <span>リハビリテーション医学</span>
                                  <span>{result.rehabilitation !== null ? `${result.rehabilitation}/${result.question_counts.rehabilitation}点` : "-"}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-medium pt-1 border-t">
                                <span>小計</span>
                                <span>{result.clinicalMedicineScore}点/{result.clinicalMedicineTotal}問中</span>
                              </div>
                            </div>
                          </div>

                          <div className="border p-3 rounded-md">
                            <h4 className="text-sm font-medium mb-2 bg-purple-600 text-white px-2 py-1 rounded">東洋医学系</h4>
                            <div className="space-y-1 text-sm">
                              {result.question_counts?.oriental_medicine_overview && result.question_counts.oriental_medicine_overview > 0 && (
                                <div className="flex justify-between">
                                  <span>東洋医学概論</span>
                                  <span>{result.oriental_medicine_overview !== null ? `${result.oriental_medicine_overview}/${result.question_counts.oriental_medicine_overview}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.meridian_points && result.question_counts.meridian_points > 0 && (
                                <div className="flex justify-between">
                                  <span>経絡経穴概論</span>
                                  <span>{result.meridian_points !== null ? `${result.meridian_points}/${result.question_counts.meridian_points}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.oriental_medicine_clinical && result.question_counts.oriental_medicine_clinical > 0 && (
                                <div className="flex justify-between">
                                  <span>東洋医学臨床論</span>
                                  <span>{result.oriental_medicine_clinical !== null ? `${result.oriental_medicine_clinical}/${result.question_counts.oriental_medicine_clinical}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.oriental_medicine_clinical_general && result.question_counts.oriental_medicine_clinical_general > 0 && (
                                <div className="flex justify-between">
                                  <span>東洋医学臨床論（総合）</span>
                                  <span>{result.oriental_medicine_clinical_general !== null ? `${result.oriental_medicine_clinical_general}/${result.question_counts.oriental_medicine_clinical_general}点` : "-"}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-medium pt-1 border-t">
                                <span>小計</span>
                                <span>{result.orientalMedicineScore}点/{result.orientalMedicineTotal}問中</span>
                              </div>
                            </div>
                          </div>

                          <div className="border p-3 rounded-md">
                            <h4 className="text-sm font-medium mb-2 bg-orange-600 text-white px-2 py-1 rounded">専門系</h4>
                            <div className="space-y-1 text-sm">
                              {result.question_counts?.acupuncture_theory && result.question_counts.acupuncture_theory > 0 && (
                                <div className="flex justify-between">
                                  <span>はり理論</span>
                                  <span>{result.acupuncture_theory !== null ? `${result.acupuncture_theory}/${result.question_counts.acupuncture_theory}点` : "-"}</span>
                                </div>
                              )}
                              {result.question_counts?.moxibustion_theory && result.question_counts.moxibustion_theory > 0 && (
                                <div className="flex justify-between">
                                  <span>きゅう理論</span>
                                  <span>{result.moxibustion_theory !== null ? `${result.moxibustion_theory}/${result.question_counts.moxibustion_theory}点` : "-"}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-medium pt-1 border-t">
                                <span>小計</span>
                                <span>{result.acupunctureScore + result.moxibustionScore}点</span>
                              </div>
                            </div>
                          </div>
                        </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <Card className={result.acupunctureTotalScore >= Math.ceil(result.acupunctureTotalQuestions * 0.6) ? "bg-green-100" : "bg-red-100"}>
                                    <CardHeader>
                                      <CardTitle>はり師合格判定</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold">
                                        {result.acupunctureTotalScore} / {result.acupunctureTotalQuestions} 点
                              </div>
                                      <div className="text-sm text-gray-500">
                                        合格基準: {Math.ceil(result.acupunctureTotalQuestions * 0.6)}点以上（60%）
                            </div>
                                      <div className={`mt-2 text-sm ${result.acupunctureTotalScore >= Math.ceil(result.acupunctureTotalQuestions * 0.6) ? 'text-green-600' : 'text-red-600'}`}>
                                        {result.acupunctureTotalScore >= Math.ceil(result.acupunctureTotalQuestions * 0.6) ? '合格' : '不合格'}
                          </div>
                                    </CardContent>
                                  </Card>

                                  <Card className={result.moxibustionTotalScore >= Math.ceil(result.moxibustionTotalQuestions * 0.6) ? "bg-green-100" : "bg-red-100"}>
                                    <CardHeader>
                                      <CardTitle>きゅう師合格判定</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold">
                                        {result.moxibustionTotalScore} / {result.moxibustionTotalQuestions} 点
                              </div>
                                      <div className="text-sm text-gray-500">
                                        合格基準: {Math.ceil(result.moxibustionTotalQuestions * 0.6)}点以上（60%）
                            </div>
                                      <div className={`mt-2 text-sm ${result.moxibustionTotalScore >= Math.ceil(result.moxibustionTotalQuestions * 0.6) ? 'text-green-600' : 'text-red-600'}`}>
                                        {result.moxibustionTotalScore >= Math.ceil(result.moxibustionTotalQuestions * 0.6) ? '合格' : '不合格'}
                          </div>
                                    </CardContent>
                                  </Card>
                        </div>

                        <div className="mt-8">
                          <h3 className="text-lg font-bold mb-4">科目別得点率</h3>
                          <div className="bg-white p-4 rounded-lg shadow">
                            <div className="h-[500px] md:h-[600px] lg:h-[700px]">
                                      {result.question_counts && (
                                <Radar
                                          data={getChartData(result)!}
                                  options={chartOptions}
                                />
                              )}
                            </div>
                              </div>
                        </div>




                      </div>
                    </CardContent>
                  </Card>
                        </div>
                )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <CharacterIcon size={64} />
                </div>
                <p className="text-gray-500">テスト結果がありません</p>
                <p className="text-sm text-gray-400 mt-2">学生ID: {studentId}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/debug/student/${studentId}`} className="flex items-center">
                      <Database className="mr-1 h-4 w-4" />
                      データベースを確認する
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={runDebugQuery} className="flex items-center">
                    <Bug className="mr-1 h-4 w-4" />
                    デバッグクエリを実行
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
      </div>
    </main>
  )
}
