# 維護與發布作業

## 第一版實際來源

`.openai/hosting.json`保存project_id與static.directory=dist。這個identity必須維持，未來才能部署到同一Site網址。受眾維持owner-private；公開網站需使用者明確授權及資料權利確認。

Sites儲存與GitHub是不同來源系統，**沒有自動同步**。預定由Sites source helper將完整專案commit/push至Site的來源Git，然後從同一SHA封裝靜態輸出並保存部署版本。本次source helper的遠端操作被命令環境網路限制阻擋，尚未完成，請見HANDOFF.md。部署tar應只有正式靜態輸出及hosting manifest；完整README/tests/docs必須在來源Git中。

## 目前GitHub限制

GitHub連接器已確認使用者njames741，但沒有create_repository工具，預期repo讀取回404；本機CLI登入失效。不能冒稱已建立repo或已備份到GitHub。README提供有效登入後的建立私有repo與新增github remote命令。

## 後續Work操作

1. 指定同一個Site／網址，先get_site確認identity及owner-private。
2. 使用Sites來源寫入credential與官方site-workflow helper開啟現有來源；不要另建Site。
3. 若GitHub已存在變更，先fetch/merge其分支，解決衝突，再編輯。不要覆蓋另一邊未整合的版本。
4. 適當測試：`npm test`、`npm run check`；變更引擎時再測速及瀏覽器QA。
5. 更新方法、資料截至日期與測試紀錄；沒有必要不更改資料假設。
6. source helper保存推送，從同一commit封裝；owner-private用save_version_and_deploy_private；記錄回傳version_id與deployment_id。
7. GitHub可用時把同一commit推到github main（非任意舊分支），確認兩端HEAD一致；若任一步失敗，明確註記哪端尚未同步。

## 後續Codex操作

clone `njames741/retirement-monte-carlo`，開branch持續開發，不需要重新建環境或安裝依賴。先看README、METHODOLOGY與DECISIONS，再改引擎。若先前Work有新發布，先取回Sites來源並整合才開工。Codex環境若沒有Sites能力，先推GitHub，再讓Work在同一Site載入指定commit並部署；不假設GitHub push會自動更新Site。

## 公開前

確認MSCI等第三方月序列、衍生資料與Vanguard預測引用的公開使用權；本機CSV不公開不等於所有內容自動獲准。確認使用者同意公開，才變更audience，保持同project_id，不因公開需求另建脫節副本。未完成權利確認時維持private。

## 測試與效能

`docs/benchmark-node.json`為實際本機Node測速，不冒充瀏覽器結果。`docs/QA.md`記錄瀏覽器操作與可驗證範圍。相同seed便於回歸比對，修改PRNG或月順序要當作模型版本變更。
