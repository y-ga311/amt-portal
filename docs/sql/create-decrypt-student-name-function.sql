-- students.name の pgp_sym_encrypt + base64 暗号文を復号する RPC
-- アプリ側 decrypt_student_name から呼び出す
-- 平文の氏名は decode せずそのまま返す（他学生への影響なし）

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.decrypt_student_name(
  encrypted_name text,
  secret_key text
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_name text;
  decrypted text;
BEGIN
  IF encrypted_name IS NULL OR btrim(encrypted_name) = '' THEN
    RETURN encrypted_name;
  END IF;

  IF secret_key IS NULL OR btrim(secret_key) = '' THEN
    RETURN encrypted_name;
  END IF;

  normalized_name := regexp_replace(btrim(encrypted_name), '\s+', '', 'g');

  -- 平文の日本語氏名（短い・非 base64）はそのまま返す
  IF length(normalized_name) < 20
     OR normalized_name ~ '[ぁ-んァ-ン一-龥A-Za-z]'
        AND normalized_name !~ '^[A-Za-z0-9+/]+=*$' THEN
    RETURN btrim(encrypted_name);
  END IF;

  IF normalized_name !~ '^[A-Za-z0-9+/]+=*$' THEN
    RETURN btrim(encrypted_name);
  END IF;

  BEGIN
    decrypted := pgp_sym_decrypt(
      decode(normalized_name, 'base64'),
      secret_key
    );
    RETURN btrim(decrypted);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN btrim(encrypted_name);
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.decrypt_student_name(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrypt_student_name(text, text) TO service_role;

NOTIFY pgrst, 'reload schema';
