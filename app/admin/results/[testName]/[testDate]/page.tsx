'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import Link from "next/link"
import { ChevronLeft, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getTestResultsByTest } from "@/app/actions/test-results"
import { refreshTestResults } from "@/app/actions/test-results-detail"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface TestScore {
  id: number
  student_id: number
  student_name: string
  test_name: string
  test_date: string
  total_score: number
  medical_overview: number
  public_health: number
  related_laws: number
  anatomy: number
  physiology: number
  pathology: number
  clinical_medicine_overview: number
  clinical_medicine_detail: number
  clinical_medicine_detail_total: number
  rehabilitation: number
  oriental_medicine_overview: number
  meridian_points: number
  oriental_medicine_clinical: number
  oriental_medicine_clinical_general: number
  acupuncture_theory: number
  moxibustion_theory: number
  clinical_medicine_detail_general?: number
}

type SortField = 
  | "student_id" 
  | "student_name" 
  | "medical_overview" 
  | "public_health" 
  | "related_laws" 
  | "anatomy" 
  | "physiology" 
  | "pathology" 
  | "clinical_medicine_overview" 
  | "clinical_medicine_detail" 
  | "clinical_medicine_detail_total" 
  | "rehabilitation" 
  | "oriental_medicine_overview" 
  | "meridian_points" 
  | "oriental_medicine_clinical" 
  | "oriental_medicine_clinical_general" 
  | "acupuncture_theory" 
  | "moxibustion_theory" 
  | "total_score"

type SortDirection = "asc" | "desc"

