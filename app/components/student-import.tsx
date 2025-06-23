import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUp, FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Student } from "@/types/student"

export type StudentImportProps = {
  onImportSuccess: (students: Student[]) => void
}

export default function StudentImport({ onImportSuccess }: StudentImportProps) {
  const { toast } = useToast()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const rows = text.split("\n")
      const headers = rows[0].split(",")
      const students = rows.slice(1).map((row) => {
        const values = row.split(",")
        return {
          id: values[0]?.trim() || "",
          name: values[1]?.trim() || "",
          gakusei_id: values[2]?.trim() || "",
          gakusei_password: values[3]?.trim() || "",
          hogosya_id: values[4]?.trim() || "",
          hogosya_pass: values[5]?.trim() || "",
          class: values[6]?.trim() || "",
        }
      })

      onImportSuccess?.(students)
      toast({
        title: "成功",
        description: `${students.length}件の学生データをインポートしました`,
      })
    } catch (error) {
      console.error("ファイル読み込みエラー:", error)
      toast({
        title: "エラー",
        description: "ファイルの読み込みに失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    try {
      // 学生データを取得
      const response = await fetch("/api/admin/students/export")
      if (!response.ok) {
        throw new Error("エクスポートに失敗しました")
      }

      // レスポンスをBlobとして取得
      const blob = await response.blob()
      
      // ダウンロードリンクを作成
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `students_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      
      // クリーンアップ
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "成功",
        description: "学生データをエクスポートしました",
      })
    } catch (error) {
      console.error("エクスポートエラー:", error)
      toast({
        title: "エラー",
        description: "エクスポートに失敗しました",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-brown-200 dark:border-brown-800">
        <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
          <div className="flex items-center gap-3">
            <FileUp className="h-8 w-8 text-brown-600 dark:text-brown-300" />
            <div>
              <CardTitle className="text-brown-800 dark:text-brown-100">学生データインポート</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                CSVファイルから学生データをインポートします
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white dark:bg-brown-900 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-brown-300 dark:border-brown-700 rounded-lg cursor-pointer hover:bg-brown-50 dark:hover:bg-brown-800/50"
              >
                <div className="flex flex-col items-center">
                  <FileUp className="h-8 w-8 text-brown-400 dark:text-brown-500 mb-2" />
                  <span className="text-sm text-brown-600 dark:text-brown-300">
                    CSVファイルをドラッグ＆ドロップ
                    <br />
                    またはクリックして選択
                  </span>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div className="text-sm text-brown-600 dark:text-brown-300">
              CSVファイルは、student_id, name, passwordの列を含む必要があります
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
            >
              インポート実行
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-brown-200 dark:border-brown-800">
        <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
          <div className="flex items-center gap-3">
            <FileDown className="h-8 w-8 text-brown-600 dark:text-brown-300" />
            <div>
              <CardTitle className="text-brown-800 dark:text-brown-100">学生データエクスポート</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                現在の学生データをCSVファイルとしてエクスポートします
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white dark:bg-brown-900 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
                onClick={handleExport}
              >
                <FileDown className="mr-2 h-5 w-5" />
                エクスポート実行
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 