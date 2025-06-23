"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { CharacterLoading } from "@/components/character-loading"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

export default function EditTestPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true)
  const [test, setTest] = useState<TestData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchTest()
  }, [params.id])

  const fetchTest = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("question_counts")
        .select("*")
        .eq("id", params.id)
        .single()

      if (error) {
        console.error("テストデータ取得エラー:", error)
        setError(`データの取得に失敗しました: ${error.message}`)
        return
      }

      if (!data) {
        setError("テストデータが見つかりませんでした。")
        return
      }

      setTest(data)
    } catch (err) {
      console.error("テストデータ取得エラー:", err)
      setError(err instanceof Error ? err.message : "テストデータの取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!test) return

    try {
      const { error } = await supabase
        .from("question_counts")
        .update({
          test_name: test.test_name,
          test_date: test.test_date,
          medical_overview: test.medical_overview,
          public_health: test.public_health,
          related_laws: test.related_laws,
          anatomy: test.anatomy,
          physiology: test.physiology,
          pathology: test.pathology,
          clinical_medicine_overview: test.clinical_medicine_overview,
          clinical_medicine_detail: test.clinical_medicine_detail,
          clinical_medicine_detail_total: test.clinical_medicine_detail_total,
          rehabilitation: test.rehabilitation,
          oriental_medicine_overview: test.oriental_medicine_overview,
          meridian_points: test.meridian_points,
          oriental_medicine_clinical: test.oriental_medicine_clinical,
          oriental_medicine_clinical_general: test.oriental_medicine_clinical_general,
          acupuncture_theory: test.acupuncture_theory,
          moxibustion_theory: test.moxibustion_theory
        })
        .eq("id", test.id)

      if (error) {
        throw error
      }

      toast({
        title: "更新完了",
        description: "試験情報を更新しました。",
      })

      router.push("/admin/tests")
    } catch (err) {
      console.error("更新エラー:", err)
      toast({
        title: "エラー",
        description: "更新に失敗しました。",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: keyof TestData, value: string | number | null) => {
    if (!test) return

    setTest({
      ...test,
      [field]: value === "" ? null : value
    })
  }

  if (isLoading) {
    return <CharacterLoading message="テスト情報を読み込んでいます..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchTest}>
              再読み込み
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">テストデータが見つかりませんでした。</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/tests" className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              試験一覧に戻る
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CharacterIcon size={40} />
              <div>
                <CardTitle>試験情報の編集</CardTitle>
                <CardDescription>試験の詳細情報を編集します</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">試験名</label>
                  <input
                    type="text"
                    value={test.test_name}
                    onChange={(e) => handleInputChange("test_name", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">実施日</label>
                  <input
                    type="date"
                    value={format(new Date(test.test_date), "yyyy-MM-dd")}
                    onChange={(e) => handleInputChange("test_date", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">基礎医学系</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">医療概論</label>
                    <input
                      type="number"
                      value={test.medical_overview || ""}
                      onChange={(e) => handleInputChange("medical_overview", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">衛生・公衆衛生学</label>
                    <input
                      type="number"
                      value={test.public_health || ""}
                      onChange={(e) => handleInputChange("public_health", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">関係法規</label>
                    <input
                      type="number"
                      value={test.related_laws || ""}
                      onChange={(e) => handleInputChange("related_laws", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">解剖学</label>
                    <input
                      type="number"
                      value={test.anatomy || ""}
                      onChange={(e) => handleInputChange("anatomy", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">生理学</label>
                    <input
                      type="number"
                      value={test.physiology || ""}
                      onChange={(e) => handleInputChange("physiology", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">病理学</label>
                    <input
                      type="number"
                      value={test.pathology || ""}
                      onChange={(e) => handleInputChange("pathology", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">臨床医学系</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">臨床医学総論</label>
                    <input
                      type="number"
                      value={test.clinical_medicine_overview || ""}
                      onChange={(e) => handleInputChange("clinical_medicine_overview", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">臨床医学各論</label>
                    <input
                      type="number"
                      value={test.clinical_medicine_detail || ""}
                      onChange={(e) => handleInputChange("clinical_medicine_detail", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">臨床医学各論（総合）</label>
                    <input
                      type="number"
                      value={test.clinical_medicine_detail_total || ""}
                      onChange={(e) => handleInputChange("clinical_medicine_detail_total", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">リハビリテーション医学</label>
                    <input
                      type="number"
                      value={test.rehabilitation || ""}
                      onChange={(e) => handleInputChange("rehabilitation", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">東洋医学系</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">東洋医学概論</label>
                    <input
                      type="number"
                      value={test.oriental_medicine_overview || ""}
                      onChange={(e) => handleInputChange("oriental_medicine_overview", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">経絡経穴概論</label>
                    <input
                      type="number"
                      value={test.meridian_points || ""}
                      onChange={(e) => handleInputChange("meridian_points", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">東洋医学臨床論</label>
                    <input
                      type="number"
                      value={test.oriental_medicine_clinical || ""}
                      onChange={(e) => handleInputChange("oriental_medicine_clinical", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">東洋医学臨床論（総合）</label>
                    <input
                      type="number"
                      value={test.oriental_medicine_clinical_general || ""}
                      onChange={(e) => handleInputChange("oriental_medicine_clinical_general", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">専門系</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">はり理論</label>
                    <input
                      type="number"
                      value={test.acupuncture_theory || ""}
                      onChange={(e) => handleInputChange("acupuncture_theory", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">きゅう理論</label>
                    <input
                      type="number"
                      value={test.moxibustion_theory || ""}
                      onChange={(e) => handleInputChange("moxibustion_theory", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/tests">キャンセル</Link>
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
} 