"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { NoticeForm } from './notice-form'

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

export function NoticeList({ notices: initialNotices }: NoticeListProps) {
  const [notices, setNotices] = useState(initialNotices)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleDelete = async (id: number) => {
    if (!confirm('このお知らせを削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('notice')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotices(notices.filter(notice => notice.id !== id))
      toast({
        title: '削除完了',
        description: 'お知らせを削除しました',
      })
    } catch (error) {
      console.error('削除エラー:', error)
      toast({
        title: '削除エラー',
        description: 'お知らせの削除に失敗しました',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice)
  }

  const handleUpdate = async (updatedNotice: Notice) => {
    try {
      const { error } = await supabase
        .from('notice')
        .update({
          title: updatedNotice.title,
          content: updatedNotice.content,
          target_type: updatedNotice.target_type,
          target_class: updatedNotice.target_class,
          file_type: updatedNotice.file_type,
          image_url: updatedNotice.image_url,
        })
        .eq('id', updatedNotice.id)

      if (error) throw error

      setNotices(notices.map(notice => 
        notice.id === updatedNotice.id ? updatedNotice : notice
      ))
      setEditingNotice(null)
      toast({
        title: '更新完了',
        description: 'お知らせを更新しました',
      })
    } catch (error) {
      console.error('更新エラー:', error)
      toast({
        title: '更新エラー',
        description: 'お知らせの更新に失敗しました',
        variant: 'destructive',
      })
    }
  }

  if (editingNotice) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">お知らせを編集</h3>
        <NoticeForm
          initialData={editingNotice}
          onSuccess={() => setEditingNotice(null)}
        />
        <Button
          variant="outline"
          onClick={() => setEditingNotice(null)}
          className="mt-4"
        >
          キャンセル
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notices.map(notice => (
        <div
          key={notice.id}
          className="border rounded-lg p-4 space-y-2"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold">{notice.title}</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(notice)}
              >
                編集
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(notice.id)}
              >
                削除
              </Button>
            </div>
          </div>
          
          <p className="text-gray-600">{notice.content}</p>
          
          <div className="text-sm text-gray-500">
            <p>対象: {notice.target_type === 'all' ? '全員' : notice.target_type}</p>
            <p>クラス: {notice.target_class === 'all' ? '全クラス' : notice.target_class}</p>
            <p>投稿日時: {new Date(notice.created_at).toLocaleString()}</p>
          </div>

          {notice.file_type === 'image' && notice.image_url && (
            <div className="relative w-48 h-48 mt-2">
              <Image
                src={notice.image_url}
                alt="添付画像"
                fill
                className="object-contain"
              />
            </div>
          )}

          {notice.file_type === 'pdf' && notice.image_url && (
            <a
              href={notice.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              PDFを表示
            </a>
          )}
        </div>
      ))}
    </div>
  )
} 