import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// サーバーサイドでのみ実行されるコード
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // ポート587の場合はfalse
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: true, // デバッグモードを有効化
  logger: true // ロガーを有効化
})

export async function POST(request: Request) {
  try {
    console.log('メール送信API開始')
    console.log('環境変数確認:', {
      host: process.env.SMTP_HOST || '未設定',
      port: process.env.SMTP_PORT || '未設定',
      user: process.env.SMTP_USER || '未設定',
      pass: process.env.SMTP_PASS ? '設定済み' : '未設定'
    })

    const { to, subject, html } = await request.json()
    console.log('リクエストデータ:', { to, subject })

    if (!to || !subject || !html) {
      console.error('必須パラメータが不足:', { to, subject, html })
      return NextResponse.json(
        { success: false, error: '必須パラメータが不足しています' },
        { status: 400 }
      )
    }

    // 環境変数の詳細確認
    const missingVars = []
    if (!process.env.SMTP_HOST) missingVars.push('SMTP_HOST')
    if (!process.env.SMTP_PORT) missingVars.push('SMTP_PORT')
    if (!process.env.SMTP_USER) missingVars.push('SMTP_USER')
    if (!process.env.SMTP_PASS) missingVars.push('SMTP_PASS')

    if (missingVars.length > 0) {
      console.error('SMTP設定が不足しています:', missingVars)
      return NextResponse.json(
        { 
          success: false, 
          error: `メールサーバーの設定が不足しています: ${missingVars.join(', ')}`,
          details: '環境変数ファイル(.env.local)にSMTP設定を追加してください'
        },
        { status: 500 }
      )
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    }

    console.log('メール送信開始:', { to, subject })
    try {
      // トランスポーターの接続テスト
      console.log('SMTP接続テスト開始')
      await transporter.verify()
      console.log('SMTP接続テスト成功')

      console.log('メール送信開始')
      const info = await transporter.sendMail(mailOptions)
      console.log('メール送信成功:', info.messageId)
      return NextResponse.json({ success: true, messageId: info.messageId })
    } catch (sendError) {
      console.error('メール送信エラー（詳細）:', {
        error: sendError,
        name: sendError instanceof Error ? sendError.name : 'Unknown',
        message: sendError instanceof Error ? sendError.message : 'Unknown error',
        stack: sendError instanceof Error ? sendError.stack : undefined,
        code: (sendError as any).code,
        command: (sendError as any).command
      })
      throw sendError
    }
  } catch (error) {
    console.error('メール送信エラー:', error)
    if (error instanceof Error) {
      console.error('エラー詳細:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        command: (error as any).command
      })
    }
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'メール送信に失敗しました',
        details: '環境変数の設定またはSMTPサーバーの接続を確認してください'
      },
      { status: 500 }
    )
  }
} 