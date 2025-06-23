-- test_scoresテーブルにclinical_medicine_detail_total列を追加
ALTER TABLE test_scores
ADD COLUMN clinical_medicine_detail_total INTEGER;

-- 既存のレコードのclinical_medicine_detail_totalをNULLに設定
UPDATE test_scores
SET clinical_medicine_detail_total = NULL;

-- インデックスを作成（必要に応じて）
CREATE INDEX IF NOT EXISTS idx_test_scores_clinical_medicine_detail_total
ON test_scores(clinical_medicine_detail_total);

-- コメントを追加
COMMENT ON COLUMN test_scores.clinical_medicine_detail_total IS '臨床医学各論（総合）の得点'; 