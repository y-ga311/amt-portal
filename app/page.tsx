"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { User, Users, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoggingIn(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminId,
        password: password,
      })

      if (error) throw error

      setIsLoginModalOpen(false)
      router.push('/admin')
    } catch (err) {
      console.error('ログインエラー:', err)
      setError('ログインに失敗しました。IDとパスワードを確認してください。')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <Image
                src="/images/character-icon-new.png"
                alt="キャラクターアイコン"
                width={40}
                height={40}
                className="object-contain w-10 h-10"
                style={{ width: '40px', height: '40px' }}
              />
            </div>
            <h1 className="text-2xl font-bold text-brown-800 dark:text-brown-100">AMTつながるポータル</h1>
            
          </div>

          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <CardTitle className="text-brown-800 dark:text-brown-100">ログイン選択</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                ログインタイプを選択してください
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 bg-white dark:bg-brown-900">
              <div className="text-center">
                <p className="mb-2 text-brown-700 dark:text-brown-200">あなたは？</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 bg-white dark:bg-brown-900 rounded-b-lg">
              <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                <Link href="/login?type=student">
                  <User className="mr-2 h-4 w-4" />
                  学生ログイン
                </Link>
              </Button>
              <Button asChild className="w-full bg-brown-600 hover:bg-brown-700 text-white">
                <Link href="/login?type=parent">
                  <Users className="mr-2 h-4 w-4" />
                  保護者ログイン
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full border-brown-300 text-brown-600 hover:bg-brown-50 dark:border-brown-700 dark:text-brown-400 dark:hover:bg-brown-900"
                onClick={() => router.push("/admin/login")}
              >
                  管理者ログイン
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>管理者ログイン</DialogTitle>
            <DialogDescription>
              管理者IDとパスワードを入力してください
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="adminId">管理者ID</Label>
              <Input
                id="adminId"
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                required
                placeholder="管理者IDを入力"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="パスワードを入力"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                'ログイン'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
