-- Update question_counts table test_name column to new naming convention
-- 試験名を新しい命名規則に変更

-- 外部キー制約を一時的に無効化（test_scoresテーブルとの関連）
ALTER TABLE test_scores DROP CONSTRAINT IF EXISTS test_scores_test_name_fkey;

-- question_countsテーブルのtest_nameを更新
UPDATE question_counts
SET test_name = CASE
  -- 3年次 → 22期生3年次
  WHEN test_name = '第1回模擬試験(3年次)' THEN '第1回模擬試験(22期生3年次)'
  WHEN test_name = '第2回模擬試験(3年次)' THEN '第2回模擬試験(22期生3年次)'
  WHEN test_name = '第3回模擬試験(3年次)' THEN '第3回模擬試験(22期生3年次)'
  WHEN test_name = '第4回模擬試験(3年次)' THEN '第4回模擬試験(22期生3年次)'
  WHEN test_name = '第5回模擬試験(3年次)' THEN '第5回模擬試験(22期生3年次)'
  WHEN test_name = '第6回模擬試験(3年次)' THEN '第6回模擬試験(22期生3年次)'
  WHEN test_name = '第7回模擬試験(3年次)' THEN '第7回模擬試験(22期生3年次)'
  WHEN test_name = '第8回模擬試験(3年次)' THEN '第8回模擬試験(22期生3年次)'
  WHEN test_name = '第9回模擬試験(3年次)' THEN '第9回模擬試験(22期生3年次)'
  WHEN test_name = '第10回模擬試験(3年次)' THEN '第10回模擬試験(22期生3年次)'
  
  -- 2年次 → 23期生2年次
  WHEN test_name = '第1回模擬試験(2年次)' THEN '第1回模擬試験(23期生2年次)'
  WHEN test_name = '第2回模擬試験(2年次)' THEN '第2回模擬試験(23期生2年次)'
  WHEN test_name = '第3回模擬試験(2年次)' THEN '第3回模擬試験(23期生2年次)'
  
  -- 1年次 → 24期生1年次
  WHEN test_name = '第1回模擬試験(1年次)' THEN '第1回模擬試験(24期生1年次)'
  
  ELSE test_name  -- その他の値は変更しない
END;

-- test_scoresテーブルのtest_nameも同様に更新
UPDATE test_scores
SET test_name = CASE
  -- 3年次 → 22期生3年次
  WHEN test_name = '第1回模擬試験(3年次)' THEN '第1回模擬試験(22期生3年次)'
  WHEN test_name = '第2回模擬試験(3年次)' THEN '第2回模擬試験(22期生3年次)'
  WHEN test_name = '第3回模擬試験(3年次)' THEN '第3回模擬試験(22期生3年次)'
  WHEN test_name = '第4回模擬試験(3年次)' THEN '第4回模擬試験(22期生3年次)'
  WHEN test_name = '第5回模擬試験(3年次)' THEN '第5回模擬試験(22期生3年次)'
  WHEN test_name = '第6回模擬試験(3年次)' THEN '第6回模擬試験(22期生3年次)'
  WHEN test_name = '第7回模擬試験(3年次)' THEN '第7回模擬試験(22期生3年次)'
  WHEN test_name = '第8回模擬試験(3年次)' THEN '第8回模擬試験(22期生3年次)'
  WHEN test_name = '第9回模擬試験(3年次)' THEN '第9回模擬試験(22期生3年次)'
  WHEN test_name = '第10回模擬試験(3年次)' THEN '第10回模擬試験(22期生3年次)'
  
  -- 2年次 → 23期生2年次
  WHEN test_name = '第1回模擬試験(2年次)' THEN '第1回模擬試験(23期生2年次)'
  WHEN test_name = '第2回模擬試験(2年次)' THEN '第2回模擬試験(23期生2年次)'
  WHEN test_name = '第3回模擬試験(2年次)' THEN '第3回模擬試験(23期生2年次)'
  
  -- 1年次 → 24期生1年次
  WHEN test_name = '第1回模擬試験(1年次)' THEN '第1回模擬試験(24期生1年次)'
  
  ELSE test_name  -- その他の値は変更しない
END;

-- subject_criteriaテーブルのtest_nameも同様に更新
UPDATE subject_criteria
SET test_name = CASE
  -- 3年次 → 22期生3年次
  WHEN test_name = '第1回模擬試験(3年次)' THEN '第1回模擬試験(22期生3年次)'
  WHEN test_name = '第2回模擬試験(3年次)' THEN '第2回模擬試験(22期生3年次)'
  WHEN test_name = '第3回模擬試験(3年次)' THEN '第3回模擬試験(22期生3年次)'
  WHEN test_name = '第4回模擬試験(3年次)' THEN '第4回模擬試験(22期生3年次)'
  WHEN test_name = '第5回模擬試験(3年次)' THEN '第5回模擬試験(22期生3年次)'
  WHEN test_name = '第6回模擬試験(3年次)' THEN '第6回模擬試験(22期生3年次)'
  WHEN test_name = '第7回模擬試験(3年次)' THEN '第7回模擬試験(22期生3年次)'
  WHEN test_name = '第8回模擬試験(3年次)' THEN '第8回模擬試験(22期生3年次)'
  WHEN test_name = '第9回模擬試験(3年次)' THEN '第9回模擬試験(22期生3年次)'
  WHEN test_name = '第10回模擬試験(3年次)' THEN '第10回模擬試験(22期生3年次)'
  
  -- 2年次 → 23期生2年次
  WHEN test_name = '第1回模擬試験(2年次)' THEN '第1回模擬試験(23期生2年次)'
  WHEN test_name = '第2回模擬試験(2年次)' THEN '第2回模擬試験(23期生2年次)'
  WHEN test_name = '第3回模擬試験(2年次)' THEN '第3回模擬試験(23期生2年次)'
  
  -- 1年次 → 24期生1年次
  WHEN test_name = '第1回模擬試験(1年次)' THEN '第1回模擬試験(24期生1年次)'
  
  ELSE test_name  -- その他の値は変更しない
END;

-- 外部キー制約を再作成
ALTER TABLE test_scores 
ADD CONSTRAINT test_scores_test_name_fkey 
FOREIGN KEY (test_name) REFERENCES question_counts(test_name);

-- 更新結果の確認用クエリ
SELECT 
  'question_counts' as table_name,
  test_name,
  COUNT(*) as record_count
FROM question_counts 
GROUP BY test_name 
ORDER BY test_name;

SELECT 
  'test_scores' as table_name,
  test_name,
  COUNT(*) as record_count
FROM test_scores 
GROUP BY test_name 
ORDER BY test_name;

SELECT 
  'subject_criteria' as table_name,
  test_name,
  COUNT(*) as record_count
FROM subject_criteria 
GROUP BY test_name 
ORDER BY test_name; 