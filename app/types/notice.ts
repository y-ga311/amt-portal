export interface Notice {
  id: number
  title: string
  content: string
  target_type: 'all' | 'parent' | 'student'  // 送信対象の種類
  target_class: string                       // 対象クラス
  created_at: string
  updated_at: string
} 