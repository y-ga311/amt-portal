-- Update test names in question_counts, test_scores, and subject_criteria tables
-- 試験名を新しい命名規則に更新

-- 外部キー制約を一時的に無効化
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
  
  ELSE test_name
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
  
  ELSE test_name
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
  
  ELSE test_name
END;

-- 外部キー制約を再作成
ALTER TABLE test_scores 
ADD CONSTRAINT test_scores_test_name_fkey 
FOREIGN KEY (test_name) REFERENCES question_counts(test_name);

-- コメントの更新
COMMENT ON COLUMN question_counts.test_name IS 'テスト名（例：第1回模擬試験(22期生3年次)）';
COMMENT ON COLUMN test_scores.test_name IS 'テスト名（例：第1回模擬試験(22期生3年次)）';
COMMENT ON COLUMN subject_criteria.test_name IS 'テスト名（例：第1回模擬試験(22期生3年次)）'; 