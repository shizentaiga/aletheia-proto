/**
 * [ALETHEIA PROJECT] 共通定数定義
 * 地理情報マッピングおよびアプリケーション全体で共有する固定値を管理します。
 */

/**
 * 1. UI表示用の固定文言（ラベル）の一元管理
 */
export const UI_TEXT = {
  RESET_LABEL: '指定なし',
  ALL_COUNTRY: '全国',
  REGION_HINT_SUFFIX: '周辺',
  AREA_ALL_SUFFIX: '全体',
} as const;

/**
 * 2. 都道府県の正規マスターデータ
 * ISO 3166-2:JP に準拠したコード、英語名、日本語名を統合。
 * Cloudflareからの入力 ("Tokyo") やコード ("13") をすべてここに集約。
 */
export const PREFECTURE_MASTER: Record<string, string> = {
  "01": "北海道", "Hokkaido": "北海道",
  "02": "青森県", "Aomori": "青森県",
  "03": "岩手県", "Iwate": "岩手県",
  "04": "宮城県", "Miyagi": "宮城県",
  "05": "秋田県", "Akita": "秋田県",
  "06": "山形県", "Yamagata": "山形県",
  "07": "福島県", "Fukushima": "福島県",
  "08": "茨城県", "Ibaraki": "茨城県",
  "09": "栃木県", "Tochigi": "栃木県",
  "10": "群馬県", "Gunma": "群馬県",
  "11": "埼玉県", "Saitama": "埼玉県",
  "12": "千葉県", "Chiba": "千葉県",
  "13": "東京都", "Tokyo": "東京都",
  "14": "神奈川県", "Kanagawa": "神奈川県",
  "15": "新潟県", "Niigata": "新潟県",
  "16": "富山県", "Toyama": "富山県",
  "17": "石川県", "Ishikawa": "石川県",
  "18": "福井県", "Fukui": "福井県",
  "19": "山梨県", "Yamanashi": "山梨県",
  "20": "長野県", "Nagano": "長野県",
  "21": "岐阜県", "Gifu": "岐阜県",
  "22": "静岡県", "Shizuoka": "静岡県",
  "23": "愛知県", "Aichi": "愛知県",
  "24": "三重県", "Mie": "三重県",
  "25": "滋賀県", "Shiga": "滋賀県",
  "26": "京都府", "Kyoto": "京都府",
  "27": "大阪府", "Osaka": "大阪府",
  "28": "兵庫県", "Hyogo": "兵庫県",
  "29": "奈良県", "Nara": "奈良県",
  "30": "和歌山県", "Wakayama": "和歌山県",
  "31": "鳥取県", "Tottori": "鳥取県",
  "32": "島根県", "Shimane": "島根県",
  "33": "岡山県", "Okayama": "岡山県",
  "34": "広島県", "Hiroshima": "広島県",
  "35": "山口県", "Yamaguchi": "山口県",
  "36": "徳島県", "Tokushima": "徳島県",
  "37": "香川県", "Kagawa": "香川県",
  "38": "愛媛県", "Ehime": "愛媛県",
  "39": "高知県", "Kochi": "高知県",
  "40": "福岡県", "Fukuoka": "福岡県",
  "41": "佐賀県", "Saga": "佐賀県",
  "42": "長崎県", "Nagasaki": "長崎県",
  "43": "熊本県", "Kumamoto": "熊本県",
  "44": "大分県", "Oita": "大分県",
  "45": "宮崎県", "Miyazaki": "宮崎県",
  "46": "鹿児島県", "Kagoshima": "鹿児島県",
  "47": "沖縄県", "Okinawa": "沖縄県",
} as const;

/**
 * 3. 地方（Region）区分と所属都道府県の定義
 */
export const JP_REGIONS: Record<string, string[]> = {
  hokkaido: ["北海道"],
  tohoku: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  kanto: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  chubu: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
  kinki: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  chugoku: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  shikoku: ["徳島県", "香川県", "愛媛県", "高知県"],
  kyushu: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
} as const;

/**
 * 4. 検索UI用のマスターデータ
 * SearchLogic.tsx に注入するデータの構造をここで定義します。
 */
export const SEARCH_MASTER = {
  region: {
    title: 'エリアを選択',
    options: {
      [UI_TEXT.ALL_COUNTRY]: { value: '', sub: null },
      '北海道': { value: 'hokkaido', sub: JP_REGIONS.hokkaido },
      '東北': { value: 'tohoku', sub: JP_REGIONS.tohoku },
      '関東': { value: 'kanto', sub: JP_REGIONS.kanto },
      '中部': { value: 'chubu', sub: JP_REGIONS.chubu },
      '近畿': { value: 'kinki', sub: JP_REGIONS.kinki },
      '中国': { value: 'chugoku', sub: JP_REGIONS.chugoku },
      '四国': { value: 'shikoku', sub: JP_REGIONS.shikoku },
      '九州・沖縄': { value: 'kyushu', sub: JP_REGIONS.kyushu }
    }
  },
  category: {
    title: '特徴を選択',
    options: {
      [UI_TEXT.RESET_LABEL]: { value: '', sub: null },
      'Wi-Fiあり': { value: 'wifi', sub: null },
      '電源あり': { value: 'power', sub: null },
      '禁煙': { value: 'no-smoking', sub: null }
    }
  }
} as const;

/**
 * 5. 互換用ユーティリティ
 */

// 既存コードが JP_PREFECTURES を参照している場合の互換性維持
export const JP_PREFECTURES = PREFECTURE_MASTER;

/**
 * CloudflareのRegionプロパティから日本語都道府県名を解決する
 */
export const getPrefectureName = (region: string | undefined): string => {
  if (!region) return "";
  return PREFECTURE_MASTER[region] || "";
};