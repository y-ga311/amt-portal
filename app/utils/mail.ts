interface MailOptions {
  to: string
  subject: string
  html: string
}

export async function sendMail(options: MailOptions) {
  try {
    const response = await fetch('/api/send-mail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('メール送信エラー:', error)
    return { success: false, error: error instanceof Error ? error.message : 'メール送信に失敗しました' }
  }
}

export async function sendNoticeMail(notice: any, to: string) {
  const subject = `【東洋医療専門学校】${notice.title}`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <p style="color: #333; font-size: 14px;">
        保護者様<br>
        いつも本校の教育活動にご理解とご協力を賜り、誠にありがとうございます。<br>
        以下の内容についてご連絡いたします。
      </p>

      <div style="margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
        ${notice.content}
      </div>
      <p style="color: #666; font-size: 12px;">
        本メールは送信専用のアドレスから自動配信されています。ご返信いただいても対応いたしかねますのでご了承ください。
      </p>
    </div>
  `

  return sendMail({ to, subject, html })
} 