export default function TestResultsDetailPage({
  params,
}: {
  params: Promise<{ testName: string; testDate: string }>
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [testScores, setTestScores] = useState<TestScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("student_id")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [resolvedParams, setResolvedParams] = useState<{ testName: string; testDate: string } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const paramsData = await params
        setResolvedParams(paramsData)
        const { success, data, error } = await getTestResultsByTest(decodeURIComponent(paramsData.testName), paramsData.testDate)
        if (success && data) {
          setTestScores(data)
        } else {
          setError(error || "テスト結果の取得に失敗しました")
        }
      } catch (err) {
        setError("テスト結果の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params])

  // ソート機能
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // ソートアイコンを取得
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // ソートされたデータを取得
  const sortedTestScores = [...testScores].sort((a, b) => {
    let aValue: any
    let bValue: any

    if (sortField === "total_score") {
      aValue = a.medical_overview + a.public_health + a.related_laws + a.anatomy + a.physiology + a.pathology + 
               a.clinical_medicine_overview + a.clinical_medicine_detail + a.clinical_medicine_detail_total + 
               a.rehabilitation + a.oriental_medicine_overview + a.meridian_points + a.oriental_medicine_clinical + 
               a.oriental_medicine_clinical_general + a.acupuncture_theory + a.moxibustion_theory
      bValue = b.medical_overview + b.public_health + b.related_laws + b.anatomy + b.physiology + b.pathology + 
               b.clinical_medicine_overview + b.clinical_medicine_detail + b.clinical_medicine_detail_total + 
               b.rehabilitation + b.oriental_medicine_overview + b.meridian_points + b.oriental_medicine_clinical + 
               b.oriental_medicine_clinical_general + b.acupuncture_theory + b.moxibustion_theory
    } else {
      aValue = a[sortField]
      bValue = b[sortField]
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue, "ja") 
        : bValue.localeCompare(aValue, "ja")
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <CharacterIcon size={80} animated={true} className="mx-auto mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || testScores.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <CharacterIcon size={80} animated={true} className="mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error || "テスト結果がありません"}</p>
          <Button asChild variant="outline">
            <Link href="/admin/results">テスト結果一覧に戻る</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/results" className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              一覧に戻る
            </Link>
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const fetchData = async () => {
                  try {
                    if (!resolvedParams) return
                    const result = await refreshTestResults(decodeURIComponent(resolvedParams.testName), resolvedParams.testDate)
                    if (!result.success) {
                      setError(result.error || "テスト結果の更新に失敗しました")
                    } else {
                      // 更新成功時にデータを再取得
                      const { success, data, error } = await getTestResultsByTest(decodeURIComponent(resolvedParams.testName), resolvedParams.testDate)
                      if (success && data) {
                        setTestScores(data)
                      } else {
                        setError(error || "テスト結果の取得に失敗しました")
                      }
                    }
                  } catch (err) {
                    setError("テスト結果の更新に失敗しました")
                  }
                }

                fetchData()
              }}
              disabled={loading}
              className="flex items-center"
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              更新
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CharacterIcon size={40} />
              <div>
                <CardTitle>{resolvedParams ? decodeURIComponent(resolvedParams.testName) : "読み込み中..."}</CardTitle>
                <CardDescription>実施日: {resolvedParams?.testDate || "読み込み中..."}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <Button variant="outline" onClick={() => {
                  const fetchData = async () => {
                    try {
                      if (!resolvedParams) return
                      const { success, data, error } = await getTestResultsByTest(decodeURIComponent(resolvedParams.testName), resolvedParams.testDate)
                      if (success && data) {
                        setTestScores(data)
                      } else {
                        setError(error || "テスト結果の取得に失敗しました")
                      }
                    } catch (err) {
                      setError("テスト結果の取得に失敗しました")
                    }
                  }

                  fetchData()
                }}>
                  再読み込み
                </Button>
              </div>
            ) : testScores.length > 0 ? (
              <div className="overflow-x-auto border rounded-lg shadow-sm">
                <div className="min-w-[2000px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10 shadow-sm">
                      <TableRow>
                        <TableHead 
                          className="w-[100px] sticky left-0 bg-white dark:bg-gray-950 z-20 border-r cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("student_id")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            学生ID
                            {getSortIcon("student_id")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[150px] sticky left-[100px] bg-white dark:bg-gray-950 z-20 border-r cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("student_name")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            氏名
                            {getSortIcon("student_name")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] min-w-[90px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("medical_overview")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            医療概論
                            {getSortIcon("medical_overview")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] min-w-[90px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("public_health")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            公衆衛生
                            {getSortIcon("public_health")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] min-w-[90px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("related_laws")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            関係法規
                            {getSortIcon("related_laws")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] min-w-[90px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("anatomy")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            解剖学
                            {getSortIcon("anatomy")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] min-w-[90px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("physiology")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            生理学
                            {getSortIcon("physiology")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] min-w-[90px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("pathology")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            病理学
                            {getSortIcon("pathology")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[110px] min-w-[110px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("clinical_medicine_overview")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            臨床医学総論
                            {getSortIcon("clinical_medicine_overview")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[110px] min-w-[110px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("clinical_medicine_detail")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            臨床医学各論
                            {getSortIcon("clinical_medicine_detail")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[110px] min-w-[110px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("clinical_medicine_detail_total")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            臨各（総合）
                            {getSortIcon("clinical_medicine_detail_total")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] min-w-[90px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("rehabilitation")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            リハビリ
                            {getSortIcon("rehabilitation")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[110px] min-w-[110px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("oriental_medicine_overview")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            東洋医学概論
                            {getSortIcon("oriental_medicine_overview")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] min-w-[90px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("meridian_points")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            経絡経穴
                            {getSortIcon("meridian_points")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[110px] min-w-[110px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("oriental_medicine_clinical")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            東洋医学臨床
                            {getSortIcon("oriental_medicine_clinical")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[110px] min-w-[110px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("oriental_medicine_clinical_general")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            東臨（総合）
                            {getSortIcon("oriental_medicine_clinical_general")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] min-w-[90px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("acupuncture_theory")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            はり理論
                            {getSortIcon("acupuncture_theory")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] min-w-[90px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("moxibustion_theory")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            きゅう理論
                            {getSortIcon("moxibustion_theory")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] min-w-[90px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => handleSort("total_score")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            総合点
                            {getSortIcon("total_score")}
                          </div>
                        </TableHead>
                        <TableHead className="w-[100px] sticky right-0 bg-white dark:bg-gray-950 z-20 border-l">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTestScores.map((score) => (
                        <TableRow key={score.id}>
                          <TableCell className="sticky left-0 bg-white dark:bg-gray-950 z-10 text-center border-r font-medium">{score.student_id}</TableCell>
                          <TableCell className="sticky left-[100px] bg-white dark:bg-gray-950 z-10 border-r font-medium">{score.student_name}</TableCell>
                          <TableCell className="text-center">{score.medical_overview}</TableCell>
                          <TableCell className="text-center">{score.public_health}</TableCell>
                          <TableCell className="text-center">{score.related_laws}</TableCell>
                          <TableCell className="text-center">{score.anatomy}</TableCell>
                          <TableCell className="text-center">{score.physiology}</TableCell>
                          <TableCell className="text-center">{score.pathology}</TableCell>
                          <TableCell className="text-center">{score.clinical_medicine_overview}</TableCell>
                          <TableCell className="text-center">{score.clinical_medicine_detail}</TableCell>
                          <TableCell className="text-center">{score.clinical_medicine_detail_total}</TableCell>
                          <TableCell className="text-center">{score.rehabilitation}</TableCell>
                          <TableCell className="text-center">{score.oriental_medicine_overview}</TableCell>
                          <TableCell className="text-center">{score.meridian_points}</TableCell>
                          <TableCell className="text-center">{score.oriental_medicine_clinical}</TableCell>
                          <TableCell className="text-center">{score.oriental_medicine_clinical_general}</TableCell>
                          <TableCell className="text-center">{score.acupuncture_theory}</TableCell>
                          <TableCell className="text-center">{score.moxibustion_theory}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={score.total_score >= Math.ceil((score.medical_overview + 
                               score.public_health + 
                               score.related_laws + 
                               score.anatomy + 
                               score.physiology + 
                               score.pathology + 
                               score.clinical_medicine_overview + 
                               score.clinical_medicine_detail + 
                               score.clinical_medicine_detail_total + 
                               score.rehabilitation + 
                               score.oriental_medicine_overview + 
                               score.meridian_points + 
                               score.oriental_medicine_clinical + 
                               score.oriental_medicine_clinical_general + 
                               score.acupuncture_theory + 
                               score.moxibustion_theory) * 0.6) ? "success" : "destructive"}>
                              {score.medical_overview + 
                               score.public_health + 
                               score.related_laws + 
                               score.anatomy + 
                               score.physiology + 
                               score.pathology + 
                               score.clinical_medicine_overview + 
                               score.clinical_medicine_detail + 
                               score.clinical_medicine_detail_total + 
                               score.rehabilitation + 
                               score.oriental_medicine_overview + 
                               score.meridian_points + 
                               score.oriental_medicine_clinical + 
                               score.oriental_medicine_clinical_general + 
                               score.acupuncture_theory + 
                               score.moxibustion_theory}点
                            </Badge>
                          </TableCell>
                          <TableCell className="sticky right-0 bg-white dark:bg-gray-950 z-10 border-l">
                            <div className="flex justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (resolvedParams) {
                                    router.push(`/admin/results/${resolvedParams.testName}/${resolvedParams.testDate}/edit/${score.id}`)
                                  }
                                }}
                              >
                                編集
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">テスト結果がありません</p>
                <Button variant="outline" onClick={() => {
                  const fetchData = async () => {
                    try {
                      if (!resolvedParams) return
                      const { success, data, error } = await getTestResultsByTest(decodeURIComponent(resolvedParams.testName), resolvedParams.testDate)
                      if (success && data) {
                        setTestScores(data)
                      } else {
                        setError(error || "テスト結果の取得に失敗しました")
                      }
                    } catch (err) {
                      setError("テスト結果の取得に失敗しました")
                    }
                  }

                  fetchData()
                }}>
                  再読み込み
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
