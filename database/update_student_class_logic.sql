-- Remove automatic class determination from student ID
-- 学生IDからの自動クラス判定を削除

-- 1. 自動クラス判定関数を削除
DROP FUNCTION IF EXISTS determine_student_class(TEXT);

-- 2. 自動クラス設定トリガーを削除
DROP TRIGGER IF EXISTS trigger_auto_set_student_class ON students;
DROP FUNCTION IF EXISTS auto_set_student_class();

-- 3. 既存の学生データのクラスは手動で設定する必要があります
-- 以下のクエリで現在のクラス設定を確認できます
SELECT 
  gakusei_id,
  name,
  class
FROM students 
ORDER BY gakusei_id;

-- 4. クラス設定の手動更新例（必要に応じて実行）
-- UPDATE students SET class = '22期生昼間部' WHERE gakusei_id = '特定の学生ID';
-- UPDATE students SET class = '23期生夜間部' WHERE gakusei_id = '特定の学生ID';

-- 5. 注意事項
-- - 学生のクラスは手動で設定する必要があります
-- - 新しい学生を追加する際は、クラスを明示的に指定してください
-- - 学生IDとクラスは独立した値として管理されます

-- 6. 古いマイグレーションファイルの更新（参考）
-- 20240320000000_add_class_to_students.sql の更新版
/*
UPDATE students
SET class = determine_student_class(gakusei_id)
WHERE class IS NULL OR class = '';
*/ 