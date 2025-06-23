"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from "lucide-react"

interface NoticeFormProps {
  onNoticeCreated: () => void
}

export function NoticeForm({ onNoticeCreated }: NoticeFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState('all')
  const [targetClass, setTargetClass] = useState('all')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isBucketReady, setIsBucketReady] = useState(false)
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
      let fileUrl = null
      let fileType = null

      if (file) {
        try {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
          const filePath = fileName

          console.log('ファイルアップロード開始:', {
            fileName,
            fileType: file.type,
            fileSize: file.size,
            timestamp: new Date().toISOString()
          })

          const { error: uploadError, data } = await supabase.storage
            .from('notice-attachments')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('ファイルアップロードエラー:', uploadError)
            throw new Error(`ファイルのアップロードに失敗しました: ${uploadError.message}`)
          }

          console.log('ファイルアップロード成功:', {
            path: data?.path,
            timestamp: new Date().toISOString()
          })

          const { data: { publicUrl } } = supabase.storage
            .from('notice-attachments')
            .getPublicUrl(filePath)

          fileUrl = publicUrl
          fileType = file.type.startsWith('image/') ? 'image' : 'pdf'
        } catch (uploadErr) {
          console.error('ファイルアップロード処理エラー:', uploadErr)
          throw new Error('ファイルのアップロード処理中にエラーが発生しました')
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
            file_type: fileType,
            file_url: fileUrl
          }
        ])

      if (insertError) {
        console.error('お知らせ保存エラー:', insertError)
        throw new Error(`お知らせの保存に失敗しました: ${insertError.message}`)
      }

      // フォームをリセット
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
        <Select value={targetType} onValueChange={setTargetType}>
          <SelectTrigger>
            <SelectValue placeholder="対象を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全員</SelectItem>
            <SelectItem value="students">生徒</SelectItem>
            <SelectItem value="teachers">講師</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetClass">クラス</Label>
        <Select value={targetClass} onValueChange={setTargetClass}>
          <SelectTrigger>
            <SelectValue placeholder="クラスを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全クラス</SelectItem>
            <SelectItem value="a">Aクラス</SelectItem>
            <SelectItem value="b">Bクラス</SelectItem>
            <SelectItem value="c">Cクラス</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">添付ファイル（画像またはPDF）</Label>
        <Input
          id="file"
          type="file"
          accept="image/*,.pdf"
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