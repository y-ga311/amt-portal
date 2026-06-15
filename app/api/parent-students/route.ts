import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { decryptStudentName } from "@/lib/studentNameCrypto.server"

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

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseClient()
    const { parent_id, student_id } = await request.json()

    const { data, error } = await supabase
      .from("parent_students")
      .insert([
        {
          parent_id,
          student_id,
        },
      ])
      .select()

    if (error) {
      console.error("保護者-学生関連付けエラー:", error)
      return NextResponse.json(
        { error: "保護者と学生の関連付けに失敗しました" },
        { status: 500 },
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("APIエラー:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseClient()
    const { searchParams } = new URL(request.url)
    const parent_id = searchParams.get("parent_id")

    if (!parent_id) {
      return NextResponse.json(
        { error: "保護者IDが指定されていません" },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from("parent_students")
      .select(`
        student_id,
        students (
          id,
          name,
          gakusei_id
        )
      `)
      .eq("parent_id", parent_id)

    if (error) {
      console.error("保護者-学生取得エラー:", error)
      return NextResponse.json(
        { error: "保護者に関連付けられた学生の取得に失敗しました" },
        { status: 500 },
      )
    }

    const decryptedData = await Promise.all(
      (data ?? []).map(async (row) => {
        const student = row.students as unknown as {
          id: number
          name: string
          gakusei_id: string
        } | null
        if (!student) {
          return row
        }

        return {
          ...row,
          students: {
            ...student,
            name: (await decryptStudentName(student.name)) ?? student.name,
          },
        }
      }),
    )

    return NextResponse.json({ data: decryptedData })
  } catch (error) {
    console.error("APIエラー:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    )
  }
}
