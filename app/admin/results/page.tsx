"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import Link from "next/link"
import { ChevronLeft, RefreshCw, Upload, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { importTestResults, importTestResultsFromCSV } from "@/app/actions/test-results"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  rehabilitation: number
  oriental_medicine_overview: number
  meridian_points: number
  oriental_medicine_clinical: number
  oriental_medicine_clinical_general: number
  acupuncture_theory: number
  moxibustion_theory: number
  clinical_medicine_detail_general?: number
}

interface QuestionCounts {
  test_name: string
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
  [key: string]: string | number
}

interface GroupedTestScores {
  [key: string]: {
    test_name: string
    test_date: string
    scores: TestScore[]
    average_score: number
    pass_count: number
    total_count: number
    max_score: number
    pass_score: number
  }
}

// 最大点数の計算関数
const calculateMaxScore = (questionCounts: QuestionCounts) => {
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
  
  return subjects.reduce((sum, subject) => {
    const value = questionCounts[subject as keyof QuestionCounts]
    return sum + (typeof value === 'number' ? value : 0)
  }, 0)
}

export default function ResultsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [testScores, setTestScores] = useState<TestScore[]>([])
  const [groupedScores, setGroupedScores] = useState<GroupedTestScores>({} as GroupedTestScores)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importTestName, setImportTestName] = useState("")
  const [importTestDate, setImportTestDate] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [isFetching, setIsFetching] = useState(false) // 重複実行防止フラグ

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn")

    if (adminLoggedIn !== "true") {
      router.push("/admin")
      return
    }

    fetchTestScores()
  }, [])

  const fetchTestScores = async () => {
    // 重複実行を防ぐ
    if (isFetching) {
      return
    }
    
    setIsFetching(true)
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/test-results")
      const data = await response.json()

      if (data.success) {
        // データが配列であることを確認
        if (!Array.isArray(data.data)) {
          throw new Error("テスト結果データの形式が正しくありません")
        }

        setTestScores(data.data)
        
        // テスト名の一覧を取得
        const testNames = [...new Set(data.data.map((score: TestScore) => score.test_name))] as string[]
        
        // 問題数データを取得
        const questionCountsMap: { [key: string]: QuestionCounts } = {}
        
          for (const testName of testNames) {
          try {
            const questionCountsResponse = await fetch(`/api/question-counts?testName=${encodeURIComponent(testName)}`)
            const questionCountsData = await questionCountsResponse.json()
            
            if (questionCountsData.success && questionCountsData.data) {
              questionCountsMap[testName] = questionCountsData.data as QuestionCounts
            }
          } catch (error) {
            console.error(`問題数データ取得エラー (${testName}):`, error)
            // エラーが発生しても処理を続行
          }
        }
        
        // テスト結果を試験ごとにグループ化
        let grouped: GroupedTestScores = {} as GroupedTestScores
        
        // data.dataを確実に配列に変換（完全に新しい配列を作成）
        const testScoresArray = JSON.parse(JSON.stringify(data.data))
        
        // forループを使用してテスト結果をグループ化
        grouped = {} as GroupedTestScores
        
        for (let i = 0; i < testScoresArray.length; i++) {
          const score = testScoresArray[i] as TestScore
          const key = `${score.test_name}_${score.test_date}`
          
          if (!grouped[key]) {
            // question_countsテーブルから最大点数を取得
            const questionCounts = questionCountsMap[score.test_name]
            const maxScore = questionCounts ? calculateMaxScore(questionCounts) : 190 // フォールバック値

            grouped[key] = {
              test_name: score.test_name,
              test_date: score.test_date,
              scores: [],
              average_score: 0,
              pass_count: 0,
              total_count: 0,
              max_score: maxScore,
              pass_score: Math.floor(maxScore * 0.6) // 60%を合格ラインとする
            }
          }
          
          grouped[key].scores.push(score)
          grouped[key].total_count++
          // 正答率60%以上を合格とする
          if (score.total_score >= grouped[key].pass_score) {
            grouped[key].pass_count++
          }
        }

        // 平均点を計算
        const groupedEntries = Object.entries(grouped)
        for (let i = 0; i < groupedEntries.length; i++) {
          const [key, group] = groupedEntries[i]
          const typedGroup = group as GroupedTestScores[string]
          
          let total = 0
          for (let j = 0; j < typedGroup.scores.length; j++) {
            total += typedGroup.scores[j].total_score
          }
          
          typedGroup.average_score = Math.round((total / typedGroup.total_count) * 10) / 10
        }

        setGroupedScores(grouped)
      } else {
        throw new Error(data.error || "テスト結果の取得に失敗しました")
      }
    } catch (error) {
      console.error("データ取得エラー:", error)
      setError(error instanceof Error ? error.message : "テスト結果の取得に失敗しました")
      toast({
        title: "エラー",
        description: "テスト結果の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      setIsFetching(false) // フラグをリセット
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchTestScores()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "エラー",
        description: "CSVファイルを選択してください",
        variant: "destructive",
      })
      return
    }

    if (!importTestName || !importTestDate) {
      toast({
        title: "エラー",
        description: "試験名と実施日を入力してください",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)

    try {
      const text = await importFile.text()
      const { success, error, count, inserted, updated } = await importTestResultsFromCSV(text, importTestName, importTestDate)

      if (success) {
        const message = inserted && updated 
          ? `${count}件の試験結果を処理しました（${inserted}件挿入、${updated}件更新）`
          : `${count}件の試験結果をインポートしました`
        
        toast({
          title: "成功",
          description: message,
        })
        setIsImportDialogOpen(false)
        setImportTestName("")
        setImportTestDate("")
        setImportFile(null)
        fetchTestScores()
      } else {
        if (error?.includes("duplicate key value")) {
          toast({
            title: "エラー",
            description: "既に同じ試験結果が存在します。別の試験名または実施日を指定してください。",
            variant: "destructive",
          })
        } else {
          throw new Error(error || "インポートに失敗しました")
        }
      }
    } catch (error) {
      console.error("インポートエラー:", error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "インポートに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    // CSVテンプレートのヘッダー行
    const headers = [
      "student_id",
      "medical_overview",
      "public_health",
      "related_laws",
      "anatomy",
      "physiology",
      "pathology",
      "clinical_medicine_overview",
      "clinical_medicine_detail",
      "clinical_medicine_detail_total",
      "rehabilitation",
      "oriental_medicine_overview",
      "meridian_points",
      "oriental_medicine_clinical",
      "oriental_medicine_clinical_general",
      "acupuncture_theory",
      "moxibustion_theory"
    ].join(",")

    // サンプルデータ行
    const sampleData = [
      "00000",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10"
    ].join(",")

    // CSVデータを作成
    const csvContent = `${headers}\n${sampleData}`

    // Blobを作成
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    // ダウンロードリンクを作成
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "test_scores_template.csv"

    // ダウンロードを実行
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <CharacterIcon size={80} animated={true} className="mx-auto mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/dashboard" className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              ダッシュボードに戻る
            </Link>
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center"
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              更新
            </Button>

            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Upload className="mr-1 h-4 w-4" />
                  CSVインポート
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>試験結果のインポート</DialogTitle>
                  <DialogDescription>
                    CSVファイルをアップロードして試験結果をインポートします。
                    既存のデータがある場合は上書きされます。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="test-name">試験名</Label>
                    <Input
                      id="test-name"
                      value={importTestName || ""}
                      onChange={(e) => setImportTestName(e.target.value)}
                      placeholder="例：第1回模擬試験(22期生3年次)"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="test-date">実施日</Label>
                    <Input
                      id="test-date"
                      type="date"
                      value={importTestDate || ""}
                      onChange={(e) => setImportTestDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="file-upload">CSVファイル</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsImportDialogOpen(false)
                        setImportTestName("")
                        setImportTestDate("")
                        setImportFile(null)
                      }}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!importFile || !importTestName || !importTestDate || isImporting}
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          インポート中...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          インポート実行
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="flex items-center"
            >
              <Download className="mr-1 h-4 w-4" />
              テンプレートをダウンロード
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CharacterIcon size={40} />
              <div>
                <CardTitle>試験結果一覧</CardTitle>
                <CardDescription>全試験の結果を表示します</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <Button variant="outline" onClick={handleRefresh}>
                  再読み込み
                </Button>
              </div>
            ) : testScores.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>試験名</TableHead>
                      <TableHead>実施日</TableHead>
                      <TableHead>受験者数</TableHead>
                      <TableHead>合格者数</TableHead>
                      <TableHead>平均点</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Object.entries(groupedScores) as any).map(([key, group]: any) => (
                      <TableRow key={key}>
                        <TableCell>
                          <Link
                            href={`/admin/results/${encodeURIComponent(group.test_name)}/${encodeURIComponent(group.test_date)}`}
                            className="text-amber-700 hover:text-amber-800 dark:text-amber-500 dark:hover:text-amber-400"
                          >
                            {group.test_name}
                          </Link>
                        </TableCell>
                        <TableCell>{group.test_date}</TableCell>
                        <TableCell>{group.total_count}名</TableCell>
                        <TableCell>{group.pass_count}名</TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {group.average_score}点
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/results/${encodeURIComponent(group.test_name)}/${encodeURIComponent(group.test_date)}`)}
                            >
                              詳細
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">試験結果がありません</p>
                <Button variant="outline" onClick={handleRefresh}>
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
