"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { CharacterIcon } from "@/components/character-icon"
import { CharacterLoading } from "@/components/character-loading"
import { ChevronLeft, Save, Plus } from "lucide-react"
import Link from "next/link"

interface TestData {
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

export default function NewTestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [test, setTest] = useState<TestData>({
    test_name: "",
    test_date: "",
    medical_overview: null,
    public_health: null,
    related_laws: null,
    anatomy: null,
    physiology: null,
    pathology: null,
    clinical_medicine_overview: null,
    clinical_medicine_detail: null,
    clinical_medicine_detail_total: null,
    rehabilitation: null,
    oriental_medicine_overview: null,
    meridian_points: null,
    oriental_medicine_clinical: null,
    oriental_medicine_clinical_general: null,
    acupuncture_theory: null,
    moxibustion_theory: null
  })
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // 管理者認証チェック
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn")
    const adminId = localStorage.getItem("adminId")

    if (!adminLoggedIn || !adminId) {
      router.push("/admin/login")
      return
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!test.test_name || !test.test_date) {
      toast({
        title: "エラー",
        description: "試験名と実施日は必須です。",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Supabaseの認証状態を確認
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      console.log("認証状態:", JSON.stringify({ session, authError }, null, 2))

      // 管理者認証を確認
      const adminLoggedIn = localStorage.getItem("adminLoggedIn")
      const adminId = localStorage.getItem("adminId")
      
      if (!adminLoggedIn || !adminId) {
        throw new Error("管理者認証が必要です")
      }

      console.log("管理者認証:", { adminLoggedIn, adminId })

      // データを整形（null値を適切に処理、idは自動生成に任せる）
      const insertData = {
        test_name: test.test_name.trim(),
        test_date: test.test_date,
        medical_overview: test.medical_overview || null,
        public_health: test.public_health || null,
        related_laws: test.related_laws || null,
        anatomy: test.anatomy || null,
        physiology: test.physiology || null,
        pathology: test.pathology || null,
        clinical_medicine_overview: test.clinical_medicine_overview || null,
        clinical_medicine_detail: test.clinical_medicine_detail || null,
        clinical_medicine_detail_total: test.clinical_medicine_detail_total || null,
        rehabilitation: test.rehabilitation || null,
        oriental_medicine_overview: test.oriental_medicine_overview || null,
        meridian_points: test.meridian_points || null,
        oriental_medicine_clinical: test.oriental_medicine_clinical || null,
        oriental_medicine_clinical_general: test.oriental_medicine_clinical_general || null,
        acupuncture_theory: test.acupuncture_theory || null,
        moxibustion_theory: test.moxibustion_theory || null
      }

      console.log("送信するデータ:", JSON.stringify(insertData, null, 2))

      // 既存の試験名との重複チェック
      const { data: existingTests, error: checkError } = await supabase
        .from("question_counts")
        .select("test_name")
        .eq("test_name", insertData.test_name)

      console.log("重複チェック結果:", JSON.stringify({ existingTests, checkError }, null, 2))

      if (checkError) {
        console.error("重複チェックエラー:", JSON.stringify(checkError, null, 2))
        throw new Error(`重複チェックエラー: ${checkError.message}`)
      }

      if (existingTests && existingTests.length > 0) {
        toast({
          title: "エラー",
          description: "同じ試験名が既に存在します。別の試験名を入力してください。",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase
        .from("question_counts")
        .insert([insertData])
        .select()

      console.log("Supabaseレスポンス:", JSON.stringify({ data, error }, null, 2))

      if (error) {
        console.error("Supabaseエラー詳細:", JSON.stringify({
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        }, null, 2))
        
        // エラーコードに応じたメッセージ
        let errorMessage = "登録に失敗しました。"
        if (error.code === '23505') {
          if (error.details && error.details.includes('id')) {
            errorMessage = "データベースのID重複エラーが発生しました。管理者にお問い合わせください。"
          } else if (error.details && error.details.includes('test_name')) {
            errorMessage = "同じ試験名が既に存在します。別の試験名を入力してください。"
          } else {
            errorMessage = "同じデータが既に存在します。別の値を入力してください。"
          }
        } else if (error.code === '23502') {
          errorMessage = "必須項目が入力されていません。"
        } else if (error.code === '409') {
          errorMessage = "同じ試験名が既に存在します。別の試験名を入力してください。"
        } else if (error.message) {
          errorMessage = `データベースエラー: ${error.message}`
        }
        
        throw new Error(errorMessage)
      }

      toast({
        title: "登録完了",
        description: "試験情報を登録しました。",
      })
      setIsSuccess(true)
    } catch (err) {
      console.error("登録エラー:", err)
      console.error("エラー詳細:", {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        fullError: err
      })
      
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "登録に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof TestData, value: string | number | null) => {
    setTest({
      ...test,
      [field]: value === "" ? null : value
    })
  }

  if (isLoading) {
    return <CharacterLoading message="試験情報を登録しています..." />
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>登録完了</CardTitle>
            <CardDescription>試験情報が正常に登録されました。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/tests")}>一覧に戻る</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
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
                <CardTitle>新規試験登録</CardTitle>
                <CardDescription>新しい試験の問題数を登録します</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test_name">試験名 *</Label>
                    <Input
                      id="test_name"
                      type="text"
                      value={test.test_name}
                      onChange={(e) => handleInputChange("test_name", e.target.value)}
                      placeholder="例: 第1回模擬試験(25期生3年次)"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test_date">実施日 *</Label>
                    <Input
                      id="test_date"
                      type="date"
                      value={test.test_date}
                      onChange={(e) => handleInputChange("test_date", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 基礎医学系 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium bg-blue-600 text-white px-3 py-2 rounded">基礎医学系</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medical_overview">医療概論</Label>
                    <Input
                      id="medical_overview"
                      type="number"
                      value={test.medical_overview || ""}
                      onChange={(e) => handleInputChange("medical_overview", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="public_health">衛生・公衆衛生学</Label>
                    <Input
                      id="public_health"
                      type="number"
                      value={test.public_health || ""}
                      onChange={(e) => handleInputChange("public_health", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="related_laws">関係法規</Label>
                    <Input
                      id="related_laws"
                      type="number"
                      value={test.related_laws || ""}
                      onChange={(e) => handleInputChange("related_laws", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anatomy">解剖学</Label>
                    <Input
                      id="anatomy"
                      type="number"
                      value={test.anatomy || ""}
                      onChange={(e) => handleInputChange("anatomy", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="physiology">生理学</Label>
                    <Input
                      id="physiology"
                      type="number"
                      value={test.physiology || ""}
                      onChange={(e) => handleInputChange("physiology", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pathology">病理学</Label>
                    <Input
                      id="pathology"
                      type="number"
                      value={test.pathology || ""}
                      onChange={(e) => handleInputChange("pathology", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* 臨床医学系 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium bg-green-600 text-white px-3 py-2 rounded">臨床医学系</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinical_medicine_overview">臨床医学総論</Label>
                    <Input
                      id="clinical_medicine_overview"
                      type="number"
                      value={test.clinical_medicine_overview || ""}
                      onChange={(e) => handleInputChange("clinical_medicine_overview", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinical_medicine_detail">臨床医学各論</Label>
                    <Input
                      id="clinical_medicine_detail"
                      type="number"
                      value={test.clinical_medicine_detail || ""}
                      onChange={(e) => handleInputChange("clinical_medicine_detail", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinical_medicine_detail_total">臨床医学各論（総合）</Label>
                    <Input
                      id="clinical_medicine_detail_total"
                      type="number"
                      value={test.clinical_medicine_detail_total || ""}
                      onChange={(e) => handleInputChange("clinical_medicine_detail_total", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rehabilitation">リハビリテーション医学</Label>
                    <Input
                      id="rehabilitation"
                      type="number"
                      value={test.rehabilitation || ""}
                      onChange={(e) => handleInputChange("rehabilitation", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* 東洋医学系 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium bg-purple-600 text-white px-3 py-2 rounded">東洋医学系</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="oriental_medicine_overview">東洋医学概論</Label>
                    <Input
                      id="oriental_medicine_overview"
                      type="number"
                      value={test.oriental_medicine_overview || ""}
                      onChange={(e) => handleInputChange("oriental_medicine_overview", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meridian_points">経絡経穴概論</Label>
                    <Input
                      id="meridian_points"
                      type="number"
                      value={test.meridian_points || ""}
                      onChange={(e) => handleInputChange("meridian_points", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oriental_medicine_clinical">東洋医学臨床論</Label>
                    <Input
                      id="oriental_medicine_clinical"
                      type="number"
                      value={test.oriental_medicine_clinical || ""}
                      onChange={(e) => handleInputChange("oriental_medicine_clinical", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oriental_medicine_clinical_general">東洋医学臨床論（総合）</Label>
                    <Input
                      id="oriental_medicine_clinical_general"
                      type="number"
                      value={test.oriental_medicine_clinical_general || ""}
                      onChange={(e) => handleInputChange("oriental_medicine_clinical_general", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* 専門系 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium bg-orange-600 text-white px-3 py-2 rounded">専門系</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="acupuncture_theory">はり理論</Label>
                    <Input
                      id="acupuncture_theory"
                      type="number"
                      value={test.acupuncture_theory || ""}
                      onChange={(e) => handleInputChange("acupuncture_theory", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="moxibustion_theory">きゅう理論</Label>
                    <Input
                      id="moxibustion_theory"
                      type="number"
                      value={test.moxibustion_theory || ""}
                      onChange={(e) => handleInputChange("moxibustion_theory", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/tests")}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  登録
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
