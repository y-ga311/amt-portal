"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Search, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StudentListProps {
  students: any[]
  onEdit: (student: any) => void
}

export default function StudentList({ students, onEdit }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("student_id")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // 検索フィルター
  const filteredStudents = students.filter(
    (student) =>
      student.student_id?.toString().includes(searchTerm) ||
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.gakusei_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.hogosya_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ソート
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortField === "student_id") {
      return sortDirection === "asc" ? a.student_id - b.student_id : b.student_id - a.student_id
    }

    const valueA = String(a[sortField] || "")
    const valueB = String(b[sortField] || "")
    return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
  })

  // ソートの切り替え
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // ソートアイコンの表示
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? "↑" : "↓"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-500 dark:text-brown-400" />
          <Input
            placeholder="学生ID、名前、ログインID、クラスで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 border-brown-300 dark:border-brown-700 focus:ring-brown-500"
          />
        </div>
      </div>

      <div className="rounded-md border border-brown-200 dark:border-brown-800">
        <Table>
          <TableHeader className="bg-brown-50 dark:bg-brown-900">
            <TableRow className="border-brown-200 dark:border-brown-800">
              <TableHead
                className="cursor-pointer text-brown-700 dark:text-brown-200"
                onClick={() => toggleSort("student_id")}
              >
                学生番号 {getSortIcon("student_id")}
              </TableHead>
              <TableHead
                className="cursor-pointer text-brown-700 dark:text-brown-200"
                onClick={() => toggleSort("name")}
              >
                氏名 {getSortIcon("name")}
              </TableHead>
              <TableHead
                className="cursor-pointer text-brown-700 dark:text-brown-200"
                onClick={() => toggleSort("gakusei_id")}
              >
                学生用ログインID {getSortIcon("gakusei_id")}
              </TableHead>
              <TableHead
                className="cursor-pointer text-brown-700 dark:text-brown-200"
                onClick={() => toggleSort("hogosya_id")}
              >
                保護者用ログインID {getSortIcon("hogosya_id")}
              </TableHead>
              <TableHead
                className="cursor-pointer text-brown-700 dark:text-brown-200"
                onClick={() => toggleSort("class")}
              >
                クラス {getSortIcon("class")}
              </TableHead>
              <TableHead className="text-brown-700 dark:text-brown-200">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.map((student, index) => (
              <TableRow key={index} className="border-brown-200 dark:border-brown-800">
                <TableCell className="text-brown-700 dark:text-brown-200">{student.student_id}</TableCell>
                <TableCell className="text-brown-700 dark:text-brown-200">{student.name}</TableCell>
                <TableCell className="text-brown-700 dark:text-brown-200">{student.gakusei_id || "-"}</TableCell>
                <TableCell className="text-brown-700 dark:text-brown-200">{student.hogosya_id || "-"}</TableCell>
                <TableCell className="text-brown-700 dark:text-brown-200">{student.class || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(student)}
                    className="flex items-center"
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    編集
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {sortedStudents.length === 0 && (
              <TableRow className="border-brown-200 dark:border-brown-800">
                <TableCell colSpan={6} className="text-center py-4 text-brown-600 dark:text-brown-300">
                  検索結果がありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
