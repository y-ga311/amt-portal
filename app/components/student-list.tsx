import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Student } from "@/types/student"
import { Pencil, Trash2, Plus } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export type StudentListProps = {
  students: Student[]
  onEdit: (student: Student) => void
  onDelete: (studentId: string) => Promise<void>
  onAdd: (student: Omit<Student, "id" | "created_at" | "updated_at">) => Promise<void>
}

export default function StudentList({ students, onEdit, onDelete, onAdd }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [newStudent, setNewStudent] = useState<Omit<Student, "id" | "created_at" | "updated_at">>({
    name: "",
    gakusei_id: "",
    gakusei_password: "",
    hogosya_id: "",
    hogosya_pass: "",
    class: ""
  })
  const { toast } = useToast()

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      student.id.toLowerCase().includes(searchLower) ||
      student.name.toLowerCase().includes(searchLower) ||
      student.gakusei_id.toLowerCase().includes(searchLower) ||
      student.class?.toLowerCase().includes(searchLower) ||
      false
    )
  })

  const handleAdd = () => {
    if (!newStudent.name) {
      toast({
        title: "エラー",
        description: "名前は必須です",
        variant: "destructive",
      })
      return
    }

    onAdd(newStudent)
    setIsAddDialogOpen(false)
    setNewStudent({
      name: "",
      gakusei_id: "",
      gakusei_password: "",
      hogosya_id: "",
      hogosya_pass: "",
      class: ""
    })
  }

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (studentToDelete) {
      onDelete(studentToDelete.id)
      setIsDeleteDialogOpen(false)
      setStudentToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="学生ID、名前、ログインID、クラスで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-brown-600 hover:bg-brown-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          新規登録
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学生番号</TableHead>
            <TableHead>氏名</TableHead>
            <TableHead>学生用ログインID</TableHead>
            <TableHead>保護者用ログインID</TableHead>
            <TableHead>クラス</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents.map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.id}</TableCell>
              <TableCell>{student.name}</TableCell>
              <TableCell>{student.gakusei_id}</TableCell>
              <TableCell>{student.hogosya_id}</TableCell>
              <TableCell>{student.class}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(student)}
                    className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(student)}
                    className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 新規登録ダイアログ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>学生の新規登録</DialogTitle>
            <DialogDescription>
              新しい学生の情報を入力してください
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            handleAdd()
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  名前
                </Label>
                <Input
                  id="name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
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
                  value={newStudent.gakusei_id}
                  onChange={(e) => setNewStudent({ ...newStudent, gakusei_id: e.target.value })}
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
                  value={newStudent.gakusei_password}
                  onChange={(e) => setNewStudent({ ...newStudent, gakusei_password: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hogosya_id" className="text-right">
                  保護者用ログインID
                </Label>
                <Input
                  id="hogosya_id"
                  value={newStudent.hogosya_id}
                  onChange={(e) => setNewStudent({ ...newStudent, hogosya_id: e.target.value })}
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
                  value={newStudent.hogosya_pass}
                  onChange={(e) => setNewStudent({ ...newStudent, hogosya_pass: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  クラス
                </Label>
                <Input
                  id="class"
                  value={newStudent.class}
                  onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
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
    </div>
  )
} 