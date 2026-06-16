"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { importStudents } from "@/app/actions/students"
import { useRef, useState } from "react"

export type StudentImportProps = {
  onImportSuccess?: () => void
}

export default function StudentImport({ onImportSuccess }: StudentImportProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    try {
      const text = await file.text()
      const rows = text.split("\n").filter((row) => row.trim())
      if (rows.length < 2) {
        throw new Error("CSVファイルにデータがありません")
      }

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

      const result = await importStudents(students)

      if (!result.success) {
        throw new Error(result.error || "インポートに失敗しました")
      }

      toast({
        title: "成功",
        description:
          result.message ||
          `${result.successCount ?? students.length}件の学生データをインポートしました`,
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      onImportSuccess?.()
    } catch (error) {
      console.error("ファイル読み込みエラー:", error)
      toast({
        title: "エラー",
        description:
          error instanceof Error ? error.message : "ファイルの読み込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-brown-200 dark:border-brown-800">
      <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
        <div className="flex items-center gap-3">
          <FileUp className="h-8 w-8 text-brown-600 dark:text-brown-300" />
          <div>
            <CardTitle className="text-brown-800 dark:text-brown-100">
              学生データインポート
            </CardTitle>
            <CardDescription className="text-brown-600 dark:text-brown-300">
              CSVファイルから学生データをインポートします（氏名はサーバー側で暗号化して保存）
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
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".csv"
                className="hidden"
                disabled={isLoading}
                onChange={handleFileChange}
              />
            </label>
          </div>
          <div className="text-sm text-brown-600 dark:text-brown-300">
            CSVファイルは、id, name, gakusei_id, gakusei_password, hogosya_id,
            hogosya_pass, classの列を含む必要があります
          </div>
          <Button
            variant="outline"
            size="lg"
            className="w-full border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
            disabled={isLoading}
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            {isLoading ? "インポート中..." : "インポート実行"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
