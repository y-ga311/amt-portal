-- Update admin components for new period naming convention
-- 管理者画面の修正（学生IDからの自動クラス判定は削除）

-- 1. 期生管理テーブルの更新（必要に応じて）
INSERT INTO period_management (period_name, is_active, created_at)
VALUES 
  ('25期生', true, NOW()),
  ('26期生', true, NOW()),
  ('27期生', true, NOW()),
  ('28期生', true, NOW()),
  ('29期生', true, NOW()),
  ('30期生', true, NOW())
ON CONFLICT (period_name) DO NOTHING;

-- 2. noticeテーブルの制約を更新
SELECT update_notice_target_class_constraint();

-- 3. 現在の学生データの確認
SELECT 
  gakusei_id,
  name,
  class
FROM students 
ORDER BY gakusei_id;

-- 4. 注意事項
-- - 学生のクラスは手動で設定する必要があります
-- - 新しい学生を追加する際は、クラスを明示的に指定してください
-- - 学生IDとクラスは独立した値として管理されます
-- - 管理者画面のクラス選択は動的に生成されます

-- 5. 修正内容の確認
SELECT 
  'Students with class' as status,
  COUNT(*) as count
FROM students 
WHERE class IS NOT NULL;

SELECT 
  'Available periods' as status,
  COUNT(*) as count
FROM period_management 
WHERE is_active = true; 