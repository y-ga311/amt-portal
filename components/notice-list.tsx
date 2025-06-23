"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, Trash2 } from "lucide-react"
import Image from 'next/image'

interface Notice {
  id: number
  title: string
  content: string
  target_type: string
  target_class: string
  file_type: 'image' | 'pdf' | null
  image_url: string | null
  created_at: string
}

interface NoticeListProps {
  notices: Notice[]
}

export function NoticeList({ notices }: NoticeListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()

  const handleDelete = async (id: number) => {
    if (!confirm('このお知らせを削除してもよろしいですか？')) {
      return
    }

    setDeletingId(id)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('notice')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error('お知らせの削除に失敗しました')
      }

      // ページをリロードして一覧を更新
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'all':
        return '全員'
      case 'students':
        return '生徒'
      case 'teachers':
        return '講師'
      default:
        return type
    }
  }

  const getTargetClassLabel = (class_: string) => {
    switch (class_) {
      case 'all':
        return '全クラス'
      case 'a':
        return 'Aクラス'
      case 'b':
        return 'Bクラス'
      case 'c':
        return 'Cクラス'
      default:
        return class_
    }
  }

  if (notices.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        お知らせはまだありません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="bg-white border rounded-lg p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{notice.title}</h3>
                <p className="text-sm text-gray-500">
                  {formatDate(notice.created_at)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(notice.id)}
                disabled={deletingId === notice.id}
              >
                {deletingId === notice.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-red-500" />
                )}
              </Button>
            </div>

            <div className="text-sm text-gray-600 whitespace-pre-wrap">
              {notice.content}
            </div>

            <div className="flex gap-2 text-xs text-gray-500">
              <span>{getTargetTypeLabel(notice.target_type)}</span>
              <span>•</span>
              <span>{getTargetClassLabel(notice.target_class)}</span>
            </div>

            {notice.file_type === 'image' && notice.image_url && (
              <div className="mt-2">
                <Image
                  src={notice.image_url}
                  alt={notice.title}
                  width={200}
                  height={200}
                  className="rounded-lg object-cover"
                />
              </div>
            )}

            {notice.file_type === 'pdf' && (
              <div className="mt-2">
                <a
                  href={notice.image_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  PDFファイルを開く
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 