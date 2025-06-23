import { createClient } from '@/utils/supabase/server'

interface CriteriaData {
  passing: any
  failing: any
}

interface SubjectCriteria {
  id: string
  test_name: string
  criteria_type: 'passing' | 'failing'
  anatomy: number
  physiology: number
  clinical_medicine_overview: number
  clinical_medicine_detail: number
  oriental_medicine_overview: number
  meridian_points: number
  oriental_medicine_clinical: number
}

export async function getTestCriteria(testName: string) {
  const supabase = await createClient()

  try {
    console.log(`基準値データを取得します: ${testName}`)
    // 基準値データを取得
    const { data: criteriaData, error: criteriaError } = await supabase
      .from('subject_criteria')
      .select('*')
      .eq('test_name', testName)
      .order('criteria_type', { ascending: true })

    if (criteriaError) {
      console.error('基準値データの取得に失敗しました:', criteriaError)
      return {
        success: false,
        error: '基準値データの取得に失敗しました',
        data: null
      }
    }

    console.log('取得した基準値データ:', criteriaData)

    if (!criteriaData || criteriaData.length === 0) {
      console.log('基準値データが存在しません')
      return {
        success: true,
        error: null,
        data: {
          passing: null,
          failing: null
        }
      }
    }

    // 合格基準と不合格基準を分ける
    const criteria: CriteriaData = {
      passing: criteriaData.find((item: SubjectCriteria) => item.criteria_type === 'passing') || null,
      failing: criteriaData.find((item: SubjectCriteria) => item.criteria_type === 'failing') || null
    }

    console.log('処理後の基準値データ:', criteria)

    // 基準値データの構造を確認
    console.log('基準値データの詳細:', {
      test_name: testName,
      raw_data: criteriaData,
      processed_data: criteria,
      passing_data: criteria.passing,
      failing_data: criteria.failing
    })

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

// テスト名の配列を受け取り、各テストの基準値データを取得する関数
export async function getTestCriteriaList(testNames: string[]) {
  const supabase = await createClient()

  try {
    console.log('基準値データの一括取得を開始します')
    console.log('取得するテスト名:', testNames)

    if (!testNames || testNames.length === 0) {
      console.error('テスト名が指定されていません')
      return {
        success: false,
        error: 'テスト名が指定されていません',
        data: null
      }
    }

    // 基準値データを一括取得
    console.log('Supabaseクエリを実行します:', {
      table: 'subject_criteria',
      testNames: testNames
    })

    const { data: criteriaData, error: criteriaError } = await supabase
      .from('subject_criteria')
      .select('*')
      .in('test_name', testNames)
      .order('test_name', { ascending: true })
      .order('criteria_type', { ascending: true })

    console.log('基準値データの取得結果:', {
      data: JSON.stringify(criteriaData, null, 2),
      error: criteriaError
    })

    if (criteriaError) {
      console.error('基準値データの一括取得に失敗しました:', criteriaError)
      return {
        success: false,
        error: '基準値データの一括取得に失敗しました',
        data: null
      }
    }

    if (!criteriaData || criteriaData.length === 0) {
      console.log('基準値データが存在しません')
      return {
        success: true,
        error: null,
        data: {}
      }
    }

    // テスト名ごとに基準値データを整理
    const criteriaMap = testNames.reduce((acc: { [key: string]: CriteriaData }, testName) => {
      const testCriteria = criteriaData.filter((item: SubjectCriteria) => item.test_name === testName)
      console.log(`テスト ${testName} の基準値データ:`, JSON.stringify(testCriteria, null, 2))

      acc[testName] = {
        passing: testCriteria.find((item: SubjectCriteria) => item.criteria_type === 'passing') || null,
        failing: testCriteria.find((item: SubjectCriteria) => item.criteria_type === 'failing') || null
      }
      return acc
    }, {})

    console.log('処理後の基準値データ:', JSON.stringify(criteriaMap, null, 2))

    return {
      success: true,
      error: null,
      data: criteriaMap
    }
  } catch (error) {
    console.error('基準値データの一括取得中にエラーが発生しました:', error)
    return {
      success: false,
      error: '基準値データの一括取得中にエラーが発生しました',
      data: null
    }
  }
} 