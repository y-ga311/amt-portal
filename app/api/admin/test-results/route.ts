import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Supabaseクライアントを作成する関数
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase環境変数が設定されていません")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// 管理者用のSupabaseクライアント
const adminSupabase = createSupabaseClient()

export async function GET() {
  try {
    // テスト結果を取得
    const { data: testScores, error: testScoresError } = await adminSupabase
      .from("test_scores")
      .select(`
        *,
        students (
          name
        )
      `)
      .order("test_date", { ascending: false })

    if (testScoresError) {
      console.error("テスト結果取得エラー:", testScoresError)
      return NextResponse.json(
        { success: false, error: "テスト結果の取得に失敗しました" },
        { status: 500 }
      )
    }

    // 学生名を追加
    const scoresWithStudentName = testScores.map((score) => ({
      ...score,
      student_name: score.students?.name || "不明",
    }))

    return NextResponse.json({ success: true, data: scoresWithStudentName })
  } catch (error) {
    console.error("テスト結果取得エラー:", error)
    return NextResponse.json(
      { success: false, error: "テスト結果の取得に失敗しました" },
      { status: 500 }
    )
  }
} 