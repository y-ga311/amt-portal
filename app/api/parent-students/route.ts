import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { parent_id, student_id } = await request.json()

    // 保護者と学生の関連付けを作成
    const { data, error } = await supabase
      .from('parent_students')
      .insert([
        {
          parent_id,
          student_id
        }
      ])
      .select()

    if (error) {
      console.error('保護者-学生関連付けエラー:', error)
      return NextResponse.json(
        { error: '保護者と学生の関連付けに失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { searchParams } = new URL(request.url)
    const parent_id = searchParams.get('parent_id')

    if (!parent_id) {
      return NextResponse.json(
        { error: '保護者IDが指定されていません' },
        { status: 400 }
      )
    }

    // 保護者に関連付けられた学生を取得
    const { data, error } = await supabase
      .from('parent_students')
      .select(`
        student_id,
        students (
          id,
          name,
          gakusei_id
        )
      `)
      .eq('parent_id', parent_id)

    if (error) {
      console.error('保護者-学生取得エラー:', error)
      return NextResponse.json(
        { error: '保護者に関連付けられた学生の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 