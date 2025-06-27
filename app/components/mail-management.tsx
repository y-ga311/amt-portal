"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getStudents, updateStudentMail } from "@/app/actions/students"

interface Student {
  id: string
  name: string
  gakusei_id: string
  gakusei_password: string
  hogosya_id: string
  hogosya_pass: string
  class: string
  mail?: string
  student_id?: string
}

export default function MailManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newMail, setNewMail] = useState("")

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      console.log("メール管理: 学生データ取得を開始")
      setLoading(true)
      setError("")

      // サーバーアクションを使用して学生データを取得
      const result = await getStudents()

      if (!result.success) {
        console.error("メール管理: 学生データ取得エラー:", result.error)
        setError(result.error || "学生データの取得に失敗しました")
        return
      }

      if (!result.data || result.data.length === 0) {
        console.log("メール管理: データがありません")
        setStudents([])
        return
      }

      console.log("メール管理:", result.source + "から", result.data.length, "件の学生データを取得しました")
      setStudents(result.data)
    } catch (error) {
      console.error("メール管理: 学生データ取得エラー:", error)
      setError(error instanceof Error ? error.message : "学生データの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleEditMail = (student: Student) => {
    setEditingStudent(student)
    setNewMail(student.mail || "")
    setIsEditDialogOpen(true)
  }

  const handleUpdateMail = async () => {
    if (!editingStudent) return

    try {
      console.log("メール更新開始:", { studentId: editingStudent.id, newMail })
      
      const result = await updateStudentMail(editingStudent.id, newMail)

      if (!result.success) {
        console.error("メール更新エラー:", result.error)
        setError(`メールの更新に失敗しました: ${result.error || "不明なエラー"}`)
        return
      }

      console.log("メール更新成功:", result.data)

      // ローカル状態を更新
      setStudents(prev => prev.map(student => 
        student.id === editingStudent.id 
          ? { ...student, mail: newMail }
          : student
      ))

      // 成功メッセージを表示
      setError("") // エラーメッセージをクリア
      
      setIsEditDialogOpen(false)
      setEditingStudent(null)
      setNewMail("")
      
      // 成功通知（トーストがない場合はalertで代替）
      alert("メールアドレスを更新しました")
    } catch (error) {
      console.error("メール更新エラー:", error)
      setError(`メールの更新に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`)
    }
  }

  const studentsWithoutMail = students.filter(student => !student.mail || student.mail.trim() === "")
  const studentsWithMail = students.filter(student => student.mail && student.mail.trim() !== "")

  // クラス別に学生をグループ化
  const studentsByClass = students.reduce((acc, student) => {
    const className = student.class || "未設定"
    if (!acc[className]) {
      acc[className] = []
    }
    acc[className].push(student)
    return acc
  }, {} as Record<string, Student[]>)

  // クラス名をソート（未設定を最後に）
  const sortedClassNames = Object.keys(studentsByClass).sort((a, b) => {
    if (a === "未設定") return 1
    if (b === "未設定") return -1
    return a.localeCompare(b)
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>メール管理</CardTitle>
          </CardHeader>
          <CardContent>
            <p>データを読み込み中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>メール管理</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">エラー: {error}</p>
            <Button onClick={fetchStudents} className="mt-2">
              再試行
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* メール登録済みの学生 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            メール登録済みの学生
            <Badge variant="default">{studentsWithMail.length}名</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsWithMail.length === 0 ? (
            <p className="text-muted-foreground">メール登録済みの学生はいません</p>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-6">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  全クラス
                  <Badge variant="outline" className="text-xs">
                    {studentsWithMail.length}
                  </Badge>
                </TabsTrigger>
                {sortedClassNames.map((className) => {
                  const classStudentsWithMail = studentsWithMail.filter(student => 
                    (student.class || "未設定") === className
                  )
                  if (classStudentsWithMail.length === 0) return null
                  return (
                    <TabsTrigger key={className} value={className} className="flex items-center gap-2">
                      {className}
                      <Badge variant="outline" className="text-xs">
                        {classStudentsWithMail.length}
                      </Badge>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              
              <TabsContent value="all" className="mt-8">
                <div className="space-y-2">
                  {studentsWithMail.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {student.student_id || student.id} | クラス: {student.class || "未設定"}
                        </p>
                        <p className="text-sm text-blue-600">{student.mail}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMail(student)}
                      >
                        編集
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              {sortedClassNames.map((className) => {
                const classStudentsWithMail = studentsWithMail.filter(student => 
                  (student.class || "未設定") === className
                )
                if (classStudentsWithMail.length === 0) return null
                return (
                  <TabsContent key={className} value={className} className="mt-8">
                    <div className="space-y-2">
                      {classStudentsWithMail.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {student.student_id || student.id} | クラス: {student.class || "未設定"}
                            </p>
                            <p className="text-sm text-blue-600">{student.mail}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMail(student)}
                          >
                            編集
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* メール未登録の学生 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            メール未登録の学生
            <Badge variant="destructive">{studentsWithoutMail.length}名</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsWithoutMail.length === 0 ? (
            <p className="text-muted-foreground">メール未登録の学生はいません</p>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-6">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  全クラス
                  <Badge variant="outline" className="text-xs">
                    {studentsWithoutMail.length}
                  </Badge>
                </TabsTrigger>
                {sortedClassNames.map((className) => {
                  const classStudentsWithoutMail = studentsWithoutMail.filter(student => 
                    (student.class || "未設定") === className
                  )
                  if (classStudentsWithoutMail.length === 0) return null
                  return (
                    <TabsTrigger key={className} value={className} className="flex items-center gap-2">
                      {className}
                      <Badge variant="outline" className="text-xs">
                        {classStudentsWithoutMail.length}
                      </Badge>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              
              <TabsContent value="all" className="mt-8">
                <div className="space-y-2">
                  {studentsWithoutMail.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {student.student_id || student.id} | クラス: {student.class || "未設定"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMail(student)}
                      >
                        メール登録
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              {sortedClassNames.map((className) => {
                const classStudentsWithoutMail = studentsWithoutMail.filter(student => 
                  (student.class || "未設定") === className
                )
                if (classStudentsWithoutMail.length === 0) return null
                return (
                  <TabsContent key={className} value={className} className="mt-8">
                    <div className="space-y-2">
                      {classStudentsWithoutMail.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {student.student_id || student.id} | クラス: {student.class || "未設定"}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMail(student)}
                          >
                            メール登録
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* メール編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStudent?.mail ? "メールアドレスを編集" : "メールアドレスを登録"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-name">学生名</Label>
              <p className="text-sm text-muted-foreground">{editingStudent?.name}</p>
            </div>
            <div>
              <Label htmlFor="mail">メールアドレス</Label>
              <Input
                id="mail"
                type="email"
                value={newMail}
                onChange={(e) => setNewMail(e.target.value)}
                placeholder="example@example.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingStudent(null)
                  setNewMail("")
                }}
              >
                キャンセル
              </Button>
              <Button onClick={handleUpdateMail}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 