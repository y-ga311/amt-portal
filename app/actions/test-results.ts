"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { parse } from "csv-parse/sync"

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

export async function getTestResults() {
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
      return { success: false, error: "テスト結果の取得に失敗しました" }
    }

    // 学生名を追加
    const scoresWithStudentName = testScores.map((score) => ({
      ...score,
      student_name: score.students?.name || "不明",
    }))

    return { success: true, data: scoresWithStudentName }
  } catch (error) {
    console.error("テスト結果取得エラー:", error)
    return { success: false, error: "テスト結果の取得に失敗しました" }
  }
}

export async function getTestResultsByTest(testName: string, testDate: string) {
  try {
    // URLデコードされた文字列で比較
    const decodedTestName = decodeURIComponent(testName)
    const decodedTestDate = decodeURIComponent(testDate)

    console.log("テスト結果を取得します:", {
      decodedTestName,
      decodedTestDate
    });

    // テスト結果を取得
    const { data: testScores, error: testScoresError } = await adminSupabase
      .from("test_scores")
      .select(`
        *,
        students (
          name
        )
      `)
      .eq("test_name", decodedTestName)
      .eq("test_date", decodedTestDate)
      .order("student_id", { ascending: true })

    if (testScoresError) {
      console.error("テスト結果取得エラー:", {
        error: testScoresError,
        errorMessage: testScoresError.message,
        errorDetails: testScoresError.details,
        errorHint: testScoresError.hint,
        errorCode: testScoresError.code,
        decodedTestName,
        decodedTestDate
      });
      return { success: false, error: "テスト結果の取得に失敗しました" }
    }

    console.log("テスト結果の取得に成功:", {
      count: testScores.length,
      decodedTestName,
      decodedTestDate
    });

    // 学生名を追加
    const scoresWithStudentName = testScores.map((score) => ({
      ...score,
      student_name: score.students?.name || "不明",
    }))

    return { success: true, data: scoresWithStudentName }
  } catch (error) {
    console.error("予期せぬエラーが発生しました:", {
      error,
      errorMessage: error instanceof Error ? error.message : "不明なエラー",
      errorStack: error instanceof Error ? error.stack : undefined,
      testName,
      testDate
    });
    return { success: false, error: "テスト結果の取得に失敗しました" }
  }
}

export async function updateTestResults(testName: string, testDate: string, testScores: any[]) {
  try {
    // テスト結果を更新
    const { error: updateError } = await adminSupabase
      .from("test_scores")
      .upsert(
        testScores.map((score) => ({
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
          clinical_medicine_detail_general: score.clinical_medicine_detail_general
        }))
      )

    if (updateError) {
      console.error("テスト結果更新エラー:", updateError)
      return { success: false, error: "テスト結果の更新に失敗しました" }
    }

    // キャッシュを更新
    revalidatePath("/admin/results")
    revalidatePath("/admin/dashboard")
    revalidatePath("/results")

    return { success: true }
  } catch (error) {
    console.error("テスト結果更新エラー:", error)
    return { success: false, error: "テスト結果の更新に失敗しました" }
  }
}

