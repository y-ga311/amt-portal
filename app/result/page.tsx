"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Radar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js"
import { getTestResults } from "@/app/actions/test-results"
import { getTestCriteriaList } from "@/app/actions/criteria"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

type TestResult = {
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
    [key: string]: number | null
  }
  rank: number
  total_participants: number
  criteria?: {
    passing?: boolean
    failing?: boolean
  }
  [key: string]: any // 動的なキーアクセスを許可
}

interface CriteriaData {
  passing: any
  failing: any
}

export default function ResultPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      try {
        // セッションストレージからユーザー情報を取得
        const userInfoStr = sessionStorage.getItem('user')
        if (!userInfoStr) {
          console.error('セッションストレージからユーザー情報を取得できません')
          redirect('/login')
          return
        }

        const userInfo = JSON.parse(userInfoStr)
        console.log('セッションストレージから取得したユーザー情報:', userInfo)

        // ローカルストレージから情報を取得
        const storedInfo = {
          studentId: localStorage.getItem('studentId'),
          userType: localStorage.getItem('userType')
        }
        console.log('ローカルストレージから取得した情報:', storedInfo)

        let studentId: string | null = null

        // 学生ログインの場合
        if (userInfo.type === 'student') {
          studentId = userInfo.id.toString()
        }
        // 保護者ログインの場合
        else if (userInfo.type === 'parent') {
          // 保護者IDで学生情報を取得
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id')
            .eq('hogosya_id', `S${storedInfo.studentId}`)
            .single()

          if (studentError || !studentData) {
            console.error('学生情報取得エラー:', studentError)
            redirect('/login')
            return
          }

          studentId = studentData.id.toString()
        }

        if (!studentId) {
          console.error('学生IDが取得できません')
          redirect('/login')
          return
        }

        console.log('テストスコア取得開始:', { studentId })

        // テスト結果を取得
        const { data: results = [] } = await supabase
          .from('test_scores')
          .select('*')
          .eq('student_id', studentId)
          .order('test_date', { ascending: false })

        console.log('取得したテスト結果:', results)

        if (!results || results.length === 0) {
          setTestResults([])
          return
        }

        // 問題数データを取得
        const testNames = results.map((r: TestResult) => r.test_name)
        console.log('取得する問題数のテスト名:', testNames)

        const { data: questionCounts } = await supabase
          .from('question_counts')
          .select('*')
          .in('test_name', testNames)

        console.log('取得した問題数データ:', questionCounts)

        // 基準値データを一括取得
        console.log('基準値データの一括取得を開始します')
        const testNamesForCriteria = results.map((r: TestResult) => r.test_name)
        console.log('取得するテスト名:', testNamesForCriteria)

        // 基準値データを直接取得
        console.log('基準値データ取得開始:', {
          testNames: testNamesForCriteria,
          query: `
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
          `
        })

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
          .in('test_name', testNamesForCriteria)
          .order('test_name', { ascending: true })
          .order('criteria_type', { ascending: true })

        console.log('基準値データの取得結果:', {
          success: !criteriaError,
          error: criteriaError,
          dataCount: criteriaData?.length || 0,
          data: criteriaData,
          testNames: testNamesForCriteria
        })

        if (criteriaError) {
          console.error('基準値データの取得に失敗しました:', criteriaError)
          setError('基準値データの取得に失敗しました')
          setLoading(false)
          return
        }

        // 基準値データをテスト名ごとに整理
        const criteriaMap = testNamesForCriteria.reduce((acc: { [key: string]: CriteriaData }, testName) => {
          const testCriteria = criteriaData?.filter(item => item.test_name === testName) || []
          console.log(`テスト ${testName} の基準値データ（詳細）:`, {
            testName,
            criteriaCount: testCriteria.length,
            criteria: testCriteria,
            passing: testCriteria.find(item => item.criteria_type === 'passing'),
            failing: testCriteria.find(item => item.criteria_type === 'failing')
          })

          acc[testName] = {
            passing: testCriteria.find(item => item.criteria_type === 'passing') || null,
            failing: testCriteria.find(item => item.criteria_type === 'failing') || null
          }
          return acc
        }, {})

        console.log('処理後の基準値データ（マップ）:', criteriaMap)

        // テスト結果に問題数と基準値データを追加
        const processedResults = results.map((result: TestResult) => {
          const questionCount = questionCounts?.find(qc => qc.test_name === result.test_name)
          console.log(`処理中のテスト: ${result.test_name}`)
          console.log('対応する問題数データ:', JSON.stringify(questionCount))
          console.log('対応する基準値データ:', JSON.stringify(criteriaMap[result.test_name]))

          if (!questionCount) {
            console.error(`問題数データが見つかりません: ${result.test_name}`)
            return null
          }

          const processedResult = {
            ...result,
            criteria: criteriaMap[result.test_name] || null,
            question_counts: {
              anatomy: questionCount.anatomy || 0,
              physiology: questionCount.physiology || 0,
              clinical_medicine_overview: questionCount.clinical_medicine_overview || 0,
              clinical_medicine_detail: questionCount.clinical_medicine_detail || 0,
              oriental_medicine_overview: questionCount.oriental_medicine_overview || 0,
              meridian_points: questionCount.meridian_points || 0,
              oriental_medicine_clinical: questionCount.oriental_medicine_clinical || 0
            }
          } as TestResult

          console.log('処理後のテスト結果:', JSON.stringify({
            test_name: processedResult.test_name,
            scores: {
              anatomy: processedResult.anatomy,
              physiology: processedResult.physiology,
              clinical_medicine_overview: processedResult.clinical_medicine_overview,
              clinical_medicine_detail: processedResult.clinical_medicine_detail,
              oriental_medicine_overview: processedResult.oriental_medicine_overview,
              meridian_points: processedResult.meridian_points,
              oriental_medicine_clinical: processedResult.oriental_medicine_clinical
            }
          }))

          return processedResult
        }).filter(Boolean) as TestResult[]

        setTestResults(processedResults)
        setLoading(false)
      } catch (error) {
        console.error('データ取得中にエラーが発生:', error)
        setError('データの取得に失敗しました')
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const calculateScorePercentage = (score: number | null, total: number | null): number => {
    if (score === null || total === null || total === 0) return 0
    return Math.round((score / total) * 100)
  }

  const getChartData = (result: TestResult) => {
    const { question_counts } = result
    if (!question_counts) return null

    // 科目とカラム名のマッピング
    const subjectMapping = [
      { label: '医療概論', key: 'medical_overview' },
      { label: '衛生学・公衆衛生学', key: 'public_health' },
      { label: '関係法規', key: 'related_laws' },
      { label: '解剖学', key: 'anatomy' },
      { label: '生理学', key: 'physiology' },
      { label: '病理学', key: 'pathology' },
      { label: '臨床医学総論', key: 'clinical_medicine_overview' },
      { label: '臨床医学各論', key: 'clinical_medicine_detail' },
      { label: '臨床医学各論（総合）', key: 'clinical_medicine_detail_total' },
      { label: 'リハビリテーション医学', key: 'rehabilitation' },
      { label: '東洋医学概論', key: 'oriental_medicine_overview' },
      { label: '経絡経穴概論', key: 'meridian_points' },
      { label: '東洋医学臨床論', key: 'oriental_medicine_clinical' },
      { label: '東洋医学臨床論（総合）', key: 'oriental_medicine_clinical_general' },
      { label: 'はり理論', key: 'acupuncture_theory' },
      { label: 'きゅう理論', key: 'moxibustion_theory' }
    ]

    // question_countsが0またはnullの科目を除外
    const validSubjects = subjectMapping.filter(subject => {
      const questionCount = question_counts[subject.key]
      return questionCount !== null && questionCount !== 0
    })

    const datasets = [
      {
        label: '得点率',
        data: validSubjects.map(subject => 
          calculateScorePercentage(result[subject.key], question_counts[subject.key])
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]

    return {
      labels: validSubjects.map(subject => subject.label),
      datasets
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        display: false,
        align: 'start' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 12
          }
        },
        rtl: false,
        reverse: false
      }
    }
  }

  // レーダーチャートのコンポーネントをラップする
  const RadarChart = ({ data }: { data: any }) => {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="h-[400px]">
          <Radar data={data} options={chartOptions} />
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">テスト結果</h1>
      <div className="space-y-6">
        {testResults.map((result: TestResult) => (
          <div key={result.id} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{result.test_name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">得点</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>総合点</span>
                    <span>{result.total_score}点</span>
                  </div>
                  {(() => {
                    // 基礎医学系の科目をチェック
                    const basicMedicineSubjects = ['medical_overview', 'public_health', 'related_laws', 'anatomy', 'physiology', 'pathology']
                    const hasBasicMedicine = basicMedicineSubjects.some(subject => 
                      result.question_counts[subject] !== null && result.question_counts[subject] > 0
                    )
                    
                    // 臨床医学系の科目をチェック
                    const clinicalMedicineSubjects = ['clinical_medicine_overview', 'clinical_medicine_detail', 'clinical_medicine_detail_total', 'rehabilitation']
                    const hasClinicalMedicine = clinicalMedicineSubjects.some(subject => 
                      result.question_counts[subject] !== null && result.question_counts[subject] > 0
                    )
                    
                    // 東洋医学系の科目をチェック
                    const orientalMedicineSubjects = ['oriental_medicine_overview', 'meridian_points', 'oriental_medicine_clinical', 'oriental_medicine_clinical_general', 'acupuncture_theory', 'moxibustion_theory']
                    const hasOrientalMedicine = orientalMedicineSubjects.some(subject => 
                      result.question_counts[subject] !== null && result.question_counts[subject] > 0
                    )
                    
                    console.log(`[DEBUG] ${result.test_name} - question_counts:`, result.question_counts)
                    console.log(`[DEBUG] ${result.test_name} - hasBasicMedicine:`, hasBasicMedicine)
                    console.log(`[DEBUG] ${result.test_name} - hasClinicalMedicine:`, hasClinicalMedicine)
                    console.log(`[DEBUG] ${result.test_name} - hasOrientalMedicine:`, hasOrientalMedicine)
                    
                    return (
                      <>
                        {hasBasicMedicine && (
                          <div className="flex justify-between">
                            <span>基礎医学系</span>
                            <span>{result.basic_medicine_score}点</span>
                          </div>
                        )}
                        {hasClinicalMedicine && (
                          <div className="flex justify-between">
                            <span>臨床医学系</span>
                            <span>{result.clinical_medicine_score}点</span>
                          </div>
                        )}
                        {hasOrientalMedicine && (
                          <div className="flex justify-between">
                            <span>東洋医学系</span>
                            <span>{result.oriental_medicine_score}点</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>専門系</span>
                          <span>{result.specialized_score}点</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">基準値</h3>
                {result.criteria && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>合格基準</span>
                      <span className="text-green-600">
                        {result.criteria.passing ? '設定あり' : '未設定'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>不合格基準</span>
                      <span className="text-red-600">
                        {result.criteria.failing ? '設定あり' : '未設定'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="font-medium mb-4">得点率分布</h3>
              <div className="w-full max-w-2xl mx-auto">
                <div className="h-[400px]">
                  {getChartData(result) && <Radar data={getChartData(result)!} options={chartOptions} />}
                </div>
                <div className="text-sm text-gray-600 mt-2 text-center">
                  ※凡例をクリックすると、該当するデータの表示/非表示を切り替えることができます。
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const subjectMapping = [
                    { label: '医療概論', key: 'medical_overview' },
                    { label: '衛生学・公衆衛生学', key: 'public_health' },
                    { label: '関係法規', key: 'related_laws' },
                    { label: '解剖学', key: 'anatomy' },
                    { label: '生理学', key: 'physiology' },
                    { label: '病理学', key: 'pathology' },
                    { label: '臨床医学総論', key: 'clinical_medicine_overview' },
                    { label: '臨床医学各論', key: 'clinical_medicine_detail' },
                    { label: '臨床医学各論（総合）', key: 'clinical_medicine_detail_total' },
                    { label: 'リハビリテーション医学', key: 'rehabilitation' },
                    { label: '東洋医学概論', key: 'oriental_medicine_overview' },
                    { label: '経絡経穴概論', key: 'meridian_points' },
                    { label: '東洋医学臨床論', key: 'oriental_medicine_clinical' },
                    { label: '東洋医学臨床論（総合）', key: 'oriental_medicine_clinical_general' },
                    { label: 'はり理論', key: 'acupuncture_theory' },
                    { label: 'きゅう理論', key: 'moxibustion_theory' }
                  ]

                  return subjectMapping
                    .filter(subject => {
                      const questionCount = result.question_counts[subject.key]
                      const shouldShow = questionCount !== null && questionCount > 0
                      console.log(`[DEBUG] ${result.test_name} - ${subject.label}: questionCount=${questionCount}, shouldShow=${shouldShow}`)
                      return shouldShow
                    })
                    .map(subject => (
                      <div key={subject.key} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">{subject.label}</h4>
                        <p>{result[subject.key] || 0}/{result.question_counts[subject.key]}点</p>
                        <p className="text-sm text-gray-600">
                          {calculateScorePercentage(result[subject.key], result.question_counts[subject.key])}%
                        </p>
                      </div>
                    ))
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 