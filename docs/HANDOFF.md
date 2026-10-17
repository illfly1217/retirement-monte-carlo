# 接續工作（2026-10-17）

最新使用者決策已取代先前 Sites 私人部署優先的要求：主要開發採 Codex＋公開 GitHub，網站採 GitHub Pages；原先先本機試用的門檻已由本次「用 GitHub.io 開起來看」要求更新，網站已公開於 [https://njames741.github.io/retirement-monte-carlo/](https://njames741.github.io/retirement-monte-carlo/)。既有 Sites 不改受眾、不另建、不繼續部署。

## 已完成

- 從 retirement-history.bundle 恢復原 main commit `25195866c373da1412da5778890061be3c3d5e65`，工作檔與歷史一致，未覆蓋現有檔案。
- 建立並推送 [njames741/retirement-monte-carlo](https://github.com/njames741/retirement-monte-carlo)，保留原 commit；origin 指向 GitHub。
- 修正預設資產的 HTML step 錯誤、舊結果標籤、年度範圍標籤、CSV 換檔殘留錯誤／通膨模式、研究條件保存及 Worker 快取驗證。
- 32 項 Node／正式 Worker 測試通過；包含非單調 GK 網格、混合欄位 CPI 月份對齊、費用、算術期望與通膨。
- 真正桌面瀏覽器完成主要操作、10k／100k、取消重跑、下載與本機資料保存／清除；手機使用 390×844 viewport 驗證，非真實手機效能。見 QA。
- GitHub Actions：自動 CI 與獨立手動 Pages 工作流程。Pages 子路徑已於本機驗證。

## 環境診斷

CLI 在沙箱內讀不到有效 GitHub 憑證，沙箱外的 `gh auth status` 正常，無須使用者重新登入。沙箱內啟動的 server 顯示監聽但跨程序連線失敗；沙箱外啟動相同 server 成功。不要再把舊環境網路限制視為未驗證的永久障礙，不需要停用防火牆。

`npm run dev` 是本機根路徑試用；`BASE_PATH=/retirement-monte-carlo/` 是 Pages 路徑驗證。所有 listener 只監聽 127.0.0.1。

## 後續順序

1. 本次公開發布已完成，commit `ced5918`；[發布工作流程](https://github.com/njames741/retirement-monte-carlo/actions/runs/39024556102) 成功，已在實際網址驗證 Worker、圖表及下載。
2. 依使用者回饋繼續修正、測試並 push GitHub；Pages 仍只手動 workflow_dispatch，不因 push 自動更新。
3. 既有少量引用、來源及第三方權利限制見 RELEASE 與 THIRD_PARTY_NOTICES；沒有因網站公開而宣稱取得額外資料授權。
4. 要更新網站，從 main 手動 Run workflow，confirm_publication=publish；記錄成功部署的 SHA 與 run URL。
5. 若使用者另行同意自動發布，才新增 push main trigger。既有 Sites 不在此發布流程中。

MSCI 完整月序列仍缺，不得造資料。保留可用的自訂與 VCMM 參考情境。單檔版僅由模組生成；模組化 dist/ 為唯一主要來源。
