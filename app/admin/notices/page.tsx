"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import { sendNoticeMail } from '@/app/utils/mail'
import { Notice } from "@/types/notice"

export default function NoticesPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [notices, setNotices] = useState<Notice[]>([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [targetType, setTargetType] = useState<'student' | 'parent' | 'all'>('all')
  const [targetClass, setTargetClass] = useState<'昼1' | '昼2' | '昼3' | '夜1' | '夜2' | '夜3' | 'all'>('all')

  useEffect(() => {
    // 管理者認証チェック
    const adminLoggedIn = localStorage.getItem("adminLoggedIn")
    const adminId = localStorage.getItem("adminId")

    if (!adminLoggedIn || !adminId) {
      router.push("/admin/login")
      return
    }

    // お知らせ一覧を取得
    fetchNotices()
  }, [router])

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from("notice")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast({
        title: "エラー",
        description: "お知らせの取得に失敗しました",
        variant: "destructive",
      })
      return
    }

    setNotices(data || [])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルタイプの検証
    if (file.type.startsWith('image/')) {
      setFileType('image')
    } else if (file.type === 'application/pdf') {
      setFileType('pdf')
    } else {
      toast({
        title: "エラー",
        description: "画像（JPG, PNG）またはPDFファイルのみアップロード可能です",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileType}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('notice-attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('notice-attachments')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('ファイルアップロードエラー:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("現在の状態:", { title, content, editingId, targetType, targetClass })

    try {
      if (editingId) {
        // 既存のお知らせを更新
        const { error } = await supabase
          .from("notice")
          .update({
            title,
            content,
            image_url: selectedFile && fileType === 'image' ? await uploadFile(selectedFile) : null,
            pdf_url: selectedFile && fileType === 'pdf' ? await uploadFile(selectedFile) : null,
            file_type: fileType,
            target_type: targetType,
            target_class: targetClass,
          })
          .eq("id", editingId)

        if (error) throw error

        toast({
          title: "成功",
          description: "お知らせを更新しました",
        })
      } else {
        // 新規お知らせを作成
        const { data, error } = await supabase.from("notice").insert([
          {
            title,
            content,
            image_url: selectedFile && fileType === 'image' ? await uploadFile(selectedFile) : null,
            pdf_url: selectedFile && fileType === 'pdf' ? await uploadFile(selectedFile) : null,
            file_type: fileType,
            target_type: targetType,
            target_class: targetClass,
          },
        ]).select().single()

        if (error) throw error

        toast({
          title: "成功",
          description: "お知らせを作成しました",
        })

        // メール送信処理
        if (data && (data.target_type === 'all' || data.target_type === 'parent')) {
          console.log("メール送信処理開始")
          
          // 対象クラスの学生のメールアドレスを取得
          let query = supabase
            .from("students")
            .select("id, mail, hogosya_email")
            .not("mail", "is", null)

          // 特定のクラスが指定されている場合のみ、クラスでフィルタリング
          if (data.target_class && data.target_class !== 'all') {
            query = query.eq("class", data.target_class)
          }

          const { data: students, error: studentsError } = await query

          if (studentsError) {
            console.error("学生メール取得エラー:", studentsError)
            alert("メール送信に失敗しました: 学生データの取得に失敗しました")
          } else {
            console.log("対象学生:", students)
            
            if (students && students.length > 0) {
              let successCount = 0
              let failCount = 0

              // 各学生にメールを送信
              for (const student of students) {
                // 学生のメールアドレスに送信
                if (student.mail) {
                  console.log("学生メール送信開始:", student.mail)
                  const { success, error } = await sendNoticeMail(data, student.mail)
                  console.log("学生メール送信結果:", { success, error })
                  
                  if (success) {
                    successCount++
                  } else {
                    failCount++
                  }
                }

                // 対象者が「全員」の場合、保護者メールアドレスにも送信
                if (data.target_type === 'all' && student.hogosya_email) {
                  console.log("保護者メール送信開始:", student.hogosya_email)
                  const { success, error } = await sendNoticeMail(data, student.hogosya_email)
                  console.log("保護者メール送信結果:", { success, error })
                  
                  if (success) {
                    successCount++
                  } else {
                    failCount++
                  }
                }
              }

              // 送信結果を表示
              if (successCount > 0) {
                alert(`${successCount}件のメールを送信しました${failCount > 0 ? `\n${failCount}件の送信に失敗しました` : ''}`)
              } else {
                alert("メールの送信に失敗しました")
              }
            } else {
              console.log("送信対象の学生が見つかりません")
              alert("送信対象の学生が見つかりません")
            }
          }
        }
      }

      // フォームをリセット
      setTitle("")
      setContent("")
      setEditingId(null)
      setSelectedFile(null)
      setFileType(null)
      setTargetType('all')
      setTargetClass('all')
      fetchNotices()
    } catch (error) {
      console.error('エラー:', error)
      toast({
        title: "エラー",
        description: "お知らせの保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleEdit = (notice: Notice) => {
    console.log("編集ボタンがクリックされました", notice)
    setTitle(notice.title)
    setContent(notice.content)
    setEditingId(notice.id)
    setTargetType(notice.target_type)
    setTargetClass(notice.target_class)
    // 既存のファイル情報を保持
    if (notice.image_url) {
      setFileType('image')
    } else if (notice.pdf_url) {
      setFileType('pdf')
    }
  }

  const handleDelete = async (id: number) => {
    console.log("削除ボタンがクリックされました", id)
    if (!confirm("このお知らせを削除してもよろしいですか？")) {
      return
    }

    const { error } = await supabase.from("notice").delete().eq("id", id)

    if (error) {
      console.error("削除エラー:", error)
      toast({
        title: "エラー",
        description: "お知らせの削除に失敗しました",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "成功",
      description: "お知らせを削除しました",
    })

    fetchNotices()
  }

  useEffect(() => {
    console.log("現在の状態:", { title, content, editingId })
  }, [title, content, editingId])

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle="お知らせ管理" />
      <div className="flex-1 container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brown-800 dark:text-brown-100">
            お知らせ管理
          </h1>
        </div>

        {/* お知らせ作成フォーム */}
        {!editingId && (
          <Card className="mb-8 border-brown-200 dark:border-brown-800">
            <CardHeader>
              <CardTitle className="text-brown-800 dark:text-brown-100">
                新規お知らせを作成
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-brown-700 dark:text-brown-300"
                  >
                    タイトル
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                    placeholder="お知らせのタイトル"
                  />
                </div>
                <div>
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-brown-700 dark:text-brown-300"
                  >
                    内容
                  </label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="mt-1"
                    placeholder="お知らせの内容"
                    rows={5}
                  />
                </div>
                <div>
                  <label
                    htmlFor="target-type"
                    className="block text-sm font-medium text-brown-700 dark:text-brown-300"
                  >
                    対象者
                  </label>
                  <select
                    id="target-type"
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as 'student' | 'parent' | 'all')}
                    className="mt-1 block w-full rounded-md border-brown-300 dark:border-brown-700 bg-white dark:bg-brown-900 text-brown-900 dark:text-brown-100"
                  >
                    <option value="all">全員</option>
                    <option value="student">学生のみ</option>
                    <option value="parent">保護者のみ</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="target-class"
                    className="block text-sm font-medium text-brown-700 dark:text-brown-300"
                  >
                    対象クラス
                  </label>
                  <select
                    id="target-class"
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value as '昼1' | '昼2' | '昼3' | '夜1' | '夜2' | '夜3' | 'all')}
                    className="mt-1 block w-full rounded-md border-brown-300 dark:border-brown-700 bg-white dark:bg-brown-900 text-brown-900 dark:text-brown-100"
                  >
                    <option value="all">全クラス</option>
                    <option value="昼1">昼間部1年</option>
                    <option value="昼2">昼間部2年</option>
                    <option value="昼3">昼間部3年</option>
                    <option value="夜1">夜間部1年</option>
                    <option value="夜2">夜間部2年</option>
                    <option value="夜3">夜間部3年</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="file"
                    className="block text-sm font-medium text-brown-700 dark:text-brown-300"
                  >
                    添付ファイル（画像またはPDF）
                  </label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="mt-1 text-sm text-brown-600 dark:text-brown-400">
                      選択されたファイル: {selectedFile.name}
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-brown-600 hover:bg-brown-700 text-white"
                    disabled={isUploading}
                  >
                    {isUploading ? "アップロード中..." : "作成"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* お知らせ一覧 */}
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id} className="border-brown-200 dark:border-brown-800">
              <CardHeader>
                <CardTitle className="text-brown-800 dark:text-brown-100">
                  {notice.title}
                </CardTitle>
                <CardDescription className="text-brown-600 dark:text-brown-300">
                  作成日: {new Date(notice.created_at).toLocaleString()}
                  {notice.updated_at !== notice.created_at &&
                    ` (更新日: ${new Date(notice.updated_at).toLocaleString()})`}
                  <br />
                  対象: {notice.target_type === 'all' ? '全員' : notice.target_type === 'student' ? '学生のみ' : '保護者のみ'}
                  {notice.target_class !== 'all' && ` (${notice.target_class})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-brown-700 dark:text-brown-200">
                  {notice.content}
                </p>
                {notice.image_url && (
                  <div className="mt-4">
                    <img
                      src={notice.image_url}
                      alt="添付画像"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}
                {notice.pdf_url && (
                  <div className="mt-4">
                    <a
                      href={notice.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      PDFファイルを開く
                    </a>
                  </div>
                )}
                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(notice)}
                    className="border-brown-300 text-brown-600 hover:bg-brown-50 dark:border-brown-700 dark:text-brown-400 dark:hover:bg-brown-900"
                  >
                    編集
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(notice.id)}
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900"
                  >
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* お知らせ編集フォーム */}
        {editingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl border-brown-200 dark:border-brown-800">
              <CardHeader>
                <CardTitle className="text-brown-800 dark:text-brown-100">
                  お知らせを編集
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-title"
                      className="block text-sm font-medium text-brown-700 dark:text-brown-300"
                    >
                      タイトル
                    </label>
                    <Input
                      id="edit-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1"
                      placeholder="お知らせのタイトル"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-content"
                      className="block text-sm font-medium text-brown-700 dark:text-brown-300"
                    >
                      内容
                    </label>
                    <Textarea
                      id="edit-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="mt-1"
                      placeholder="お知らせの内容"
                      rows={5}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-target-type"
                      className="block text-sm font-medium text-brown-700 dark:text-brown-300"
                    >
                      対象者
                    </label>
                    <select
                      id="edit-target-type"
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value as 'student' | 'parent' | 'all')}
                      className="mt-1 block w-full rounded-md border-brown-300 dark:border-brown-700 bg-white dark:bg-brown-900 text-brown-900 dark:text-brown-100"
                    >
                      <option value="all">全員</option>
                      <option value="student">学生のみ</option>
                      <option value="parent">保護者のみ</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="edit-target-class"
                      className="block text-sm font-medium text-brown-700 dark:text-brown-300"
                    >
                      対象クラス
                    </label>
                    <select
                      id="edit-target-class"
                      value={targetClass}
                      onChange={(e) => setTargetClass(e.target.value as '昼1' | '昼2' | '昼3' | '夜1' | '夜2' | '夜3' | 'all')}
                      className="mt-1 block w-full rounded-md border-brown-300 dark:border-brown-700 bg-white dark:bg-brown-900 text-brown-900 dark:text-brown-100"
                    >
                      <option value="all">全クラス</option>
                      <option value="昼1">昼間部1年</option>
                      <option value="昼2">昼間部2年</option>
                      <option value="昼3">昼間部3年</option>
                      <option value="夜1">夜間部1年</option>
                      <option value="夜2">夜間部2年</option>
                      <option value="夜3">夜間部3年</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="edit-file"
                      className="block text-sm font-medium text-brown-700 dark:text-brown-300"
                    >
                      添付ファイル（画像またはPDF）
                    </label>
                    <Input
                      id="edit-file"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="mt-1"
                    />
                    {selectedFile ? (
                      <p className="mt-1 text-sm text-brown-600 dark:text-brown-400">
                        選択されたファイル: {selectedFile.name}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-brown-600 dark:text-brown-400">
                        {notices.find(n => n.id === editingId)?.image_url ? (
                          <span>現在の添付ファイル: 画像</span>
                        ) : notices.find(n => n.id === editingId)?.pdf_url ? (
                          <span>現在の添付ファイル: PDF</span>
                        ) : (
                          <span>添付ファイルなし</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTitle("")
                        setContent("")
                        setEditingId(null)
                        setSelectedFile(null)
                        setFileType(null)
                        setTargetType('all')
                        setTargetClass('all')
                      }}
                    >
                      キャンセル
                    </Button>
                    <Button
                      type="submit"
                      className="bg-brown-600 hover:bg-brown-700 text-white"
                      disabled={isUploading}
                    >
                      {isUploading ? "アップロード中..." : "更新"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 