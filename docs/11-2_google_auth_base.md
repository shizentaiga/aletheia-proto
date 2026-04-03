# Google Cloud 認証基盤設定マニュアル (Aletheia Project)

作成日: 2026-04-02
用途: Googleログイン認証およびAPI利用のための基礎設定

---

## 0. 技術解説：APIキー と OAuth 2.0 の役割

本プロジェクトで使用する2種類の認証方式は、その目的と検証方法が根本的に異なります。

| 項目 | **APIキー** | **OAuth 2.0 (認証)** |
| :--- | :--- | :--- |
| **役割** | **プログラム実行用**（システム間の通信） | **ユーザー識別用**（ログイン・本人確認） |
| **イメージ** | 「ホテルの建物に入るための業者用合鍵」 | 「宿泊客が自分の部屋に入るためのカードキー」 |
| **成立条件** | 正しい文字列をリクエストに含めるだけ | **ユーザーがブラウザで「許可」ボタンを押す** |
| **検証方法** | **コマンドライン (curl)** が確実かつ迅速 | **ブラウザ** での挙動確認が必須 |
| **主な用途** | AI解析、翻訳、データ取得など | ログイン、メールアドレスの取得、個人データ操作 |

### 💡 運用のアドバイス
- **APIキー** は、プログラムが裏側で「勝手に動く」ために使います。
- **OAuth 2.0** は、最初に「人間が介入」して認証を成立させる必要があります。
- そのため、OAuthのテストでブラウザを使用するのは、**「Googleが提供する正規のログイン画面を通っているか」** を確認するためです。

---

## 1. Google Cloud コンソールでの取得フロー

### APIキーの取得
1.  **[APIとサービス] > [認証情報]** へ移動。
2.  **[+ 認証情報を作成] > [API キー]** を選択。
3.  **制限の設定:** - 名前: `google-login-key`
    - APIの制限: `Google Cloud APIs` と `Cloud Natural Language API` を選択。
    - アプリケーションの制限: `なし` (サーバー間通信のため)。

### OAuth 2.0 クライアント ID の取得
1.  **OAuth 同意画面の作成:** - **User Type:** 個人アカウント（@gmail.com）を使用する場合は **`外部 (External)`** を選択。
    - ※ `内部` は組織ドメイン専用のため、個人利用ではエラー `403: org_internal` が発生する。
    - 必須項目（アプリ名、サポートメール）を入力し保存。
2.  **テストユーザーの追加（必須）:**
    - 「外部」かつ「テスト中」の状態では、許可されたユーザーしかログインできない。
    - **[オーディエンス]** または **[テストユーザー]** ページから、自分のメールアドレスを必ず追加する。
3.  **クライアント ID の発行:**
    - **[+ 認証情報を作成] > [OAuth クライアント ID]**。
    - アプリケーションの種類: `ウェブ アプリケーション`。
    - 承認済みのリダイレクト URI: `http://localhost:8787/auth/callback` を追加。
4.  **秘匿情報の保存:** - 発行された `JSON` ファイルをダウンロードし、安全な場所へ保管。

---

## 2. 躓きやすいポイント・注意点

* **UIの迷路（User Typeの変更）:** - 設定後に「内部」から「外部」へ変更したい場合、通常の「設定」メニューではなく **[オーディエンス]** ページに切り替えスイッチが配置されている場合がある。UIが複雑なため、左メニューを隅々まで確認すること。
* **APIキー vs OAuth ID:** - APIキーは「プロジェクトの識別」用。
    - OAuth ID/Secretは「ユーザー個人の認証（ログイン）」用。両者の役割を混同しないこと。
* **反映待ちの「沈黙」:** - 設定直後はGoogle側のサーバー同期により、5分〜1時間ほど「認証エラー」が出る場合がある。焦らず待機が必要。
* **リダイレクトURIの完全一致:** - `http` か `https` か、末尾の `/` があるかないかだけで認証は失敗する。コンソールとコードで1文字の狂いもなく合わせること。

---

## 3. .dev.vars の設定方法

プロジェクトのルートディレクトリに `.dev.vars` ファイルを作成し、以下の形式で記述します。

```env
# Google Cloud API Key
API_KEY="AIza..."

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID="xxxxxx-xxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxx"
```

---

## 4. 動作確認の手順（疎通テスト）

設定した「鍵」がGoogle側で正しく認識されているか、プログラムを書く前にターミナル（Mac）を使用して確認します。

### ① APIキーの有効性チェック（Natural Language API）
Natural Language APIはセキュリティ上、ブラウザのURL欄に貼り付けるだけでは確認できません。ターミナルを開き、以下のコマンドの `[あなたのAPI_KEY]` 部分を置き換えて実行してください。

```bash
curl "[https://language.googleapis.com/v1/documents:analyzeEntities?key=](https://language.googleapis.com/v1/documents:analyzeEntities?key=)[あなたのAPI_KEY]" \
  -H "Content-Type: application/json" \
  --data '{
    "document": {
      "type": "PLAIN_TEXT",
      "content": "GoogleのAPIテストです。"
    },
    "encodingType": "UTF8"
  }'
```

#### 【判定基準：① APIキーの実行結果】

* **成功時のレスポンス（正常）**:
    `"entities": [...]` というデータが表示されれば成功。AIが単語を認識し、言語が `"ja"` と判定されていることを確認する。

* **失敗時のレスポンス（エラーへの対処法）**:
    - **`SERVICE_DISABLED`**:
      Google Cloudコンソールで「Cloud Natural Language API」の有効化（Enable）が完了していない。エラー文中のURLへアクセスし「有効にする」ボタンを押す。
    - **`API_KEY_SERVICE_BLOCKED`**:
      APIキーに「APIの制限」がかかっており、このAPIが許可されていない。「認証情報」の設定画面で「Cloud Natural Language API」にチェックを入れて保存する。
    - **`API key not valid`**:
      APIキーのコピーミス、あるいはキーが正しく作成されていない。

### ② OAuth 2.0 クライアントIDの疎通チェック
以下のURLの `[あなたのGOOGLE_CLIENT_ID]` 部分を置き換えてブラウザで開きます。

`https://accounts.google.com/o/oauth2/v2/auth?client_id=[あなたのGOOGLE_CLIENT_ID]&redirect_uri=http://localhost:8787/auth/callback&response_type=token&scope=email`

#### 【判定基準：② OAuth 2.0 の実行結果】

* **成功（認証画面が表示される）**:
    **Googleの「アカウントの選択」画面**が表示されれば合格。
    ※新規ユーザー登録のロジックを確認したい場合は、プログラム実装が完了するまで、ここでログインを中断して良い。

* **失敗（エラー画面が表示される）**:
    - **`401: invalid_client`**: 
        `.dev.vars` に貼り付けたクライアントIDが間違っているか、末尾の `.apps.googleusercontent.com` が欠けている可能性があります。
    - **`400: redirect_uri_mismatch`**: 
        Googleコンソールで設定した「承認済みのリダイレクト URI」と、テスト用URL内の `redirect_uri` パラメータが1文字でも異なっています。

---
**※注意:** 設定直後はGoogle側の反映待ちでエラーになることがあります。その場合は5分〜15分ほど時間を置いてから再度試してください。