"use server"

import { createClient } from "@supabase/supabase-js"

// サーバーサイドでSupabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// 管理者用のクライアント（サービスロールキーが設定されている場合のみ使用）
const adminSupabase = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : createClient(supabaseUrl, supabaseAnonKey)

// 通常のクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 重複を排除する関数（同じ学生IDでも異なるテスト名・日付のデータは保持）
function removeDuplicates(data: any[]) {
  // id, test_name, test_dateの組み合わせをキーとして使用して重複を排除
  const uniqueMap = new Map()
  data.forEach((item) => {
    const key = `${item.id}`
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item)
    }
  })
  return Array.from(uniqueMap.values())
}

// 同じ学生の同じテスト・同じ日付の重複のみを排除する関数
function removeTestDuplicates(data: any[]) {
  // student_id, test_name, test_dateの組み合わせをキーとして使用して重複を排除
  const uniqueMap = new Map()
  data.forEach((item) => {
    const key = `${item.student_id}_${item.test_name}_${item.test_date}`
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item)
    }
  })
  return Array.from(uniqueMap.values())
}

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

interface TestScore {
  id: number
  student_id: number
  test_name: string
  test_date: string
  medical_overview: number | null
  public_health: number | null
  related_laws: number | null
  anatomy: number | null
  physiology: number | null
  pathology: number | null
  clinical_medicine_overview: number | null
  clinical_medicine_detail: number | null
  clinical_medicine_detail_total: number | null
  rehabilitation: number | null
  oriental_medicine_overview: number | null
  meridian_points: number | null
  oriental_medicine_clinical: number | null
  oriental_medicine_clinical_general: number | null
  acupuncture_theory: number | null
  moxibustion_theory: number | null
  students?: {
    student_id: string
    name: string
  }
  question_counts?: {
    test_name: string
    medical_overview: number
    public_health: number
    related_laws: number
    anatomy: number
    physiology: number
    pathology: number
    clinical_medicine_overview: number
    clinical_medicine_detail: number
    clinical_medicine_detail_total: number
    rehabilitation: number
    oriental_medicine_overview: number
    meridian_points: number
    oriental_medicine_clinical: number
    oriental_medicine_clinical_general: number
    acupuncture_theory: number
    moxibustion_theory: number
  }
  [key: string]: any
}

export async function getTestResults() {
  try {
    console.log("テスト結果取得を開始します")

    // まず通常のクライアントで試す
    let result = await supabase.from("test_scores").select("*").order("test_date", { ascending: false })

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (result.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      result = await adminSupabase.from("test_scores").select("*").order("test_date", { ascending: false })
    }

    if (result.error) {
      console.error("テスト結果取得エラー:", result.error)
      return { success: false, error: result.error.message, data: [] }
    }

    // 重複を排除（IDのみで重複を判断）
    const uniqueData = removeDuplicates(result.data || [])

    console.log("テスト結果を取得しました:", result.data?.length || 0, "件")
    console.log("重複排除後:", uniqueData.length, "件")

    return { success: true, data: uniqueData }
  } catch (error) {
    console.error("テスト結果取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果の取得に失敗しました",
      data: [],
    }
  }
}

// 特定の学生のテスト結果を取得する関数
export async function getStudentTestResults(studentId: string) {
  try {
    console.log(`学生ID: ${studentId} のテスト結果を取得します`)

    // 学生情報を取得
    const { data: studentData, error: studentError } = await adminSupabase
      .from("students")
      .select("id, name")
      .eq("id", studentId)
      .single()

    if (studentError) {
      console.error("学生情報取得エラー:", studentError)
      return { success: false, error: "学生情報の取得に失敗しました" }
    }

    if (!studentData) {
      console.log("学生情報が見つかりませんでした")
      return { success: false, error: "学生情報が見つかりませんでした" }
    }

    console.log("取得した学生情報:", studentData)

    // テスト結果を取得（adminSupabaseを使用）
    const { data: testScores, error: testScoresError } = await adminSupabase
      .from("test_scores")
      .select("*")
      .eq("student_id", studentId)
      .order("test_date", { ascending: false })

    console.log("テスト結果クエリの実行結果:", {
      data: testScores,
      error: testScoresError,
      query: {
        table: "test_scores",
        condition: `student_id = ${studentId}`,
        order: "test_date DESC"
      }
    })

    if (testScoresError) {
      console.error("テスト結果取得エラー:", testScoresError)
      return { success: false, error: "テスト結果の取得に失敗しました" }
    }

    if (!testScores || testScores.length === 0) {
      console.log("テスト結果が見つかりませんでした")
      return { success: true, data: [] }
    }

    console.log("取得したテスト結果:", testScores)

    // 各テスト結果の問題数を取得
    const testNames = testScores.map(score => score.test_name)
    console.log("取得する問題数のテスト名:", testNames)

    // question_countsテーブルから問題数を取得
    const { data: questionCounts, error: questionCountsError } = await adminSupabase
      .from("question_counts")
      .select("*")
      .in("test_name", testNames)

    if (questionCountsError) {
      console.error("問題数データ取得エラー:", questionCountsError)
      return { success: false, error: "問題数データの取得に失敗しました" }
    }

    // テスト結果と問題数データをマージ
    const processedTestScores = testScores.map(score => {
      const questionCount = questionCounts?.find(q => q.test_name === score.test_name)
        return {
          ...score,
        question_counts: questionCount || {}
        }
      })

    return { success: true, data: processedTestScores }
  } catch (error) {
    console.error("テスト結果取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果の取得に失敗しました",
      data: []
    }
  }
}
