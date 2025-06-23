-- test_scoresテーブルのシーケンスを修正
-- 現在の最大IDを取得して、シーケンスを適切な値に設定

-- 現在の最大IDを確認
SELECT '現在の最大ID: ' || COALESCE(MAX(id), 0) as current_max_id FROM test_scores;

-- シーケンスを現在の最大ID + 1に設定（安全な方法）
DO $$
DECLARE
    max_id INTEGER;
BEGIN
    -- 現在の最大IDを取得
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM test_scores;
    
    -- シーケンスを設定
    PERFORM setval('test_scores_id_seq', max_id + 1, false);
    
    -- 結果を表示
    RAISE NOTICE 'シーケンスを % に設定しました', max_id + 1;
END $$;

-- シーケンスの現在値を確認
SELECT 'シーケンスの現在値: ' || last_value as sequence_current_value 
FROM test_scores_id_seq; 