"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import Link from "next/link"
import { ChevronLeft, AlertCircle, Database, RefreshCw, Plus, Mail } from "lucide-react"
import StudentImport from "@/app/components/student-import"
import StudentExport from "@/app/components/student-export"
import type { Student } from "@/types/student"
import StudentList from "@/app/components/student-list"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getStudents, checkDatabaseStructure } from "@/app/actions/students"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MailManagement from "@/app/components/mail-management"

// 利用可能な期生のリスト（必要に応じて追加）
const availablePeriods = ['22期生', '23期生', '24期生', '25期生', '26期生', '27期生', '28期生', '29期生', '30期生'] as const

// クラスオプションを動的に生成
const generateClassOptions = (): string[] => {
  const options: string[] = []
  availablePeriods.forEach(period => {
    options.push(`${period}昼間部`)
    options.push(`${period}夜間部`)
  })
  return options
}

const classOptions = generateClassOptions()

export default function StudentsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [dataSource, setDataSource] = useState<string>("loading")
  const [error, setError] = useState<string>("")
  const [dbStructure, setDbStructure] = useState<any>(null)
  const [isCheckingDb, setIsCheckingDb] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // データベース構造を確認
        const structureResult = await checkDatabaseStructure()
        console.log("データベース構造:", structureResult)
        console.log("studentsテーブルのカラム:", structureResult.studentsColumns)
        console.log("test_scoresテーブルのカラム:", structureResult.testScoresColumns)

        // 学生データを取得
        const result = await getStudents()
        if (result.success) {
          setStudents(result.data)
          setIsLoading(false)
        } else {
          console.error("学生データ取得エラー:", result.error)
          toast({
            title: "エラー",
            description: "学生データの取得に失敗しました",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("データ取得エラー:", error)
        toast({
          title: "エラー",
          description: "データの取得に失敗しました",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [])

  const loadFromLocalStorage = () => {
    try {
      const cachedStudents = localStorage.getItem("cachedStudents")
      if (cachedStudents) {
        const parsedStudents = JSON.parse(cachedStudents)
        if (Array.isArray(parsedStudents) && parsedStudents.length > 0) {
          setStudents(parsedStudents)
          return true
        }
      }
      return false
    } catch (e) {
      console.error("キャッシュデータの解析エラー:", e)
      return false
    }
  }

  const fetchStudents = async () => {
    try {
      console.log("学生データ取得を開始します")
      setError("")

      // サーバーアクションを使用して学生データを取得
      const result = await getStudents()

      if (!result.success) {
        console.error("学生データ取得エラー:", result.error)
        setError(result.error || "学生データの取得に失敗しました")
        // ローカルストレージのデータを使用
        return loadFromLocalStorage()
      }

      if (!result.data || result.data.length === 0) {
        console.log("データがありません")
        setDataSource("no_data")
        return false
      }

      console.log(result.source + "から", result.data.length, "件の学生データを取得しました")
      setStudents(result.data)
      setDataSource(result.source || "unknown")

      // 取得したデータをローカルストレージにもキャッシュ
      localStorage.setItem("cachedStudents", JSON.stringify(result.data))
      return true
    } catch (error) {
      console.error("学生データ取得エラー:", error)
      setError(error instanceof Error ? error.message : "学生データの取得に失敗しました")
      // ローカルストレージのデータを使用
      return loadFromLocalStorage()
    }
  }

  // サーバーデータとローカルデータをマージする関数
  const mergeStudentData = (localStudents: any[], serverStudents: any[]) => {
    const studentMap = new Map()

    // ローカルデータを先にマップに追加
    localStudents.forEach((student) => {
      studentMap.set(student.student_id, student)
    })

    // サーバーデータで上書き
    serverStudents.forEach((student) => {
      if (studentMap.has(student.student_id)) {
        // 既存の学生情報がある場合、名前だけ更新（パスワードはローカルのものを保持）
        const existingStudent = studentMap.get(student.student_id)
        studentMap.set(student.student_id, {
          ...existingStudent,
          name: student.name || existingStudent.name,
        })
      } else {
        // 新しい学生情報
        studentMap.set(student.student_id, student)
      }
    })

    return Array.from(studentMap.values())
  }

  // 学生データ更新のためのハンドラ
  const handleStudentImportSuccess = (newStudents: Student[]) => {
    try {
      // 新しい学生データを既存のデータと結合
      const updatedStudents = mergeStudentData(students, newStudents)
      setStudents(updatedStudents)

      // キャッシュを更新
      localStorage.setItem("cachedStudents", JSON.stringify(updatedStudents))

      // データ再取得
      fetchStudents().catch((err) => {
        console.error("データ再取得エラー:", err)
      })
    } catch (error) {
      console.error("データ更新エラー:", error)
      setError("学生情報の更新中にエラーが発生しました")
      toast({
        title: "警告",
        description: "学生情報の更新中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const handleCheckDbStructure = async () => {
    try {
      setIsCheckingDb(true)
      console.log("データベース構造を確認します")

      // サーバーアクションを使用してデータベース構造を確認
      const result = await checkDatabaseStructure()

      if (!result.success) {
        throw new Error(result.error || "データベース構造の確認に失敗しました")
      }

      setDbStructure(result)
      toast({
        title: "データベース構造確認",
        description: "データベース構造を確認しました",
      })
    } catch (error) {
      console.error("データベース構造確認エラー:", error)
      setError("データベース構造の確認に失敗しました")
      toast({
        title: "エラー",
        description: "データベース構造の確認に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsCheckingDb(false)
    }
  }

  const handleEdit = (student: any) => {
    setEditingStudent({
      ...student,
      gakusei_id: student.gakusei_id || "",
      gakusei_password: student.gakusei_password || "",
      hogosya_id: student.hogosya_id || "",
      hogosya_pass: student.hogosya_pass || "",
      class: student.class || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateStudent = async () => {
    if (!editingStudent) return

    try {
      // 必須フィールドのバリデーション
      if (!editingStudent.name) {
        toast({
          title: "エラー",
          description: "名前は必須です",
          variant: "destructive",
        })
        return
      }

      // 学生情報を更新
      const { data, error } = await supabase
        .from('students')
        .update({
          name: editingStudent.name,
          gakusei_id: editingStudent.gakusei_id,
          gakusei_password: editingStudent.gakusei_password,
          hogosya_id: editingStudent.hogosya_id,
          hogosya_pass: editingStudent.hogosya_pass,
          class: editingStudent.class,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingStudent.id)
        .select()

      if (error) {
        console.error("学生情報更新エラー:", error.message)
        toast({
          title: "エラー",
          description: `学生情報の更新に失敗しました: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      if (!data || data.length === 0) {
        console.error("学生情報更新エラー: 更新されたデータが見つかりません")
        toast({
          title: "エラー",
          description: "学生情報の更新に失敗しました: 更新されたデータが見つかりません",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "成功",
        description: "学生情報を更新しました",
      })

      // 学生一覧を更新
      await fetchStudents()
      setIsEditDialogOpen(false)
      setEditingStudent(null)
    } catch (err) {
      console.error("予期せぬエラー:", err)
      toast({
        title: "エラー",
        description: "予期せぬエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    try {
      // まず関連するテストスコアを削除
      const { error: testScoresError } = await supabase
        .from('test_scores')
        .delete()
        .eq('student_id', studentId)

      if (testScoresError) {
        console.error("テストスコア削除エラー:", testScoresError)
        toast({
          title: "エラー",
          description: "関連するテストスコアの削除に失敗しました",
          variant: "destructive",
        })
        return
      }

      // その後、学生を削除
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (studentError) {
        throw studentError
      }

      toast({
        title: "成功",
        description: "学生と関連するテストスコアを削除しました",
      })

      // 学生一覧を更新
      await fetchStudents()
    } catch (error) {
      console.error("学生削除エラー:", error)
      toast({
        title: "エラー",
        description: "学生の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleAddStudent = async (student: Omit<Student, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          ...student,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error("登録されたデータが見つかりません")
      }

      toast({
        title: "成功",
        description: "学生を登録しました",
      })

      // 学生一覧を更新
      await fetchStudents()
    } catch (error) {
      console.error("学生登録エラー:", error)
      toast({
        title: "エラー",
        description: "学生の登録に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (studentToDelete) {
      await handleDeleteStudent(studentToDelete.id)
      setIsDeleteDialogOpen(false)
      setStudentToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brown-50 dark:bg-brown-950">
        <div className="text-center">
          <CharacterIcon size={80} animated={true} className="mx-auto mb-4" />
          <p className="text-brown-600 dark:text-brown-300">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle="学生管理" />
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
            >
              <Link href="/admin/dashboard" className="flex items-center">
                <ChevronLeft className="mr-1 h-4 w-4" />
                ダッシュボードに戻る
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckDbStructure}
              disabled={isCheckingDb}
              className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
            >
              {isCheckingDb ? (
                <>
                  <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                  確認中...
                </>
              ) : (
                <>
                  <Database className="mr-1 h-4 w-4" />
                  DB構造確認
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {dataSource && dataSource !== "loading" && (
            <Alert className="mb-4 bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-100">
              <Database className="h-4 w-4" />
              <AlertDescription>
                データソース:{" "}
                {dataSource === "students_table"
                  ? "学生テーブル"
                  : dataSource === "test_scores_table"
                    ? "テスト結果テーブル"
                    : dataSource === "local_storage"
                      ? "ローカルストレージ"
                      : dataSource === "no_data"
                        ? "データなし"
                        : dataSource}
              </AlertDescription>
            </Alert>
          )}

          {dbStructure && (
            <Alert className="mb-4 bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-100">
              <Database className="h-4 w-4" />
              <div className="flex flex-col">
                <p className="font-bold">データベース構造:</p>
                <p>studentsテーブルのカラム: {dbStructure.studentsColumns.join(", ") || "なし"}</p>
                {dbStructure.studentsError && (
                  <p className="text-yellow-600 dark:text-yellow-400">注意: {dbStructure.studentsError}</p>
                )}
                <p>test_scoresテーブルのカラム: {dbStructure.testScoresColumns.join(", ") || "なし"}</p>
                {dbStructure.testScoresError && <p className="text-red-500">エラー: {dbStructure.testScoresError}</p>}
              </div>
            </Alert>
          )}

          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">学生一覧</TabsTrigger>
              <TabsTrigger value="import">データ管理</TabsTrigger>
              <TabsTrigger value="mail">メール管理</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
            <Card className="border-brown-200 dark:border-brown-800">
              <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <CharacterIcon size={40} />
                  <div>
                    <CardTitle className="text-brown-800 dark:text-brown-100">学生一覧</CardTitle>
                    <CardDescription className="text-brown-600 dark:text-brown-300">
                      登録されているすべての学生
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="bg-white dark:bg-brown-900">
                  <StudentList
                    students={students}
                    onEdit={handleEdit}
                    onDelete={handleDeleteStudent}
                  />
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <Card className="border-brown-200 dark:border-brown-800">
                <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-8 w-8 text-brown-600 dark:text-brown-400" />
                    <div>
                      <CardTitle className="text-brown-800 dark:text-brown-100">データ管理</CardTitle>
                      <CardDescription className="text-brown-600 dark:text-brown-300">
                        学生データの一括管理
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="bg-white dark:bg-brown-900 p-6">
                  <div className="grid gap-6">
                    <div className="border-b border-brown-200 dark:border-brown-800 pb-4">
                      <div className="flex justify-between items-center mb-4">
                        <Button
                          onClick={() => setIsAddDialogOpen(true)}
                          className="bg-brown-600 hover:bg-brown-700 text-white"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          新規登録
                        </Button>
                      </div>
                      <StudentImport onImportSuccess={handleStudentImportSuccess} />
                    </div>
                    <div>
                      <StudentExport students={students} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mail" className="space-y-4">
              <Card className="border-brown-200 dark:border-brown-800">
                <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-8 w-8 text-brown-600 dark:text-brown-400" />
                    <div>
                      <CardTitle className="text-brown-800 dark:text-brown-100">メール管理</CardTitle>
                      <CardDescription className="text-brown-600 dark:text-brown-300">
                        メールアドレスが未登録の学生の管理
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="bg-white dark:bg-brown-900 p-6">
                  <MailManagement students={students} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>学生情報の編集</DialogTitle>
            <DialogDescription>
              学生の情報を編集してください
            </DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <form onSubmit={(e) => {
              e.preventDefault()
              handleUpdateStudent()
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="student_id" className="text-right">
                    学生番号
                  </Label>
                  <Input
                    id="student_id"
                    value={editingStudent.id}
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
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gakusei_id" className="text-right">
                    学生用ログインID
                  </Label>
                  <Input
                    id="gakusei_id"
                    value={editingStudent.gakusei_id}
                    onChange={(e) => setEditingStudent({ ...editingStudent, gakusei_id: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gakusei_password" className="text-right">
                    学生用パスワード
                  </Label>
                  <Input
                    id="gakusei_password"
                    type="text"
                    value={editingStudent.gakusei_password}
                    onChange={(e) => setEditingStudent({ ...editingStudent, gakusei_password: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hogosya_id" className="text-right">
                    保護者用ログインID
                  </Label>
                  <Input
                    id="hogosya_id"
                    value={editingStudent.hogosya_id}
                    onChange={(e) => setEditingStudent({ ...editingStudent, hogosya_id: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hogosya_pass" className="text-right">
                    保護者用パスワード
                  </Label>
                  <Input
                    id="hogosya_pass"
                    type="text"
                    value={editingStudent.hogosya_pass}
                    onChange={(e) => setEditingStudent({ ...editingStudent, hogosya_pass: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="class" className="text-right">
                    クラス
                  </Label>
                  <Input
                    id="class"
                    value={editingStudent.class}
                    onChange={(e) => setEditingStudent({ ...editingStudent, class: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit">更新</Button>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (editingStudent) {
                      handleDeleteClick(editingStudent)
                      setIsEditDialogOpen(false)
                    }
                  }}
                >
                  削除
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>学生の削除</DialogTitle>
            <DialogDescription>
              {studentToDelete && (
                <>
                  <p>以下の学生を削除してもよろしいですか？</p>
                  <p className="font-bold mt-2">{studentToDelete.name}</p>
                  <p className="text-sm text-gray-500">学生番号: {studentToDelete.id}</p>
                  <p className="text-sm text-red-500 mt-2">
                    注意: この操作は取り消せません。関連するテストスコアも削除されます。
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新規登録ダイアログ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新規学生登録</DialogTitle>
            <DialogDescription>
              新しい学生の情報を入力してください
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const newStudent = {
              name: formData.get('name') as string,
              gakusei_id: formData.get('gakusei_id') as string,
              gakusei_password: formData.get('gakusei_password') as string,
              hogosya_id: formData.get('hogosya_id') as string,
              hogosya_pass: formData.get('hogosya_pass') as string,
              class: formData.get('class') as string,
            }
            await handleAddStudent(newStudent)
            setIsAddDialogOpen(false)
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  名前
                </Label>
                <Input
                  id="name"
                  name="name"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gakusei_id" className="text-right">
                  学生用ログインID
                </Label>
                <Input
                  id="gakusei_id"
                  name="gakusei_id"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gakusei_password" className="text-right">
                  学生用パスワード
                </Label>
                <Input
                  id="gakusei_password"
                  name="gakusei_password"
                  type="text"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hogosya_id" className="text-right">
                  保護者用ログインID
                </Label>
                <Input
                  id="hogosya_id"
                  name="hogosya_id"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hogosya_pass" className="text-right">
                  保護者用パスワード
                </Label>
                <Input
                  id="hogosya_pass"
                  name="hogosya_pass"
                  type="text"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  クラス
                </Label>
                <Input
                  id="class"
                  name="class"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit">登録</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
