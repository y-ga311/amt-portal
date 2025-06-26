-- Update notice table constraints and data for new class naming convention
-- noticeテーブルの制約とデータを新しいクラス名に更新

-- 1. 既存の制約を削除
ALTER TABLE notice DROP CONSTRAINT IF EXISTS notice_target_class_check;

-- 2. 新しい制約を追加
ALTER TABLE notice ADD CONSTRAINT notice_target_class_check 
CHECK (target_class IN ('22期生昼間部', '22期生夜間部', '23期生昼間部', '23期生夜間部', '24期生昼間部', '24期生夜間部', 'all'));

-- 3. 既存のお知らせデータを更新
UPDATE notice
SET target_class = CASE
  WHEN target_class = '昼1' THEN '24期生昼間部'
  WHEN target_class = '夜1' THEN '24期生夜間部'
  WHEN target_class = '昼2' THEN '23期生昼間部'
  WHEN target_class = '夜2' THEN '23期生夜間部'
  WHEN target_class = '昼3' THEN '22期生昼間部'
  WHEN target_class = '夜3' THEN '22期生夜間部'
  ELSE target_class  -- 'all'は変更しない
END;

-- 4. 更新結果の確認用クエリ
SELECT 
  target_class,
  COUNT(*) as notice_count
FROM notice 
GROUP BY target_class 
ORDER BY target_class;

-- 5. コメントの更新
COMMENT ON COLUMN notice.target_class IS '対象クラス（22期生昼間部/22期生夜間部/23期生昼間部/23期生夜間部/24期生昼間部/24期生夜間部, all: 全クラス）'; 