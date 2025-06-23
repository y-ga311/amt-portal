"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface FileUploadProps {
  onUploadComplete: (url: string, fileName: string) => void
  fileType: 'image' | 'pdf'
}

export function FileUpload({ onUploadComplete, fileType }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFileName(file.name)

    // ファイルサイズのチェック（10MB以下）
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'エラー',
        description: 'ファイルサイズは10MB以下にしてください',
        variant: 'destructive',
        duration: 5000,
      })
      setSelectedFileName(null)
      return
    }

    // ファイルタイプのチェック
    if (fileType === 'image' && !file.type.startsWith('image/')) {
      toast({
        title: 'エラー',
        description: '画像ファイルを選択してください',
        variant: 'destructive',
        duration: 5000,
      })
      setSelectedFileName(null)
      return
    }

    if (fileType === 'pdf' && file.type !== 'application/pdf') {
      toast({
        title: 'エラー',
        description: 'PDFファイルを選択してください',
        variant: 'destructive',
        duration: 5000,
      })
      setSelectedFileName(null)
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', fileType)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'アップロードに失敗しました')
      }

      const data = await response.json()
      onUploadComplete(data.url, file.name)
      toast({
        title: 'アップロード成功',
        description: `${file.name}が正常にアップロードされました`,
        duration: 3000,
      })
    } catch (error) {
      console.error('アップロードエラー:', error)
      toast({
        title: 'アップロードエラー',
        description: error instanceof Error ? error.message : 'ファイルのアップロードに失敗しました',
        variant: 'destructive',
        duration: 5000,
      })
      setSelectedFileName(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept={fileType === 'image' ? 'image/*' : 'application/pdf'}
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          id="file-upload"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          {isUploading ? 'アップロード中...' : 'ファイルを選択'}
        </Button>
        {selectedFileName && (
          <span className="text-sm text-gray-600">{selectedFileName}</span>
        )}
      </div>
    </div>
  )
} 