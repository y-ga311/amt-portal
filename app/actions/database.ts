"use server"

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

// データベース接続を確認するサーバーアクション
export async function checkDatabaseConnection() {
  try {
    // 環境変数の確認
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "設定済み" : "未設定",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "設定済み" : "未設定",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "設定済み" : "未設定",
    }

    // 環境変数が設定されていない場合
    if (envVars.NEXT_PUBLIC_SUPABASE_URL === "未設定" || envVars.SUPABASE_SERVICE_ROLE_KEY === "未設定") {
      return {
        success: false,
        error: "システム設定エラー: データベース接続情報が設定されていません",
        envStatus: envVars,
      }
    }

    // Supabaseクライアントの作成
    const supabase = createSupabaseClient()

    // データベース接続を確認（1件のみ取得）
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .limit(1)
      .single()

    if (studentError) {
      return {
        success: false,
        error: studentError.message,
        code: studentError.code,
      }
    }

    return {
      success: true,
      studentCount: 1, // 接続確認のみなので、1を返す
      sampleData: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "データベース接続の確認に失敗しました",
    }
  }
}
