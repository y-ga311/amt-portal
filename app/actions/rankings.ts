"use server"

import { createClient } from "@supabase/supabase-js"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

// サーバーサイドでSupabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// 管理者用のクライアント（サービスロールキーが設定されている場合のみ使用）
const adminSupabase = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : createClient(supabaseUrl, supabaseAnonKey)

// 通常のクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// テスト名に基づくランキングを取得する関数
export async function getTestRanking(testName: string) {
  try {
    console.log(`テスト "${testName}" のランキングを取得します`)

    // 部分一致検索のためのクエリ
    const likeQuery = `%${testName}%`

    // まず完全一致で検索
    let { data, error } = await adminSupabase
      .from("test_scores")
      .select("id, student_id, test_name, test_date, total_score")
      .eq("test_name", testName)
      .order("total_score", { ascending: false })

    // 完全一致で結果が見つからない場合、部分一致で検索
    if ((!data || data.length === 0) && !error) {
      console.log("完全一致で結果が見つからないため、部分一致で検索します")
      const partialResult = await adminSupabase
        .from("test_scores")
        .select("id, student_id, test_name, test_date, total_score")
        .ilike("test_name", likeQuery)
        .order("total_score", { ascending: false })

      data = partialResult.data
      error = partialResult.error
    }

    if (error) {
      console.error("ランキング取得エラー:", error)
      return { success: false, error: error.message, data: [] }
    }

    // total_scoreが存在しない場合は計算する
    const processedData = (data || []).map((item) => {
      if (item.total_score === undefined || item.total_score === null) {
        // 各科目の点数を合計して計算（実際のデータ構造に合わせて調整が必要）
        const totalScore = calculateTotalScore(item)
        return { ...item, total_score: totalScore }
      }
      return item
    })

    // ランキングを計算
    const rankings = processedData
      .sort((a, b) => b.total_score - a.total_score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        score: item.total_score,
      }))

    console.log(`${rankings.length}件のランキングデータを取得しました`)
    return { success: true, data: rankings }
  } catch (error) {
    console.error("ランキング取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "ランキングの取得に失敗しました",
      data: [],
    }
  }
}

// 学生の総合ランキングを取得する関数
export async function getStudentOverallRanking(studentId: string) {
  try {
    // 学生のテスト結果を取得
    const { data: studentResults, error: studentError } = await adminSupabase
      .from('test_scores')
      .select('*')
      .eq('student_id', studentId)

    if (studentError) {
      console.error('学生のテスト結果取得エラー:', studentError)
      return { success: false, error: '学生のテスト結果の取得に失敗しました' }
    }

    if (!studentResults || studentResults.length === 0) {
      return { success: false, error: 'テスト結果が見つかりません' }
    }

    // 各テストの総合点を計算
    const calculateTotalScore = (test: any) => {
      return (
        (Number(test.medical_overview) || 0) +
        (Number(test.public_health) || 0) +
        (Number(test.related_laws) || 0) +
        (Number(test.anatomy) || 0) +
        (Number(test.physiology) || 0) +
        (Number(test.pathology) || 0) +
        (Number(test.clinical_medicine_overview) || 0) +
        (Number(test.clinical_medicine_detail) || 0) +
        (Number(test.rehabilitation) || 0) +
        (Number(test.oriental_medicine_overview) || 0) +
        (Number(test.meridian_points) || 0) +
        (Number(test.oriental_medicine_clinical) || 0) +
        (Number(test.oriental_medicine_clinical_general) || 0) +
        (Number(test.acupuncture_theory) || 0) +
        (Number(test.moxibustion_theory) || 0)
      )
    }

    // 各テストの順位を計算
    const rankings = await Promise.all(
      studentResults.map(async (test) => {
        // 同じテストを受験した全学生の結果を取得
        const { data: allResults, error: allError } = await adminSupabase
          .from('test_scores')
          .select('*')
          .eq('test_name', test.test_name)
          .eq('test_date', test.test_date)

        if (allError) {
          console.error('全学生のテスト結果取得エラー:', allError)
          return null
        }

        // 各学生の総合点を計算
        const scores = allResults.map(result => ({
          student_id: result.student_id,
          total_score: calculateTotalScore(result)
        }))

        // 総合点で降順にソート
        scores.sort((a, b) => b.total_score - a.total_score)

        // 学生の順位を取得
        const rank = scores.findIndex(score => score.student_id === studentId) + 1

        return {
          test_name: test.test_name,
          test_date: test.test_date,
          rank,
          total_participants: scores.length
        }
      })
    )

    // 有効な順位のみを抽出
    const validRankings = rankings.filter(ranking => ranking !== null)

    if (validRankings.length === 0) {
      return { success: false, error: '有効な順位データが見つかりません' }
    }

    // 平均順位と最高順位を計算
    const averageRank = Math.round(
      validRankings.reduce((sum, ranking) => sum + ranking!.rank, 0) / validRankings.length
    )
    const bestRank = Math.min(...validRankings.map(ranking => ranking!.rank))
    const bestTest = validRankings.find(ranking => ranking!.rank === bestRank)

    // パーセンタイルを計算
    const percentile = Math.round(
      ((validRankings.reduce((sum, ranking) => sum + ranking!.total_participants, 0) / validRankings.length) - averageRank) /
      (validRankings.reduce((sum, ranking) => sum + ranking!.total_participants, 0) / validRankings.length) * 100
    )

    return {
      success: true,
      data: {
        average_rank: averageRank,
        total_tests: validRankings.length,
        best_rank: bestRank,
        best_test: bestTest?.test_name || '',
        percentile
      }
    }
  } catch (error) {
    console.error('総合ランキング取得エラー:', error)
    return { success: false, error: '総合ランキングの取得に失敗しました' }
  }
}

