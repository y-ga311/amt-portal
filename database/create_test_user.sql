-- テストユーザーを作成
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'aaa@example.com',
  crypt('aaa', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 作成したユーザーのIDを取得
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'aaa@example.com';
  
  -- admin_usersテーブルにユーザーを追加
  INSERT INTO admin_users (id, auth_id)
  VALUES (DEFAULT, user_id);
  
  -- adminsテーブルにユーザーを追加
  INSERT INTO admins (id, username, password)
  VALUES (DEFAULT, 'aaa', 'aaa');
END $$; 