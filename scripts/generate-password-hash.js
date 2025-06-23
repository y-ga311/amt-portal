const crypto = require('crypto');

const FIXED_SALT = 'toyoiryo_admin_salt_2024';

function generateHash(password) {
  const combinedString = password + FIXED_SALT;
  const hash = crypto
    .createHash('sha256')
    .update(combinedString)
    .digest('hex');
  
  console.log('パスワードハッシュ生成結果:');
  console.log('入力パスワード:', password);
  console.log('ソルト:', FIXED_SALT);
  console.log('生成されたハッシュ:', hash);
  
  return hash;
}

// コマンドライン引数からパスワードを取得
const password = process.argv[2];
if (!password) {
  console.error('使用方法: node generate-password-hash.js <パスワード>');
  process.exit(1);
}

generateHash(password); 