// 学生のバッジを取得する関数
export async function getStudentBadges(studentId: string | number) {
  try {
    console.log(`学生ID ${studentId} のバッジを取得します`)

    // 学生IDを文字列に変換
    const studentIdStr = String(studentId).trim()

    // 数値に変換可能か確認
    const studentIdNum = Number.parseInt(studentIdStr, 10)
    const isNumeric = !isNaN(studentIdNum)

    // 学生のテスト結果を取得
    const { data: studentTests, error: studentError } = await adminSupabase
      .from("test_scores")
      .select("*")
      .or(`student_id.eq.${studentIdStr},student_id.eq.${isNumeric ? studentIdNum : studentIdStr}`)
      .order("test_date", { ascending: false })

    if (studentError) {
      console.error("学生テスト結果取得エラー:", studentError)
      return { success: false, error: studentError.message, badges: [] }
    }

    // バッジの初期化
    const badges = [
      {
        id: "first_test",
        name: "初めての挑戦",
        description: "初めてのテストを受験",
        icon: "star",
        color: "blue",
        earned: studentTests && studentTests.length > 0,
      },
      {
        id: "passing_score",
        name: "合格達成",
        description: "合格点を獲得",
        icon: "trophy",
        color: "green",
        earned: false,
      },
      {
        id: "top_rank",
        name: "トップランカー",
        description: "ランキング上位を獲得",
        icon: "medal",
        color: "yellow",
        earned: false,
      },
      {
        id: "perfect_anatomy",
        name: "解剖学マスター",
        description: "解剖学で高得点を獲得",
        icon: "brain",
        color: "purple",
        earned: false,
      },
      {
        id: "oriental_expert",
        name: "東洋医学の達人",
        description: "東洋医学系で高得点を獲得",
        icon: "heart",
        color: "red",
        earned: false,
      },
      {
        id: "clinical_expert",
        name: "臨床医学の達人",
        description: "臨床医学系で高得点を獲得",
        icon: "zap",
        color: "orange",
        earned: false,
      },
    ]

    // テスト結果に基づいてバッジを更新
    if (studentTests && studentTests.length > 0) {
      // 合格点を獲得したかチェック
      const hasPassed = studentTests.some((test) => {
        const totalScore = test.total_score !== undefined ? test.total_score : calculateTotalScore(test)
        return totalScore >= 114 // 合格ライン
      })

      badges.find((b) => b.id === "passing_score")!.earned = hasPassed

      // 解剖学で高得点を獲得したかチェック
      const hasHighAnatomyScore = studentTests.some((test) => {
        return (test.anatomy || 0) >= 12 // 解剖学の高得点ライン
      })

      badges.find((b) => b.id === "perfect_anatomy")!.earned = hasHighAnatomyScore

      // 東洋医学系で高得点を獲得したかチェック
      const hasHighOrientalScore = studentTests.some((test) => {
        const orientalScore =
          (Number(test.oriental_medicine_overview) || 0) +
          (Number(test.meridian_points) || 0) +
          (Number(test.oriental_medicine_clinical) || 0) +
          (Number(test.oriental_medicine_clinical_general) || 0)

        return orientalScore >= 50 // 東洋医学系の高得点ライン
      })

      badges.find((b) => b.id === "oriental_expert")!.earned = hasHighOrientalScore

      // 臨床医学系で高得点を獲得したかチェック
      const hasHighClinicalScore = studentTests.some((test) => {
        const clinicalScore =
          (Number(test.clinical_medicine_overview) || 0) +
          (Number(test.clinical_medicine_detail) || 0) +
          (Number(test.rehabilitation) || 0)

        return clinicalScore >= 40 // 臨床医学系の高得点ライン
      })

      badges.find((b) => b.id === "clinical_expert")!.earned = hasHighClinicalScore
    }

    // ランキング上位かどうかを確認するために、全テストのランキングを取得
    if (studentTests && studentTests.length > 0) {
      try {
        const latestTest = studentTests[0]
        const rankingResult = await getTestRanking(latestTest.test_name)

        if (rankingResult.success && rankingResult.data.length > 0) {
          const studentRanking = rankingResult.data.find((r) => String(r.student_id) === studentIdStr)

          if (studentRanking && studentRanking.rank <= 3) {
            badges.find((b) => b.id === "top_rank")!.earned = true
          }
        }
      } catch (rankError) {
        console.error("ランキング取得エラー:", rankError)
      }
    }

    return { success: true, badges }
  } catch (error) {
    console.error("バッジ取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "バッジの取得に失敗しました",
      badges: [],
    }
  }
}

