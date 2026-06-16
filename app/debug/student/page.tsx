import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decryptStudentRows } from "@/lib/studentNameCrypto.server"

export default async function DebugStudentPage() {
  const supabase = await createClient()

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("*")
    .order("id", { ascending: true })

  const decryptedStudents = students
    ? await decryptStudentRows(students)
    : null

  const { data: testScores, error: testScoresError } = await supabase
    .from("test_scores")
    .select(`
      *,
      question_counts (
        *
      )
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">デバッグ情報</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>学生情報（氏名は復号済みで表示）</CardTitle>
        </CardHeader>
        <CardContent>
          {studentsError ? (
            <div className="text-red-500">エラー: {studentsError.message}</div>
          ) : (
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(decryptedStudents, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>テストスコア</CardTitle>
        </CardHeader>
        <CardContent>
          {testScoresError ? (
            <div className="text-red-500">エラー: {testScoresError.message}</div>
          ) : (
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(testScores, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
