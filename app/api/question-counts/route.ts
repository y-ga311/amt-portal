import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const testName = searchParams.get("testName") || "AMT模擬試験"

    console.log("問題数取得API: テスト名", testName)

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // question_countsテーブルからデータを取得
    console.log("データベースクエリ実行:", testName)
    const { data, error } = await supabase
      .from("question_counts")
      .select("*")
      .eq("test_name", testName)

    if (error) {
      console.error("問題数取得エラー:", error)
      return NextResponse.json(
        { 
          success: false, 
          error: "問題数の取得に失敗しました",
          details: {
            code: error.code,
            message: error.message,
            hint: error.hint
          }
        },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.log("問題数データが見つかりません:", testName)
      return NextResponse.json(
        { 
          success: false, 
          error: "指定されたテストの問題数が見つかりません",
          details: {
            testName,
            dataCount: data?.length || 0
          }
        },
        { status: 404 }
      )
    }

    // 複数のデータが見つかった場合は最初のデータを使用
    const questionCountData = data[0]

    // データの検証（必須フィールドが不足している場合は警告のみで処理を続行）
    const requiredFields = [
      "medical_overview",
      "public_health",
      "anatomy",
      "physiology",
      "pathology",
      "clinical_medicine_overview",
      "clinical_medicine_detail",
      "rehabilitation",
      "oriental_medicine_overview",
      "meridian_points",
      "oriental_medicine_clinical",
      "acupuncture_theory",
      "moxibustion_theory"
    ]

    const missingFields = requiredFields.filter(field => questionCountData[field] === null || questionCountData[field] === undefined)
    if (missingFields.length > 0) {
      console.warn("一部のフィールドが不足しています:", missingFields)
      // 400エラーではなく、警告付きでデータを返す
      console.log("問題数データ取得成功（一部フィールド不足）:", questionCountData)
      return NextResponse.json({ 
        success: true, 
        data: questionCountData,
        warning: `以下のフィールドが不足しています: ${missingFields.join(", ")}`
      })
    }

    console.log("問題数データ取得成功:", questionCountData)
    return NextResponse.json({ success: true, data: questionCountData })
  } catch (error) {
    console.error("APIエラー:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "サーバーエラーが発生しました",
        details: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      },
      { status: 500 }
    )
  }
} 