// 学生のレベルを計算する関数
export async function calculateStudentLevel(studentId: string | number) {
  try {
    console.log(`学生ID ${studentId} のレベルを計算します`)

    // 学生IDを文字列に変換
    const studentIdStr = String(studentId).trim()

    // 数値に変換可能か確認
    const studentIdNum = Number.parseInt(studentIdStr, 10)
    const isNumeric = !isNaN(studentIdNum)

    // 学生のテスト結果を取得
    const { data: studentTests, error: studentError } = await adminSupabase
      .from("test_scores")
      .select("*")
      .or(`student_id.eq.${studentIdStr},student_id.eq.${isNumeric ? studentIdNum : studentIdStr}`)
      .order("test_date", { ascending: false })

    if (studentError) {
      console.error("学生テスト結果取得エラー:", studentError)
      return { success: false, error: studentError.message }
    }

    if (!studentTests || studentTests.length === 0) {
      console.log(`学生ID ${studentId} のテスト結果が見つかりませんでした`)
      return { success: false, error: "テスト結果が見つかりませんでした" }
    }

    // 経験値の計算
    let experience = 0

    // テスト受験ごとに経験値を加算
    experience += studentTests.length * 10

    // 合格点を獲得したテストごとに追加経験値
    const passingTests = studentTests.filter((test) => {
      const totalScore = test.total_score !== undefined ? test.total_score : calculateTotalScore(test)
      return totalScore >= 114 // 合格ライン
    })
    experience += passingTests.length * 20

    // 高得点（80%以上）のテストごとに追加経験値
    const highScoreTests = studentTests.filter((test) => {
      const totalScore = test.total_score !== undefined ? test.total_score : calculateTotalScore(test)
      return totalScore >= 152 // 80%ライン（190点満点の80%）
    })
    experience += highScoreTests.length * 30

    // レベルの計算（経験値100ごとにレベルアップ）
    const level = Math.floor(experience / 100) + 1
    const nextLevelExp = level * 100
    const progress = ((experience % 100) / 100) * 100 // パーセンテージに変換

    return {
      success: true,
      level,
      experience,
      nextLevel: nextLevelExp,
      progress,
      remainingExp: nextLevelExp - experience,
    }
  } catch (error) {
    console.error("レベル計算エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "レベルの計算に失敗しました",
    }
  }
}

// テストの基準値を取得する関数
export async function getTestCriteria(testName: string) {
  const supabase = await createSupabaseClient()

  try {
    // 基準値データを取得
    const { data: criteriaData, error: criteriaError } = await supabase
      .from('subject_criteria')
      .select('*')
      .eq('test_name', testName)

    if (criteriaError) {
      console.error('基準値データの取得に失敗しました:', criteriaError)
      return {
        success: false,
        error: '基準値データの取得に失敗しました',
        data: null
      }
    }

    // 合格基準と不合格基準を分ける
    const criteria = {
      passing: criteriaData.find(item => item.criteria_type === 'passing'),
      failing: criteriaData.find(item => item.criteria_type === 'failing')
    }

    return {
      success: true,
      error: null,
      data: criteria
    }
  } catch (error) {
    console.error('基準値データの取得中にエラーが発生しました:', error)
    return {
      success: false,
      error: '基準値データの取得中にエラーが発生しました',
      data: null
    }
  }
}

// 合計点を計算するヘルパー関数
function calculateTotalScore(test: any): number {
  return (
    (Number(test.medical_overview) || 0) +
    (Number(test.public_health) || 0) +
    (Number(test.related_laws) || 0) +
    (Number(test.anatomy) || 0) +
    (Number(test.physiology) || 0) +
    (Number(test.pathology) || 0) +
    (Number(test.clinical_medicine_overview) || 0) +
    (Number(test.clinical_medicine_detail) || 0) +
    (Number(test.rehabilitation) || 0) +
    (Number(test.oriental_medicine_overview) || 0) +
    (Number(test.meridian_points) || 0) +
    (Number(test.oriental_medicine_clinical) || 0) +
    (Number(test.oriental_medicine_clinical_general) || 0) +
    (Number(test.acupuncture_theory) || 0) +
    (Number(test.moxibustion_theory) || 0)
  )
}
