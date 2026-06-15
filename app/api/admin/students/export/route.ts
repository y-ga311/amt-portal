import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { decryptStudentRows } from "@/lib/studentNameCrypto.server"

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

export async function GET() {
  try {
    const supabase = createSupabaseClient()

    const { data: students, error } = await supabase
      .from("students")
      .select("*")
      .order("gakusei_id", { ascending: true })

    if (error) {
      throw error
    }

    const decryptedStudents = await decryptStudentRows(students ?? [])

    const headers = [
      "学生番号",
      "名前",
      "ログインID",
      "ログインパスワード",
      "保護者ID",
      "保護者パスワード",
      "メールアドレス",
      "クラス",
    ]

    const rows = decryptedStudents.map((student) => [
      student.gakusei_id || "",
      student.name || "",
      student.gakusei_id || "",
      student.gakusei_password || "",
      student.hogosya_id || "",
      student.hogosya_pass || "",
      student.mail || "",
      student.class || "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=students_${new Date()
          .toISOString()
          .split("T")[0]}.csv`,
      },
    })
  } catch (error) {
    console.error("エクスポートエラー:", error)
    return NextResponse.json(
      { error: "エクスポートに失敗しました" },
      { status: 500 },
    )
  }
}
