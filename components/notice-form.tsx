"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Upload } from "lucide-react"

interface NoticeFormProps {
  onNoticeCreated: () => void
}

// 期生の型定義を動的に生成
type PeriodType = '22期生' | '23期生' | '24期生' | '25期生' | '26期生' | '27期生' | '28期生' | '29期生' | '30期生'
type ClassType = `${PeriodType}昼間部` | `${PeriodType}夜間部`

// 利用可能な期生のリスト（必要に応じて追加）
const availablePeriods: PeriodType[] = ['22期生', '23期生', '24期生', '25期生', '26期生', '27期生', '28期生', '29期生', '30期生']

// クラスオプションを動的に生成
const generateClassOptions = (): ClassType[] => {
  const options: ClassType[] = []
  availablePeriods.forEach(period => {
    options.push(`${period}昼間部` as ClassType)
    options.push(`${period}夜間部` as ClassType)
  })
  return options
}

const classOptions = generateClassOptions()

export function NoticeForm({ onNoticeCreated }: NoticeFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState<'student' | 'parent' | 'all'>('all')
  const [targetClass, setTargetClass] = useState<ClassType | 'all'>('all')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isBucketReady, setIsBucketReady] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // バケットの存在確認
  useEffect(() => {
    const checkBucket = async () => {
      try {
        console.log('バケット確認開始:', {
          timestamp: new Date().toISOString()
        })

        const { data: buckets, error } = await supabase
          .storage
          .listBuckets()

        if (error) {
          console.error('バケット一覧の取得エラー:', {
            error,
            timestamp: new Date().toISOString()
          })
          return
        }

        console.log('利用可能なバケット:', {
          buckets: buckets?.map(b => ({
            name: b.name,
            id: b.id,
            public: b.public,
            created_at: b.created_at
          })),
          timestamp: new Date().toISOString()
        })

        if (!buckets || buckets.length === 0) {
          console.error('バケットが存在しません:', {
            timestamp: new Date().toISOString()
          })
          setError('ストレージの設定が完了していません。管理者にお問い合わせください。')
          return
        }

        const noticeBucket = buckets.find(b => b.name === 'notice-attachments')
        if (!noticeBucket) {
          console.error('notice-attachmentsバケットが見つかりません:', {
            availableBuckets: buckets.map(b => b.name),
            timestamp: new Date().toISOString()
          })
          setError('ストレージの設定が完了していません。管理者にお問い合わせください。')
          return
        }

        console.log('notice-attachmentsバケットの設定:', {
          name: noticeBucket.name,
          id: noticeBucket.id,
          public: noticeBucket.public,
          created_at: noticeBucket.created_at,
          timestamp: new Date().toISOString()
        })

        setIsBucketReady(true)
      } catch (err) {
        console.error('バケット確認エラー:', {
          error: err,
          timestamp: new Date().toISOString()
        })
        setError('ストレージの接続に失敗しました。管理者にお問い合わせください。')
      }
    }

    checkBucket()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!isBucketReady) {
      setError('ストレージの準備ができていません。管理者にお問い合わせください。')
      setIsLoading(false)
      return
    }

    try {
      let imageUrl = null
      let pdfUrl = null
      let fileType: 'image' | 'pdf' | null = null

      if (file) {
        const fileExt = file.name.split('.').pop()?.toLowerCase()
        if (fileExt === 'pdf') {
          fileType = 'pdf'
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '')) {
          fileType = 'image'
        } else {
          toast({
            title: "エラー",
            description: "PDFまたは画像ファイルのみアップロード可能です",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        const fileName = `${Date.now()}-${file.name}`
        const { data, error } = await supabase.storage
          .from('notice-attachments')
          .upload(fileName, file)

        if (error) {
          throw error
        }

        const { data: { publicUrl } } = supabase.storage
          .from('notice-attachments')
          .getPublicUrl(fileName)

        if (fileType === 'pdf') {
          pdfUrl = publicUrl
        } else {
          imageUrl = publicUrl
        }
      }

      const { error: insertError } = await supabase
        .from('notice')
        .insert([
          {
            title,
            content,
            target_type: targetType,
            target_class: targetClass,
            image_url: imageUrl,
            pdf_url: pdfUrl,
            file_type: fileType,
          }
        ])

      if (insertError) {
        console.error('お知らせ保存エラー:', insertError)
        throw new Error(`お知らせの保存に失敗しました: ${insertError.message}`)
      }

      toast({
        title: "成功",
        description: "お知らせを作成しました",
      })

      setTitle('')
      setContent('')
      setTargetType('all')
      setTargetClass('all')
      setFile(null)
      onNoticeCreated()
    } catch (err) {
      console.error('フォーム送信エラー:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="お知らせのタイトル"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">内容</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          placeholder="お知らせの内容"
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetType">対象</Label>
        <Select value={targetType} onValueChange={(value) => setTargetType(value as 'student' | 'parent' | 'all')}>
          <SelectTrigger>
            <SelectValue placeholder="対象を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全員</SelectItem>
            <SelectItem value="student">学生のみ</SelectItem>
            <SelectItem value="parent">保護者のみ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetClass">クラス</Label>
        <Select value={targetClass} onValueChange={(value) => setTargetClass(value as ClassType | 'all')}>
          <SelectTrigger>
            <SelectValue placeholder="対象クラスを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全クラス</SelectItem>
            {classOptions.map((classOption) => (
              <SelectItem key={classOption} value={classOption}>
                {classOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">添付ファイル（画像またはPDF）</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={!isBucketReady}
        />
        {file && (
          <p className="text-sm text-gray-500">
            選択されたファイル: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
        {!isBucketReady && (
          <p className="text-sm text-yellow-500">
            ファイルアップロード機能は現在利用できません
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !isBucketReady}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            送信中...
          </>
        ) : (
          'お知らせを投稿'
        )}
      </Button>
    </form>
  )
} 