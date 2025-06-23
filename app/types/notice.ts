export interface Notice {
  id: number
  title: string
  content: string
  target_type: 'student' | 'parent' | 'all'
  target_class: '昼1' | '昼2' | '昼3' | '夜1' | '夜2' | '夜3' | 'all'
  file_type: 'image' | 'pdf' | null
  image_url: string | null
  pdf_url: string | null
  created_at: string
  updated_at: string
} 