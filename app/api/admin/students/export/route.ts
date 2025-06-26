import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // 学生データを取得
    const { data: students, error } = await supabase
      .from("students")
      .select("*")
      .order("gakusei_id", { ascending: true })

    if (error) {
      throw error
    }

    // CSVヘッダー
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

    // CSVデータ行
    const rows = students.map((student) => [
      student.gakusei_id || "",
      student.name || "",
      student.gakusei_id || "",
      student.gakusei_password || "",
      student.hogosya_id || "",
      student.hogosya_pass || "",
      student.mail || "",
      student.class || "",
    ])

    // CSVデータを生成
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n")

    // レスポンスを返す
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
      { status: 500 }
    )
  }
} 