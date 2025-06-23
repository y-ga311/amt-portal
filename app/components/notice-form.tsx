"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from './file-upload'
import { useToast } from '@/components/ui/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Notice } from '@/types/notice'

interface NoticeFormProps {
  onNoticeCreated?: () => void
  initialData?: Notice
}

export function NoticeForm({ onNoticeCreated, initialData }: NoticeFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState('all')
  const [targetClass, setTargetClass] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/admin')
          return
        }
      } catch (error) {
        console.error('セッションチェックエラー:', error)
        router.push('/admin')
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [supabase, router])

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setContent(initialData.content)
      setTargetType(initialData.target_type)
      setTargetClass(initialData.target_class || '')
      setFileUrl(initialData.image_url || '')
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin')
        return
      }

      const { error } = await supabase
        .from('notice')
        .insert([
          {
            title,
            content,
            target_type: targetType,
            target_class: targetClass,
            image_url: fileUrl,
            created_by: session.user.id,
          },
        ])

      if (error) throw error

      toast({
        title: 'お知らせを投稿しました',
        description: '新しいお知らせが正常に投稿されました',
        duration: 3000,
      })

      // フォームをリセット
      setTitle('')
      setContent('')
      setTargetType('all')
      setTargetClass('')
      setFileUrl('')
      setFileType('image')
      onNoticeCreated?.()
    } catch (error) {
      console.error('投稿エラー:', error)
      toast({
        title: '投稿エラー',
        description: 'お知らせの投稿に失敗しました',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          タイトル
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          内容
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="targetType" className="block text-sm font-medium text-gray-700">
          対象
        </label>
        <select
          id="targetType"
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="all">全員</option>
          <option value="class">クラス</option>
        </select>
      </div>

      {targetType === 'class' && (
        <div>
          <label htmlFor="targetClass" className="block text-sm font-medium text-gray-700">
            クラス
          </label>
          <Input
            id="targetClass"
            value={targetClass}
            onChange={(e) => setTargetClass(e.target.value)}
            required
            className="mt-1"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          ファイル
        </label>
        <div className="mt-1">
          <FileUpload
            onUploadComplete={(url, fileName) => {
              setFileUrl(url)
              setFileType(fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image')
            }}
            fileType={fileType}
          />
        </div>
        {fileUrl && (
          <div className="mt-2">
            {fileType === 'image' ? (
              <div className="relative h-40 w-40">
                <Image
                  src={fileUrl}
                  alt="アップロードされた画像"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                アップロードされたPDFを表示
              </a>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setFileUrl('')}
            >
              ファイルを削除
            </Button>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '投稿中...' : '投稿する'}
      </Button>
    </form>
  )
} 