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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ testName: string; testDate: string }> }
) {
  try {
    const { testName, testDate } = await params

    // テスト結果を取得
    const { data: testScores, error: testScoresError } = await adminSupabase
      .from("test_scores")
      .select(`
        *,
        students (
          name
        )
      `)
      .eq("test_name", testName)
      .eq("test_date", testDate)
      .order("student_id", { ascending: true })

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ testName: string; testDate: string }> }
) {
  try {
    const { testName, testDate } = await params
    const testScores = await request.json()

    // テスト結果を更新
    const { error: updateError } = await adminSupabase
      .from("test_scores")
      .upsert(
        testScores.map((score: any) => ({
          id: score.id,
          student_id: score.student_id,
          test_name: testName,
          test_date: testDate,
          total_score: score.total_score,
          medical_overview: score.medical_overview,
          public_health: score.public_health,
          related_laws: score.related_laws,
          anatomy: score.anatomy,
          physiology: score.physiology,
          pathology: score.pathology,
          clinical_medicine_overview: score.clinical_medicine_overview,
          clinical_medicine_detail: score.clinical_medicine_detail,
          rehabilitation: score.rehabilitation,
          oriental_medicine_overview: score.oriental_medicine_overview,
          meridian_points: score.meridian_points,
          oriental_medicine_clinical: score.oriental_medicine_clinical,
          oriental_medicine_clinical_general: score.oriental_medicine_clinical_general,
          acupuncture_theory: score.acupuncture_theory,
          moxibustion_theory: score.moxibustion_theory,
        }))
      )

    if (updateError) {
      console.error("テスト結果更新エラー:", updateError)
      return NextResponse.json(
        { success: false, error: "テスト結果の更新に失敗しました" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("テスト結果更新エラー:", error)
    return NextResponse.json(
      { success: false, error: "テスト結果の更新に失敗しました" },
      { status: 500 }
    )
  }
} 