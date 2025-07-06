import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil, Trash2 } from "lucide-react"
import { Student } from "@/types/student"

export type StudentListProps = {
  students: Student[]
  onEdit: (student: Student) => void
  onDelete: (studentId: string) => Promise<void>
}

export default function StudentList({ students, onEdit, onDelete }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)

  const filteredStudents = students.filter((student) =>
    String(student.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.gakusei_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.class && student.class.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学生番号</TableHead>
            <TableHead>氏名</TableHead>
            <TableHead>学生用ログインID</TableHead>
            <TableHead>保護者用ログインID</TableHead>
            <TableHead>クラス</TableHead>
            <TableHead>最新ログイン</TableHead>
            <TableHead>ログイン回数</TableHead>
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
              <TableCell>
                {student.last_login ? (
                  <span title={new Date(student.last_login).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}>
                    {(() => {
                      const date = new Date(student.last_login)
                      // デバッグ用：記録時刻と表示時刻をコンソールに出力
                      console.log(`学生ID ${student.id}: 記録時刻=${student.last_login}, ローカル時刻=${date.toLocaleString()}, UTC時刻=${date.toISOString()}`)
                      
                      // 記録されている時刻が既に日本時間かどうかを判定
                      // もし記録時刻が日本時間なら、そのまま表示
                      const japanTime = new Intl.DateTimeFormat('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }).format(date)
                      return japanTime
                    })()}
                  </span>
                ) : (
                  <span className="text-gray-400">未ログイン</span>
                )}
              </TableCell>
              <TableCell>{student.login_count || 0}</TableCell>
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