export async function importTestResults(results: any[]) {
  try {
    if (!results || results.length === 0) {
      return { success: false, error: "インポートするデータがありません" }
    }

    console.log("テスト結果をインポートします:", results.length, "件")
    console.log("最初のデータ例:", results[0])

    // 各結果をテーブル構造に合わせて整形
    const formattedResults = results.map((result) => {
      // student_idが数値であることを確認
      const studentId =
        typeof result.student_id === "number"
          ? result.student_id
          : Number.parseInt(String(result.student_id).trim(), 10)

      if (isNaN(studentId)) {
        console.error(`無効な学生ID: ${result.student_id}`)
        return null
      }

      const formattedResult: Record<string, any> = {
        student_id: studentId,
        test_name: result.test_name || "模擬試験",
        test_date: result.test_date || new Date().toISOString().split("T")[0],
      }

      // IDフィールドが含まれている場合は除外（シーケンスで自動管理）
      if (formattedResult.id !== undefined) {
        delete formattedResult.id
      }

      // 科目別得点を追加
      if (result.medical_overview !== undefined) formattedResult.medical_overview = Number(result.medical_overview)
      if (result.public_health !== undefined) formattedResult.public_health = Number(result.public_health)
      if (result.related_laws !== undefined) formattedResult.related_laws = Number(result.related_laws)
      if (result.anatomy !== undefined) formattedResult.anatomy = Number(result.anatomy)
      if (result.physiology !== undefined) formattedResult.physiology = Number(result.physiology)
      if (result.pathology !== undefined) formattedResult.pathology = Number(result.pathology)
      if (result.clinical_medicine_overview !== undefined)
        formattedResult.clinical_medicine_overview = Number(result.clinical_medicine_overview)
      if (result.clinical_medicine_detail !== undefined)
        formattedResult.clinical_medicine_detail = Number(result.clinical_medicine_detail)
      if (result.clinical_medicine_detail_total !== undefined)
        formattedResult.clinical_medicine_detail_total = Number(result.clinical_medicine_detail_total)
      if (result.rehabilitation !== undefined) formattedResult.rehabilitation = Number(result.rehabilitation)
      if (result.oriental_medicine_overview !== undefined)
        formattedResult.oriental_medicine_overview = Number(result.oriental_medicine_overview)
      if (result.meridian_points !== undefined) formattedResult.meridian_points = Number(result.meridian_points)
      if (result.oriental_medicine_clinical !== undefined)
        formattedResult.oriental_medicine_clinical = Number(result.oriental_medicine_clinical)
      if (result.oriental_medicine_clinical_general !== undefined)
        formattedResult.oriental_medicine_clinical_general = Number(result.oriental_medicine_clinical_general)
      if (result.acupuncture_theory !== undefined)
        formattedResult.acupuncture_theory = Number(result.acupuncture_theory)
      if (result.moxibustion_theory !== undefined)
        formattedResult.moxibustion_theory = Number(result.moxibustion_theory)

      return formattedResult
    })

    // nullを除外
    const validResults = formattedResults.filter((result) => result !== null)

    if (validResults.length === 0) {
      return { success: false, error: "有効なデータがありません" }
    }

    // question_countsテーブルに存在しないテスト名をチェックし、デフォルトデータを追加
    const uniqueTestNames = [...new Set(validResults.map(result => result.test_name))]
    
    for (const testName of uniqueTestNames) {
      const { data: existingQuestionCount } = await adminSupabase
        .from("question_counts")
        .select("test_name")
        .eq("test_name", testName)
        .single()

      if (!existingQuestionCount) {
        console.log(`テスト名 "${testName}" の問題数データが存在しないため、デフォルトデータを追加します`)
        
        // デフォルトの問題数データを追加
        const { error: insertError } = await adminSupabase
          .from("question_counts")
          .insert({
            test_name: testName,
            test_date: validResults.find(r => r.test_name === testName)?.test_date || new Date().toISOString().split("T")[0],
            medical_overview: 10,
            public_health: 10,
            related_laws: 10,
            anatomy: 10,
            physiology: 10,
            pathology: 10,
            clinical_medicine_overview: 10,
            clinical_medicine_detail: 10,
            clinical_medicine_detail_total: 10,
            rehabilitation: 10,
            oriental_medicine_overview: 10,
            meridian_points: 10,
            oriental_medicine_clinical: 10,
            oriental_medicine_clinical_general: 10,
            acupuncture_theory: 10,
            moxibustion_theory: 10,
          })

        if (insertError) {
          console.error("問題数データ挿入エラー:", insertError)
          return { success: false, error: "問題数データの追加に失敗しました" }
        }
      }
    }

    // 既存のレコードをチェックして重複を避ける
    let insertedCount = 0
    let updatedCount = 0

    for (const result of validResults) {
      // 既存のレコードをチェック
      const { data: existingRecord } = await adminSupabase
        .from("test_scores")
        .select("id")
        .eq("student_id", result.student_id)
        .eq("test_name", result.test_name)
        .eq("test_date", result.test_date)
        .single()

      if (existingRecord) {
        // 既存のレコードを更新
        const { error: updateError } = await adminSupabase
          .from("test_scores")
          .update(result)
          .eq("id", existingRecord.id)

        if (updateError) {
          console.error("テスト結果更新エラー:", updateError)
          return { success: false, error: `学生ID ${result.student_id} のテスト結果更新に失敗しました` }
        }
        updatedCount++
      } else {
        // 新しいレコードを挿入
        const { error: insertError } = await adminSupabase
          .from("test_scores")
          .insert(result)

        if (insertError) {
          console.error("テスト結果挿入エラー:", insertError)
          return { success: false, error: `学生ID ${result.student_id} のテスト結果挿入に失敗しました` }
        }
        insertedCount++
      }
    }

    // キャッシュを更新
    revalidatePath("/admin/results")
    revalidatePath("/admin/dashboard")
    revalidatePath("/results")

    console.log("テスト結果のインポートが完了しました:", insertedCount, "件挿入,", updatedCount, "件更新")
    return { 
      success: true, 
      count: insertedCount + updatedCount,
      inserted: insertedCount,
      updated: updatedCount
    }
  } catch (error) {
    console.error("テスト結果インポートエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果のインポートに失敗しました",
    }
  }
}

