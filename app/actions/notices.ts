import { sendNoticeMail } from '@/app/utils/mail'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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

interface Notice {
  id: number
  title: string
  content: string
  target_type: 'student' | 'parent' | 'all'
  target_class: string
}

export async function updateNotice(notice: Notice) {
  try {
    console.log("お知らせ更新開始:", notice)

    const adminSupabase = createSupabaseClient()

    const { data, error } = await adminSupabase
      .from("notices")
      .update(notice)
      .eq("id", notice.id)
      .select()

    if (error) {
      console.error("お知らせ更新エラー:", error)
      return { success: false, error: "お知らせの更新に失敗しました" }
    }

    console.log("お知らせ更新成功:", data)

    // メール送信処理
    if (notice.target_type === 'all' || notice.target_type === 'parent') {
      console.log("メール送信処理開始")
      
      // 対象クラスの学生のメールアドレスを取得
      const { data: students, error: studentsError } = await adminSupabase
        .from("students")
        .select("id, mail")
        .eq("class", notice.target_class)
        .not("mail", "is", null)

      if (studentsError) {
        console.error("学生メール取得エラー:", studentsError)
      } else {
        console.log("対象学生:", students)
        
        if (students && students.length > 0) {
          // 各学生にメールを送信
          for (const student of students) {
            // 学生のメールアドレスに送信
            if (student.mail) {
              console.log("学生メール送信開始:", student.mail)
              const { success, error } = await sendNoticeMail(notice, student.mail)
              console.log("学生メール送信結果:", { success, error })
              
              // 送信履歴を更新
              await adminSupabase
                .from("mail_send_history")
                .update({
                  status: success ? 'sent' : 'failed',
                  error_message: error,
                  updated_at: new Date().toISOString()
                })
                .eq("notice_id", notice.id)
                .eq("student_id", student.id)
            }
          }
        } else {
          console.log("送信対象の学生が見つかりません")
        }
      }
    }

    revalidatePath("/admin/notices")
    return { success: true, data }
  } catch (error) {
    console.error("お知らせ更新エラー:", error)
    return { success: false, error: "お知らせの更新に失敗しました" }
  }
} 