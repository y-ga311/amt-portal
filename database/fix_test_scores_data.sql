-- 一時テーブルを作成して現在のデータをバックアップ
CREATE TEMP TABLE temp_test_scores AS SELECT * FROM test_scores;

-- test_scoresテーブルのデータを更新
UPDATE test_scores
SET student_id = 'S' || LPAD(student_id::text, 5, '0')
WHERE student_id::text ~ '^[0-9]+$';

-- 既存のデータを確認
SELECT student_id, COUNT(*) as count
FROM test_scores
GROUP BY student_id
ORDER BY student_id;

-- 一時テーブルを削除
DROP TABLE temp_test_scores; 