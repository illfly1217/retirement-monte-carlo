# v1.2 已更新公開網站（2026-10-17）

- [公開網站](https://njames741.github.io/retirement-monte-carlo/) 已更新，部署來源 commit be2b69ecabae679d65099c43e315a57a6e079dd4。
- [PR #5](https://github.com/njames741/retirement-monte-carlo/pull/5) 已整合；issues #1、#2、#3 已關閉，#4 保留完整 MSCI 月資料待辦。
- [Pages 發布作業](https://github.com/njames741/retirement-monte-carlo/actions/runs/39026526081) verify／deploy 成功，沿用現有公開受眾與手動發布流程。
- 真正公開網址已驗證 v1.2、全新 TWD／3,000 萬、USD／100 萬、策略細節、內建美國 CPI 模擬、資料頁；沒有上傳欄位，pageerror 為零。
- [公開頁面截圖](screenshots/github-pages-v1.2.png)。未對既有 Sites 操作受眾或部署。

下方為首次發布的歷史紀錄。

# GitHub 保存與 GitHub Pages 發布

使用者於 2026-10-17 明確決定：公開 Repository 可以建立，網站須先本機試用並確認後才公開。此文件取代舊 Sites 雙來源／私人部署流程。

## 目前保存與發布狀態

Repository：[njames741/retirement-monte-carlo](https://github.com/njames741/retirement-monte-carlo)。原 bundle 的完整歷史保留於 main。本機 origin 指向此 repo。不要 force push；其他環境開工先 fetch 並整合。

使用者於 2026-10-17 進一步要求透過 GitHub.io 開啟試用，已授權本次公開發布。正式網址：[https://njames741.github.io/retirement-monte-carlo/](https://njames741.github.io/retirement-monte-carlo/)。發布 commit `ced591822f39fab8eaeb6e8c2a0ffb9e0c8572a1`；[Actions run](https://github.com/njames741/retirement-monte-carlo/actions/runs/39024556102) 的 verify 與 deploy 均成功。既有 Sites identity 保留於 .openai/hosting.json；本次不操作該 Site，原私人受眾不變。

## 開發與檢查

```sh
npm ci
npm test
npm run check
npx playwright install chromium
npm run test:browser
```

CI 使用 Ubuntu、Node 24、Chromium，另有 Pixel 7 viewport 模擬。瀏覽器測試實際服務 `/retirement-monte-carlo/`，檢查 Worker、表單、圖表、CSV、保存、比較、搜尋與下載。只有開發測試需要 Playwright，正式網站沒有該套件。

改變引擎再跑 `npm run benchmark -- --swr`，並在實際瀏覽器測時。請勿把 Node 結果稱為瀏覽器結果。

## 手動發布程序（第一次已完成）

第一次已依使用者要求完成；後續仍維持手動發布，並保留權利盤點與測試程序：

1. Repository Settings → Pages → Build and deployment → Source 選 **GitHub Actions**。
2. Actions → **Publish GitHub Pages (manual approval)** → Run workflow。
3. 選 main，confirm_publication 選 **publish**；預設 no 會略過部署。
4. 工作流程先重跑 Node 與瀏覽器檢查，再將 **dist/** 上傳為 Pages artifact，透過 OIDC 部署，無自建長期 deploy token。
5. 檢查 deploy job 成功、回傳的 page_url 與實際公開頁面，測 module Worker、圖表及結果下載，記錄部署 commit／run URL。

工作流程僅 workflow_dispatch，沒有 push、schedule 或 workflow_run 部署觸發。即使 CI 通過也不會自動公開。若另獲使用者同意，才可改成 main push 自動發布；仍應保留測試依賴。

## 權利與封裝檢查

- dist 僅含原創 HTML/CSS/JS、.nojekyll 及原創第三方來源說明；沒有 MSCI 或 ETF 月數列、CPI 資料、第三方圖表、logo、外部字型或 API 憑證。
- local-data/、.env、bundle、ZIP、test-results/、node_modules/ 不進版控或 Pages artifact。
- tests/fixtures.mjs 為合成、可手算的測試數字，不會被部署為市場資料。
- 預設費用 0.06% 是版本化假設；總報酬含股息。ETF NAV 抽樣不重扣成本。
- Vanguard 只引用少量公開數值、改寫的方法摘要與原始連結，沒有複製完整表格、圖片或其專有模型。這不等於取得其個別再呈現許可；請參照 [第三方清單](THIRD_PARTY_NOTICES.md) 完成擁有者確認，必要時改為連結及使用者輸入錨點。
- 尚未選定原創程式的開源授權；不要擅自替擁有者加入 MIT 等授權。

## 回復與維護

若已公開後需要回復版本，以正常 revert commit 或手動選定經檢查的 main 版本重新發布，保留完整歷史。網站與本機各 origin 的 IndexedDB/localStorage 分離，GitHub Pages 不會自動帶入本機 CSV。每次發布都要由訪客自行匯入合法資料。

## 公開網址驗證

2026-10-17 在真正的 GitHub Pages URL 啟動 50 年 × 10,000 路徑，Worker 完成約 0.52 秒，耗盡機率 43.0%、雙重成功率 57.0%，與同 seed 的本機結果一致。P1/P99、對數刻度、年度滑桿及 CSV 下載可用，console 無 error／warn。[公開頁面畫面](screenshots/github-pages.png)。

本次未取得或聲稱新增 MSCI／Vanguard 個別資料授權；仍未散布完整月序列或官方完整表格。既有少量具來源引用及限制聲明維持不變。
