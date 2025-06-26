import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUp } from "lucide-react"
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

  return (
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
            CSVファイルは、id, name, gakusei_id, gakusei_password, hogosya_id, hogosya_pass, classの列を含む必要があります
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
  )
} 