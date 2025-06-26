-- question_countsテーブルのシーケンスを修正
-- 既存のデータの最大IDを確認し、シーケンスを適切な値に設定

-- 現在の最大IDを確認
SELECT 
  '現在の最大ID' as info,
  MAX(id) as max_id,
  COUNT(*) as total_records
FROM question_counts;

-- シーケンスを現在の最大ID + 1に設定（currvalエラーを回避）
SELECT setval(
  'question_counts_id_seq', 
  COALESCE((SELECT MAX(id) FROM question_counts), 0) + 1, 
  false
) as next_sequence_value;

-- シーケンスの現在値を確認（nextvalを使用）
SELECT 
  'シーケンス情報' as info,
  nextval('question_counts_id_seq') as next_value;

-- 確認のため、再度現在値を取得
SELECT currval('question_counts_id_seq') as final_sequence_value; 