import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // セッションチェック
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { message: '認証されていません' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('fileType') as string

    if (!file) {
      return NextResponse.json(
        { message: 'ファイルが見つかりません' },
        { status: 400 }
      )
    }

    // ファイルサイズのチェック（10MB以下）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'ファイルサイズは10MB以下にしてください' },
        { status: 400 }
      )
    }

    // ファイルタイプのチェック
    if (fileType === 'image' && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: '画像ファイルを選択してください' },
        { status: 400 }
      )
    }

    if (fileType === 'pdf' && file.type !== 'application/pdf') {
      return NextResponse.json(
        { message: 'PDFファイルを選択してください' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ファイル名を生成（タイムスタンプ + オリジナルファイル名）
    const timestamp = Date.now()
    const originalName = file.name
    const fileName = `${timestamp}-${originalName}`

    // ファイルをアップロード
    const { data, error } = await supabase.storage
      .from('notices')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('ストレージアップロードエラー:', error)
      return NextResponse.json(
        { message: 'ファイルのアップロードに失敗しました' },
        { status: 500 }
      )
    }

    // アップロードされたファイルのURLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('notices')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('アップロードエラー:', error)
    return NextResponse.json(
      { message: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    )
  }
} 