export async function importTestResultsFromCSV(csvData: string, testName: string, testDate: string) {
  try {
    if (!csvData) {
      return { success: false, error: "インポートするデータがありません" }
    }

    if (!testName || !testDate) {
      return { success: false, error: "試験名と実施日を入力してください" }
    }

    // CSVをパース
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    console.log("CSVデータをパースしました:", records.length, "件")
    console.log("最初のデータ例:", records[0])

    // 各結果をテーブル構造に合わせて整形
    const formattedResults = records.map((record: any) => {
      // student_idが数値であることを確認
      const studentId = Number.parseInt(String(record.student_id).trim(), 10)

      if (isNaN(studentId)) {
        console.error(`無効な学生ID: ${record.student_id}`)
        return null
      }

      const formattedResult: Record<string, any> = {
        student_id: studentId,
        test_name: testName,
        test_date: testDate,
      }

      // IDフィールドが含まれている場合は除外（シーケンスで自動管理）
      if (formattedResult.id !== undefined) {
        delete formattedResult.id
      }

      // 科目別得点を追加
      if (record.medical_overview !== undefined) formattedResult.medical_overview = Number(record.medical_overview)
      if (record.public_health !== undefined) formattedResult.public_health = Number(record.public_health)
      if (record.related_laws !== undefined) formattedResult.related_laws = Number(record.related_laws)
      if (record.anatomy !== undefined) formattedResult.anatomy = Number(record.anatomy)
      if (record.physiology !== undefined) formattedResult.physiology = Number(record.physiology)
      if (record.pathology !== undefined) formattedResult.pathology = Number(record.pathology)
      if (record.clinical_medicine_overview !== undefined)
        formattedResult.clinical_medicine_overview = Number(record.clinical_medicine_overview)
      if (record.clinical_medicine_detail !== undefined)
        formattedResult.clinical_medicine_detail = Number(record.clinical_medicine_detail)
      if (record.clinical_medicine_detail_total !== undefined)
        formattedResult.clinical_medicine_detail_total = Number(record.clinical_medicine_detail_total)
      if (record.rehabilitation !== undefined) formattedResult.rehabilitation = Number(record.rehabilitation)
      if (record.oriental_medicine_overview !== undefined)
        formattedResult.oriental_medicine_overview = Number(record.oriental_medicine_overview)
      if (record.meridian_points !== undefined) formattedResult.meridian_points = Number(record.meridian_points)
      if (record.oriental_medicine_clinical !== undefined)
        formattedResult.oriental_medicine_clinical = Number(record.oriental_medicine_clinical)
      if (record.oriental_medicine_clinical_general !== undefined)
        formattedResult.oriental_medicine_clinical_general = Number(record.oriental_medicine_clinical_general)
      if (record.acupuncture_theory !== undefined)
        formattedResult.acupuncture_theory = Number(record.acupuncture_theory)
      if (record.moxibustion_theory !== undefined)
        formattedResult.moxibustion_theory = Number(record.moxibustion_theory)

      return formattedResult
    })

    // nullを除外
    const validResults = formattedResults.filter((result) => result !== null)

    if (validResults.length === 0) {
      return { success: false, error: "有効なデータがありません" }
    }

    // question_countsテーブルに存在しないテスト名をチェックし、デフォルトデータを追加
    const uniqueTestNames = [...new Set(validResults.map(result => result.test_name))]
    
    for (const testName of uniqueTestNames) {
      const { data: existingQuestionCount } = await adminSupabase
        .from("question_counts")
        .select("test_name")
        .eq("test_name", testName)
        .single()

      if (!existingQuestionCount) {
        console.log(`テスト名 "${testName}" の問題数データが存在しないため、デフォルトデータを追加します`)
        
        // デフォルトの問題数データを追加
        const { error: insertError } = await adminSupabase
          .from("question_counts")
          .insert({
            test_name: testName,
            test_date: validResults.find(r => r.test_name === testName)?.test_date || new Date().toISOString().split("T")[0],
            medical_overview: 10,
            public_health: 10,
            related_laws: 10,
            anatomy: 10,
            physiology: 10,
            pathology: 10,
            clinical_medicine_overview: 10,
            clinical_medicine_detail: 10,
            clinical_medicine_detail_total: 10,
            rehabilitation: 10,
            oriental_medicine_overview: 10,
            meridian_points: 10,
            oriental_medicine_clinical: 10,
            oriental_medicine_clinical_general: 10,
            acupuncture_theory: 10,
            moxibustion_theory: 10,
          })

        if (insertError) {
          console.error("問題数データ挿入エラー:", insertError)
          return { success: false, error: "問題数データの追加に失敗しました" }
        }
      }
    }

    // 既存のレコードをチェックして重複を避ける
    let insertedCount = 0
    let updatedCount = 0

    for (const result of validResults) {
      // 既存のレコードをチェック
      const { data: existingRecord } = await adminSupabase
        .from("test_scores")
        .select("id")
        .eq("student_id", result.student_id)
        .eq("test_name", result.test_name)
        .eq("test_date", result.test_date)
        .single()

      if (existingRecord) {
        // 既存のレコードを更新
        const { error: updateError } = await adminSupabase
          .from("test_scores")
          .update(result)
          .eq("id", existingRecord.id)

        if (updateError) {
          console.error("テスト結果更新エラー:", updateError)
          return { success: false, error: `学生ID ${result.student_id} のテスト結果更新に失敗しました` }
        }
        updatedCount++
      } else {
        // 新しいレコードを挿入
        const { error: insertError } = await adminSupabase
          .from("test_scores")
          .insert(result)

        if (insertError) {
          console.error("テスト結果挿入エラー:", insertError)
          return { success: false, error: `学生ID ${result.student_id} のテスト結果挿入に失敗しました` }
        }
        insertedCount++
      }
    }

    // キャッシュを更新
    revalidatePath("/admin/results")
    revalidatePath("/admin/dashboard")
    revalidatePath("/results")

    console.log("テスト結果のインポートが完了しました:", insertedCount, "件挿入,", updatedCount, "件更新")
    return { 
      success: true, 
      count: insertedCount + updatedCount,
      inserted: insertedCount,
      updated: updatedCount
    }
  } catch (error) {
    console.error("テスト結果インポートエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果のインポートに失敗しました",
    }
  }
}
