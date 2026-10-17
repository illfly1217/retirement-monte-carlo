# 接續本次工作

本專案不是只含範例：已完成ES Modules應用、Web Worker蒙地卡羅引擎、四提領策略、CSV匯入、互動SVG、比較、提領率搜尋、24項測試、效能腳本與方法文件。但**尚未完成瀏覽器QA、GitHub與Sites部署**，原因是命令環境網路受限。

## 環境需要

- 命令執行環境需允許正常DNS解析及HTTPS連出`git.chatgpt-team.site:443`，供官方Sites source helper推送原始碼。
- localhost listener與client互通，或使用平台支援的preview forwarding，供瀏覽器QA。
- 不需要公開網站、不需要停用防火牆、不需要在程式碼保存token。
- GitHub connector可讀寫既有repo，但本回合沒有create-repo操作。本機GitHub CLI需使用者在可信環境重新登入；其驗證可與Sites部署分別處理。

## 固定identity

Project ID以`.openai/hosting.json`為準，已建立，不可再create_site。預期URL在Sites回應中為`https://global-retirement-lab.njames741.chatgpt.site`，但它**不是已部署成功的網址**。受眾保持owner-private。

## 給下一個Work／Codex agent的指示

讀README與docs。從完整專案包恢復本機檔案／Git，不要用空的Sites來源覆蓋它。先get_site確認owner-private，再取得新的source write credential（舊credential約10分鐘到期，未寫入檔案）。使用Sites skill的source helper開啟／封裝，credential僅透過stdin傳入，不寫檔、不放命令參數、不列印。

Windows PTY本次需將JSON送入後再單獨送Return，才會觸發隱藏stdin讀取。此前失敗的helper已退出，不是仍待執行的部署。若helper再次回網路拒絕，先處理環境，不要改應用或偽造pushed SHA。

執行`npm test`、`npm run check`，在可連的瀏覽器驗證及測10k/100k。修正後更新QA.md。source helper成功後以其回傳project_id、commit_sha、archive直接呼叫owner-private保存部署操作，記錄saved version與deployment ID，poll到終態。不要因權限不足改成public。

GitHub repo建立後，從本機Git新增`github`remote推送；保持Site的來源remote不變。README已有命令。若Github repo在外部已有變更，先整合再發布，不force push。

Standalone生成器`node scripts/standalone.mjs`從相同production程式碼產生可下載的單檔HTML，不是未來的主要開發分支。修改模組後重新生成，不手動改生成檔。
