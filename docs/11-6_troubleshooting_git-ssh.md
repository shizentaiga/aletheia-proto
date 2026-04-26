# 既存プロジェクトのSSH移行および同期トラブル解決記録

## 1. 概要
本資料は、既存プロジェクト ` -proto` の接続方式をSSHへ変更し、発生した同期エラー（[rejected]）を解消してGitHubとの完全な同期を確立した際の手順を記録したものである。

---

## 2. SSHへの切り替えとステータス確認
既存のHTTPS接続から、作成済みのSSH鍵ペアを利用した接続へと切り替えを行った。

### 2.1 リモートURLの更新
    # 現在のURL確認
    git remote -v

    # SSH形式のURLへ上書き設定
    git remote set-url origin git@github.com:shizentaiga/ -proto.git

### 2.2 変更内容のコミット
ローカルで実施した修正（UIのEnterキー対応、コメント整理等）を記録。

    git add .
    git commit -m "feat: 検索フォームのEnterキー対応およびソースコードコメントの整理"

---

## 3. トラブルシューティング：Push拒否の解決

### 3.1 発生したエラー
`git push origin main` 実行時に以下のエラーが発生。

    ! [rejected] main -> main (fetch first)
    error: failed to push some refs to 'github.com:shizentaiga/ -proto.git'

**原因:**  
GitHub側（リモート）に、ローカルには存在しないコミット（履歴）が含まれていたため、整合性が取れず上書きがブロックされた。

---

### 3.2 解決手順（履歴の統合）
リモートの変更を取り込み、ローカルの変更と合流（Merge）させる。

    # 1. 合流方針をマージ（Merge）に設定
    git config pull.rebase false

    # 2. リモートの最新履歴を取得して合流
    # 履歴が断絶している場合は --allow-unrelated-histories を付与
    git pull origin main --allow-unrelated-histories

    # 3. 合流完了後、再度アップロードを実行
    git push origin main

---

## 4. 最終確認結果
以下の状態をもって、同期作業の完了とした。

- **GitHub上:** 修正済みの `Home.ui.tsx` が正しく反映されている  
- **ターミナル:** `git status` にて `Your branch is up to date with 'origin/main'.` と表示される  
- **VS Code:** ソース管理パネルの「同期」ボタンが正常に機能する  

---

## 5. 【補足】VS Codeでの日常的なコミット手順
ターミナルを使わず、VS Codeのエディタ画面からGUIで安全にアップロードする標準フローを以下に記す。

1. **変更の確認 (Source Control)**
   左メニューの「ソース管理アイコン」をクリックし、数字（変更件数）が出ていることを確認する。
2. **ステージング (Stage Changes)**
   変更されたファイル名の横にある **「＋ (プラス)」** ボタンをクリックする。
   - これにより、ファイルが「ステージ済みの変更」へ移動する（`git add` 相当）。
3. **メッセージ入力と確定 (Commit)**
   上部のテキストボックスに、実施した作業内容（例: `docs: 手順書の更新`）を記入し、**「コミット」** ボタンを押す。
4. **サーバーへ送信 (Sync / Push)**
   ボタンが **「変更を同期」** に変わるので、クリックしてGitHubへ反映させる（`git push` 相当）。

---
**記録日:** 2026年4月4日
**作成者:** shizentaiga