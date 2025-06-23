'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getTestResultsByTest } from "@/app/actions/test-results"
import { updateTestResult } from "@/app/actions/test-results-detail"

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
}

export default function EditTestResultPage({
  params,
}: {
  params: Promise<{ testName: string; testDate: string; id: string }>
}) {
  const router = useRouter()
  const [testScore, setTestScore] = useState<TestScore | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const resolvedParams = use(params)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { success, data, error } = await getTestResultsByTest(resolvedParams.testName, resolvedParams.testDate)
        if (success && data) {
          const score = data.find((s) => s.id === parseInt(resolvedParams.id))
          if (score) {
            setTestScore(score)
          } else {
            setError("テスト結果が見つかりません")
          }
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
  }, [resolvedParams.testName, resolvedParams.testDate, resolvedParams.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testScore) return

    setSaving(true)
    setError(null)

    console.log("更新を開始します:", {
      id: testScore.id,
      test_name: testScore.test_name,
      test_date: testScore.test_date,
      total_score: testScore.total_score
    });

    try {
      const { total_score, ...scoreToUpdate } = testScore
      const { success, error } = await updateTestResult({
        ...scoreToUpdate,
        total_score: calculateTotalScore(scoreToUpdate as TestScore)
      })
      console.log("更新結果:", { success, error });

      if (success) {
        console.log("更新が成功しました。一覧画面に戻ります。");
        // キャッシュをクリアしてからリダイレクト
        router.refresh();
        router.push(`/admin/results/${resolvedParams.testName}/${resolvedParams.testDate}`);
      } else {
        console.error("更新に失敗しました:", {
          error,
          testScore,
          testName: resolvedParams.testName,
          testDate: resolvedParams.testDate
        });
        setError(error || "テスト結果の更新に失敗しました");
      }
    } catch (err) {
      console.error("予期せぬエラーが発生しました:", {
        error: err,
        errorMessage: err instanceof Error ? err.message : "不明なエラー",
        errorStack: err instanceof Error ? err.stack : undefined,
        testScore,
        testName: resolvedParams.testName,
        testDate: resolvedParams.testDate
      });
      setError(err instanceof Error ? err.message : "テスト結果の更新に失敗しました");
    } finally {
      setSaving(false)
    }
  }

  const handleScoreChange = (field: keyof TestScore, value: string) => {
    if (!testScore) return
    const numValue = value === "" ? 0 : parseInt(value)
    if (isNaN(numValue)) return

    const updatedScore = {
      ...testScore,
      [field]: numValue,
    }

    setTestScore({
      ...updatedScore,
      total_score: calculateTotalScore(updatedScore),
    })
  }

  const calculateTotalScore = (score: TestScore): number => {
    const scores = [
      score.medical_overview,
      score.public_health,
      score.related_laws,
      score.anatomy,
      score.physiology,
      score.pathology,
      score.clinical_medicine_overview,
      score.clinical_medicine_detail,
      score.clinical_medicine_detail_total,
      score.rehabilitation,
      score.oriental_medicine_overview,
      score.meridian_points,
      score.oriental_medicine_clinical,
      score.oriental_medicine_clinical_general,
      score.acupuncture_theory,
      score.moxibustion_theory
    ]

    return scores.reduce((sum, value) => sum + (value || 0), 0)
  }

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

  if (error || !testScore) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <CharacterIcon size={80} animated={true} className="mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error || "テスト結果が見つかりません"}</p>
          <Button asChild variant="outline">
            <Link href={`/admin/results/${resolvedParams.testName}/${resolvedParams.testDate}`}>
              一覧に戻る
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">テスト結果の編集</h1>
          <p className="text-gray-600">
            {decodeURIComponent(resolvedParams.testName)} - {decodeURIComponent(resolvedParams.testDate)}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          一覧に戻る
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CharacterIcon size={40} />
            <div>
              <CardTitle>{testScore.student_name}</CardTitle>
              <CardDescription>学生ID: {testScore.student_id}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medical_overview">医療概論</Label>
                <Input
                  id="medical_overview"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.medical_overview || 0}
                  onChange={(e) => handleScoreChange("medical_overview", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="public_health">公衆衛生</Label>
                <Input
                  id="public_health"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.public_health || 0}
                  onChange={(e) => handleScoreChange("public_health", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="related_laws">関係法規</Label>
                <Input
                  id="related_laws"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.related_laws || 0}
                  onChange={(e) => handleScoreChange("related_laws", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anatomy">解剖学</Label>
                <Input
                  id="anatomy"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.anatomy || 0}
                  onChange={(e) => handleScoreChange("anatomy", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="physiology">生理学</Label>
                <Input
                  id="physiology"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.physiology || 0}
                  onChange={(e) => handleScoreChange("physiology", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pathology">病理学</Label>
                <Input
                  id="pathology"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.pathology || 0}
                  onChange={(e) => handleScoreChange("pathology", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinical_medicine_overview">臨床医学総論</Label>
                <Input
                  id="clinical_medicine_overview"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.clinical_medicine_overview || 0}
                  onChange={(e) => handleScoreChange("clinical_medicine_overview", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinical_medicine_detail">臨床医学各論</Label>
                <Input
                  id="clinical_medicine_detail"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.clinical_medicine_detail || 0}
                  onChange={(e) => handleScoreChange("clinical_medicine_detail", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinical_medicine_detail_total">臨床医学各論（総合）</Label>
                <Input
                  id="clinical_medicine_detail_total"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.clinical_medicine_detail_total || 0}
                  onChange={(e) => handleScoreChange("clinical_medicine_detail_total", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rehabilitation">リハビリテーション医学</Label>
                <Input
                  id="rehabilitation"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.rehabilitation || 0}
                  onChange={(e) => handleScoreChange("rehabilitation", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oriental_medicine_overview">東洋医学概論</Label>
                <Input
                  id="oriental_medicine_overview"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.oriental_medicine_overview || 0}
                  onChange={(e) => handleScoreChange("oriental_medicine_overview", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meridian_points">経絡経穴概論</Label>
                <Input
                  id="meridian_points"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.meridian_points || 0}
                  onChange={(e) => handleScoreChange("meridian_points", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oriental_medicine_clinical">東洋医学臨床論</Label>
                <Input
                  id="oriental_medicine_clinical"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.oriental_medicine_clinical || 0}
                  onChange={(e) => handleScoreChange("oriental_medicine_clinical", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oriental_medicine_clinical_general">東洋医学臨床論（総合）</Label>
                <Input
                  id="oriental_medicine_clinical_general"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.oriental_medicine_clinical_general || 0}
                  onChange={(e) => handleScoreChange("oriental_medicine_clinical_general", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acupuncture_theory">はり理論</Label>
                <Input
                  id="acupuncture_theory"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.acupuncture_theory || 0}
                  onChange={(e) => handleScoreChange("acupuncture_theory", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moxibustion_theory">きゅう理論</Label>
                <Input
                  id="moxibustion_theory"
                  type="number"
                  min="0"
                  max="100"
                  value={testScore.moxibustion_theory || 0}
                  onChange={(e) => handleScoreChange("moxibustion_theory", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="text-lg font-semibold">
                合計点: {testScore.total_score}点
              </div>
              <div className="space-x-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 