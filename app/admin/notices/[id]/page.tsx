'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Notice } from '@/types/notice'

// メール送信状態の表示コンポーネント
function MailSendStatus({ noticeId }: { noticeId: number }) {
  const [sendStatus, setSendStatus] = useState<{
    total: number
    sent: number
    failed: number
    pending: number
  }>({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchSendStatus = async () => {
      const { data, error } = await supabase
        .from('mail_send_history')
        .select('status')
        .eq('notice_id', noticeId)

      if (error) {
        console.error('送信状態の取得に失敗:', error)
        return
      }

      const status = {
        total: data.length,
        sent: data.filter((d: { status: string }) => d.status === 'sent').length,
        failed: data.filter((d: { status: string }) => d.status === 'failed').length,
        pending: data.filter((d: { status: string }) => d.status === 'pending').length
      }

      setSendStatus(status)
    }

    fetchSendStatus()
    // 5秒ごとに更新
    const interval = setInterval(fetchSendStatus, 5000)
    return () => clearInterval(interval)
  }, [noticeId, supabase])

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">メール送信状態</h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{sendStatus.total}</div>
          <div className="text-sm text-gray-600">送信対象</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{sendStatus.sent}</div>
          <div className="text-sm text-gray-600">送信完了</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{sendStatus.pending}</div>
          <div className="text-sm text-gray-600">送信待ち</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{sendStatus.failed}</div>
          <div className="text-sm text-gray-600">送信失敗</div>
        </div>
      </div>
    </div>
  )
}

// お知らせ編集画面のコンポーネント
export default async function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  return <EditNoticeClient params={resolvedParams} />
}

// クライアントコンポーネント
function EditNoticeClient({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [notice, setNotice] = useState<Notice | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchNotice = async () => {
      const { data, error } = await supabase
        .from('notice')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('お知らせの取得に失敗:', error)
        return
      }

      setNotice(data as Notice)
    }

    fetchNotice()
  }, [params.id, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!notice) return

    const { error } = await supabase
      .from('notice')
      .update(notice)
      .eq('id', notice.id)

    if (error) {
      console.error('お知らせの更新に失敗:', error)
      return
    }

    router.push('/admin/notices')
  }

  if (!notice) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">お知らせの編集</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">タイトル</label>
          <input
            type="text"
            value={notice.title}
            onChange={(e) => setNotice({ ...notice, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">内容</label>
          <textarea
            value={notice.content}
            onChange={(e) => setNotice({ ...notice, content: e.target.value })}
            rows={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">対象</label>
          <select
            value={notice.target_type}
            onChange={(e) => setNotice({ ...notice, target_type: e.target.value as 'all' | 'parent' | 'student' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">全員</option>
            <option value="parent">保護者</option>
            <option value="student">学生</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">対象クラス</label>
          <select
            value={notice.target_class}
            onChange={(e) => setNotice({ ...notice, target_class: e.target.value as '昼1' | '昼2' | '昼3' | '夜1' | '夜2' | '夜3' | 'all' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

        {/* メール送信状態の表示 */}
        {(notice.target_type === 'all' || notice.target_type === 'parent') && (
          <MailSendStatus noticeId={notice.id} />
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            更新
          </button>
        </div>
      </form>
    </div>
  )
} 