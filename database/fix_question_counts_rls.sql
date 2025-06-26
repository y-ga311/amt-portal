-- question_countsテーブルのRLSポリシーを修正
-- 管理者がINSERT、UPDATE、DELETEを実行できるようにする

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Authenticated users can view question counts" ON public.question_counts;
DROP POLICY IF EXISTS "authenticated_all_access" ON question_counts;
DROP POLICY IF EXISTS "anon_read_access" ON question_counts;

-- 新しいポリシーを作成
-- 認証されたユーザーは全ての操作にアクセス可能（管理者用）
CREATE POLICY "authenticated_all_access" ON public.question_counts
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 匿名ユーザーは読み取りのみ可能
CREATE POLICY "anon_read_access" ON public.question_counts
    FOR SELECT
    TO anon
    USING (true);

-- コメントを追加
COMMENT ON POLICY "authenticated_all_access" ON public.question_counts IS '認証されたユーザー（管理者）は全ての操作にアクセス可能';
COMMENT ON POLICY "anon_read_access" ON public.question_counts IS '匿名ユーザーは読み取りのみ可能'; 