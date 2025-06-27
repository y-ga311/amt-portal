"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Mail, Edit, Save, X, AlertCircle, CheckCircle } from "lucide-react"
import type { Student } from "@/types/student"

interface MailManagementProps {
  students: Student[]
}

interface StudentWithMail extends Student {
  mail?: string
}

export default function MailManagement({ students }: MailManagementProps) {
  const [studentsWithMail, setStudentsWithMail] = useState<StudentWithMail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentWithMail | null>(null)
  const [editingMail, setEditingMail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchStudentsWithMail()
  }, [students])

  const fetchStudentsWithMail = async () => {
    try {
      setIsLoading(true)
      
      // studentsテーブルからメール情報を含む学生データを取得
      const { data, error } = await supabase
        .from("students")
        .select("id, student_id, name, gakusei_id, class, mail, created_at, updated_at")
        .order("student_id", { ascending: true })

      if (error) {
        console.error("学生データ取得エラー:", error)
        toast({
          title: "エラー",
          description: "学生データの取得に失敗しました",
          variant: "destructive",
        })
        return
      }

      setStudentsWithMail(data || [])
    } catch (error) {
      console.error("学生データ取得エラー:", error)
      toast({
        title: "エラー",
        description: "学生データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // メールアドレスが未登録の学生をフィルタリング
  const studentsWithoutMail = studentsWithMail.filter(student => 
    !student.mail || student.mail.trim() === ""
  )

  // メールアドレスが登録済みの学生をフィルタリング
  const studentsWithMailRegistered = studentsWithMail.filter(student => 
    student.mail && student.mail.trim() !== ""
  )

  const handleEditMail = (student: StudentWithMail) => {
    setEditingStudent(student)
    setEditingMail(student.mail || "")
    setIsEditDialogOpen(true)
  }

  const handleSaveMail = async () => {
    if (!editingStudent) return

    try {
      setIsSaving(true)

      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (editingMail.trim() !== "" && !emailRegex.test(editingMail)) {
        toast({
          title: "エラー",
          description: "正しいメールアドレスの形式で入力してください",
          variant: "destructive",
        })
        return
      }

      // データベースを更新
      const { error } = await supabase
        .from("students")
        .update({ 
          mail: editingMail.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingStudent.id)

      if (error) {
        console.error("メールアドレス更新エラー:", error)
        toast({
          title: "エラー",
          description: "メールアドレスの更新に失敗しました",
          variant: "destructive",
        })
        return
      }

      // ローカル状態を更新
      setStudentsWithMail(prev => 
        prev.map(student => 
          student.id === editingStudent.id 
            ? { ...student, mail: editingMail.trim() || undefined }
            : student
        )
      )

      toast({
        title: "成功",
        description: "メールアドレスを更新しました",
      })

      setIsEditDialogOpen(false)
      setEditingStudent(null)
      setEditingMail("")
    } catch (error) {
      console.error("メールアドレス更新エラー:", error)
      toast({
        title: "エラー",
        description: "メールアドレスの更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefresh = () => {
    fetchStudentsWithMail()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brown-600 mx-auto mb-2"></div>
          <p className="text-brown-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-brown-200 dark:border-brown-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brown-600 dark:text-brown-400">総学生数</p>
                <p className="text-2xl font-bold text-brown-800 dark:text-brown-200">
                  {studentsWithMail.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-brown-100 dark:bg-brown-800 rounded-full flex items-center justify-center">
                <Mail className="h-4 w-4 text-brown-600 dark:text-brown-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brown-200 dark:border-brown-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brown-600 dark:text-brown-400">メール未登録</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {studentsWithoutMail.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brown-200 dark:border-brown-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brown-600 dark:text-brown-400">メール登録済み</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {studentsWithMailRegistered.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* メール未登録学生一覧 */}
      <Card className="border-brown-200 dark:border-brown-800">
        <CardHeader className="bg-red-50 dark:bg-red-900/20 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-red-800 dark:text-red-200">メールアドレス未登録</CardTitle>
              <CardDescription className="text-red-600 dark:text-red-300">
                メールアドレスが登録されていない学生一覧
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
            >
              更新
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {studentsWithoutMail.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="text-green-600 font-medium">すべての学生にメールアドレスが登録されています</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生番号</TableHead>
                    <TableHead>名前</TableHead>
                    <TableHead>学生用ログインID</TableHead>
                    <TableHead>クラス</TableHead>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithoutMail.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.gakusei_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.class}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600 dark:text-red-400">未登録</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMail(student)}
                          className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-300 dark:hover:bg-brown-900"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          編集
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* メール登録済み学生一覧 */}
      <Card className="border-brown-200 dark:border-brown-800">
        <CardHeader className="bg-green-50 dark:bg-green-900/20 rounded-t-lg">
          <CardTitle className="text-green-800 dark:text-green-200">メールアドレス登録済み</CardTitle>
          <CardDescription className="text-green-600 dark:text-green-300">
            メールアドレスが登録されている学生一覧
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {studentsWithMailRegistered.length === 0 ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-600 font-medium">メールアドレスが登録されている学生はいません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生番号</TableHead>
                    <TableHead>名前</TableHead>
                    <TableHead>学生用ログインID</TableHead>
                    <TableHead>クラス</TableHead>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithMailRegistered.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.gakusei_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.class}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 dark:text-green-400">{student.mail}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMail(student)}
                          className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-300 dark:hover:bg-brown-900"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          編集
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* メール編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>メールアドレスの編集</DialogTitle>
            <DialogDescription>
              {editingStudent?.name}さんのメールアドレスを編集してください
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="student_id" className="text-right">
                学生番号
              </Label>
              <Input
                id="student_id"
                value={editingStudent?.student_id || ""}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                名前
              </Label>
              <Input
                id="name"
                value={editingStudent?.name || ""}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mail" className="text-right">
                メールアドレス
              </Label>
              <Input
                id="mail"
                type="email"
                value={editingMail}
                onChange={(e) => setEditingMail(e.target.value)}
                className="col-span-3"
                placeholder="example@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-1" />
              キャンセル
            </Button>
            <Button
              onClick={handleSaveMail}
              disabled={isSaving}
              className="bg-brown-600 hover:bg-brown-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  保存
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 