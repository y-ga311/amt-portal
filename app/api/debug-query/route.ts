import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get("studentId")
  const testName = searchParams.get("testName")

  console.log("デバッグクエリ実行:", { studentId, testName })

  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // question_countsテーブルの確認
    console.log("question_countsテーブルを確認中...")
    const { data: questionCounts, error: questionCountsError } = await supabase
      .from("question_counts")
      .select("*")
      .eq("test_name", testName)

    if (questionCountsError) {
      console.error("question_countsテーブル確認エラー:", questionCountsError)
      return NextResponse.json({
        success: false,
        error: questionCountsError,
        questionCounts: null,
      })
    }

    // テスト結果の取得
    let query = supabase.from("test_scores").select("*")
    if (studentId) {
      query = query.eq("student_id", studentId)
    }
    if (testName) {
      query = query.eq("test_name", testName)
    }

    const { data: results, error: resultsError } = await query

    if (resultsError) {
      console.error("テスト結果取得エラー:", resultsError)
      return NextResponse.json({
        success: false,
        error: resultsError,
        results: null,
        resultCount: 0,
      })
    }

    return NextResponse.json({
      success: true,
      results,
      resultCount: results?.length || 0,
      questionCounts,
    })
  } catch (error) {
    console.error("予期せぬエラー:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "予期せぬエラーが発生しました",
      results: null,
      resultCount: 0,
    })
  }
}
