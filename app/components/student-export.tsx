import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Student } from "./student-import"

export type StudentExportProps = {
  students: Student[]
}

export default function StudentExport({ students }: StudentExportProps) {
  const { toast } = useToast()

  const handleExport = () => {
    try {
      const headers = ["student_id", "name", "password"]
      const csvData = students.map(student => [
        student.gakusei_id,
        student.name,
        student.gakusei_password
      ])

      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.join(","))
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const date = new Date().toISOString().split("T")[0]
      link.href = url
      link.setAttribute("download", `students_${date}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "成功",
        description: "学生データをエクスポートしました",
      })
    } catch (error) {
      console.error("エクスポートエラー:", error)
      toast({
        title: "エラー",
        description: "エクスポート中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  return (
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
  )
} 