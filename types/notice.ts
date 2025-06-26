// 期生の型定義を動的に生成
type PeriodType = '22期生' | '23期生' | '24期生' | '25期生' | '26期生' | '27期生' | '28期生' | '29期生' | '30期生'
type ClassType = `${PeriodType}昼間部` | `${PeriodType}夜間部`

export interface Notice {
  id: number
  title: string
  content: string
  target_type: 'student' | 'parent' | 'all'
  target_class: string
  file_type: 'image' | 'pdf' | null
  image_url: string | null
  pdf_url: string | null
  created_at: string
  updated_at: string
} 