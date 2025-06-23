-- Add foreign key relationship between test_scores and question_counts
ALTER TABLE test_scores
ADD CONSTRAINT test_scores_test_name_fkey
FOREIGN KEY (test_name)
REFERENCES question_counts(test_name)
ON DELETE CASCADE;

-- Add comment to explain the relationship
COMMENT ON CONSTRAINT test_scores_test_name_fkey ON test_scores IS 'テストスコアと問題数の関連付け'; 