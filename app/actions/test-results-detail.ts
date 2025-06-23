"use server"

import { getTestResultsByTest } from "./test-results"
import { revalidatePath } from "next/cache"
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

interface TestScore {
  id: number
  student_id: number
  student_name: string
  test_name: string
  test_date: string
  total_score: number
  medical_overview: number
  public_health: number
  related_laws: number
  anatomy: number
  physiology: number
  pathology: number
  clinical_medicine_overview: number
  clinical_medicine_detail: number
  rehabilitation: number
  oriental_medicine_overview: number
  meridian_points: number
  oriental_medicine_clinical: number
  oriental_medicine_clinical_general: number
  acupuncture_theory: number
  moxibustion_theory: number
  clinical_medicine_detail_general?: number
  clinical_medicine_detail_total?: number
}

export async function updateTestResult(score: TestScore) {
  try {
    console.log("更新を開始します:", {
      id: score.id,
      test_name: score.test_name,
      test_date: score.test_date,
      total_score: score.total_score
    });

    // 更新するデータをログ出力
    const updateData = {
      medical_overview: score.medical_overview,
      public_health: score.public_health,
      related_laws: score.related_laws,
      anatomy: score.anatomy,
      physiology: score.physiology,
      pathology: score.pathology,
      clinical_medicine_overview: score.clinical_medicine_overview,
      clinical_medicine_detail: score.clinical_medicine_detail,
      clinical_medicine_detail_total: score.clinical_medicine_detail_total,
      rehabilitation: score.rehabilitation,
      oriental_medicine_overview: score.oriental_medicine_overview,
      meridian_points: score.meridian_points,
      oriental_medicine_clinical: score.oriental_medicine_clinical,
      oriental_medicine_clinical_general: score.oriental_medicine_clinical_general,
      acupuncture_theory: score.acupuncture_theory,
      moxibustion_theory: score.moxibustion_theory
    };
    console.log("更新データ:", updateData);

    // Supabaseクライアントの設定を確認
    console.log("Supabase設定:", {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    const { data, error } = await adminSupabase
      .from("test_scores")
      .update(updateData)
      .eq("id", score.id)
      .select();

    if (error) {
      console.error("テスト結果更新エラー:", {
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        errorCode: error.code,
        score,
        updateData
      });
      return { success: false, error: `テスト結果の更新に失敗しました: ${error.message}` }
    }

    console.log("更新が成功しました:", data);
    revalidatePath(`/admin/results/${score.test_name}/${score.test_date}`)
    return { success: true }
  } catch (error) {
    console.error("予期せぬエラーが発生しました:", {
      error,
      errorMessage: error instanceof Error ? error.message : "不明なエラー",
      errorStack: error instanceof Error ? error.stack : undefined,
      score
    });
    return { success: false, error: `テスト結果の更新に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}` }
  }
}

export async function refreshTestResults(testName: string, testDate: string) {
  try {
    console.log("テスト結果の更新を開始します:", {
      testName,
      testDate
    });

    const { success, error } = await getTestResultsByTest(testName, testDate)
    if (!success) {
      console.error("テスト結果の取得に失敗:", {
        error,
        testName,
        testDate
      });
      return { success: false, error: "テスト結果の更新に失敗しました" }
    }

    console.log("テスト結果の更新が成功しました");
    revalidatePath(`/admin/results/${testName}/${testDate}`)
    return { success: true }
  } catch (error) {
    console.error("予期せぬエラーが発生しました:", {
      error,
      errorMessage: error instanceof Error ? error.message : "不明なエラー",
      errorStack: error instanceof Error ? error.stack : undefined,
      testName,
      testDate
    });
    return { success: false, error: "テスト結果の更新に失敗しました" }
  }
} 