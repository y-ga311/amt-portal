"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import Link from "next/link"
import { ChevronLeft, RefreshCw, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

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
}

interface TestResultDetailPageProps {
  testName: string
  testDate: string
  initialData: TestScore[]
}

export function TestResultDetailPage({ testName, testDate, initialData }: TestResultDetailPageProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [testScores, setTestScores] = useState<TestScore[]>(initialData)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/test-results/${encodeURIComponent(testName)}/${encodeURIComponent(testDate)}`)
      const data = await response.json()

      if (data.success) {
        setTestScores(data.data)
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
      setIsRefreshing(false)
    }
  }

  const handleScoreChange = (studentId: number, subject: string, value: string) => {
    setTestScores((prev) =>
      prev.map((score) =>
        score.student_id === studentId
          ? {
              ...score,
              [subject]: parseInt(value) || 0,
              total_score: calculateTotalScore({
                ...score,
                [subject]: parseInt(value) || 0,
              }),
            }
          : score,
      ),
    )
  }

  const calculateTotalScore = (score: TestScore) => {
    return (
      score.medical_overview +
      score.public_health +
      score.related_laws +
      score.anatomy +
      score.physiology +
      score.pathology +
      score.clinical_medicine_overview +
      score.clinical_medicine_detail +
      score.rehabilitation +
      score.oriental_medicine_overview +
      score.meridian_points +
      score.oriental_medicine_clinical +
      score.oriental_medicine_clinical_general +
      score.acupuncture_theory +
      score.moxibustion_theory
    )
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/test-results/${encodeURIComponent(testName)}/${encodeURIComponent(testDate)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testScores),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "成功",
          description: "テスト結果を更新しました",
        })
      } else {
        throw new Error(data.error || "テスト結果の更新に失敗しました")
      }
    } catch (error) {
      console.error("更新エラー:", error)
      toast({
        title: "エラー",
        description: "テスト結果の更新に失敗しました",
        variant: "destructive",
      })
    }
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
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center"
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              更新
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="flex items-center"
            >
              <Save className="mr-1 h-4 w-4" />
              保存
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CharacterIcon size={40} />
              <div>
                <CardTitle>{testName}</CardTitle>
                <CardDescription>{testDate}</CardDescription>
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
              <div className="overflow-x-auto border rounded-lg bg-white" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                <div className="min-w-[1400px] w-full">
                  <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                        <TableHead className="sticky left-0 bg-white z-20 min-w-[120px] border-r shadow-sm">受験者</TableHead>
                        <TableHead className="min-w-[100px] text-center">医療概論</TableHead>
                        <TableHead className="min-w-[100px] text-center">公衆衛生</TableHead>
                        <TableHead className="min-w-[100px] text-center">関係法規</TableHead>
                        <TableHead className="min-w-[100px] text-center">解剖学</TableHead>
                        <TableHead className="min-w-[100px] text-center">生理学</TableHead>
                        <TableHead className="min-w-[100px] text-center">病理学</TableHead>
                        <TableHead className="min-w-[100px] text-center">臨床医学概論</TableHead>
                        <TableHead className="min-w-[100px] text-center">臨床医学各論</TableHead>
                        <TableHead className="min-w-[100px] text-center">リハビリテーション</TableHead>
                        <TableHead className="min-w-[100px] text-center">東洋医学概論</TableHead>
                        <TableHead className="min-w-[100px] text-center">経絡経穴</TableHead>
                        <TableHead className="min-w-[100px] text-center">東洋医学臨床論</TableHead>
                        <TableHead className="min-w-[100px] text-center">東洋医学臨床総論</TableHead>
                        <TableHead className="min-w-[100px] text-center">はり理論</TableHead>
                        <TableHead className="min-w-[100px] text-center">きゅう理論</TableHead>
                        <TableHead className="min-w-[100px] text-center">合計点</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testScores.map((score) => (
                      <TableRow key={score.id}>
                          <TableCell className="font-medium sticky left-0 bg-white z-20 border-r shadow-sm">{score.student_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.medical_overview}
                            onChange={(e) => handleScoreChange(score.student_id, "medical_overview", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.public_health}
                            onChange={(e) => handleScoreChange(score.student_id, "public_health", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.related_laws}
                            onChange={(e) => handleScoreChange(score.student_id, "related_laws", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.anatomy}
                            onChange={(e) => handleScoreChange(score.student_id, "anatomy", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.physiology}
                            onChange={(e) => handleScoreChange(score.student_id, "physiology", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.pathology}
                            onChange={(e) => handleScoreChange(score.student_id, "pathology", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.clinical_medicine_overview}
                            onChange={(e) => handleScoreChange(score.student_id, "clinical_medicine_overview", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.clinical_medicine_detail}
                            onChange={(e) => handleScoreChange(score.student_id, "clinical_medicine_detail", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.rehabilitation}
                            onChange={(e) => handleScoreChange(score.student_id, "rehabilitation", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.oriental_medicine_overview}
                            onChange={(e) => handleScoreChange(score.student_id, "oriental_medicine_overview", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.meridian_points}
                            onChange={(e) => handleScoreChange(score.student_id, "meridian_points", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.oriental_medicine_clinical}
                            onChange={(e) => handleScoreChange(score.student_id, "oriental_medicine_clinical", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.oriental_medicine_clinical_general}
                            onChange={(e) => handleScoreChange(score.student_id, "oriental_medicine_clinical_general", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.acupuncture_theory}
                            onChange={(e) => handleScoreChange(score.student_id, "acupuncture_theory", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score.moxibustion_theory}
                            onChange={(e) => handleScoreChange(score.student_id, "moxibustion_theory", e.target.value)}
                              className="w-16 text-center"
                              style={{ pointerEvents: 'auto' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={score.total_score >= 114 ? "success" : "destructive"}>
                            {score.total_score}点
                          </Badge>
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