# 公開內容與第三方權利清單

盤點日期：2026-10-17。這份清單記錄實際包含的內容與未確認項目，不是第三方的授權書。

| 內容 | 封裝與權利狀態 |
|---|---|
| HTML、CSS、JS、介面及方法說明 | 本專案原創；使用者已授權保存至公開 GitHub。尚未指定開源授權 |
| MSCI 月歷史與 CPI 觀察值 | 完全未內建、未下載或再散布。CSV 由使用者合法取得、在本機處理 |
| VCMM | 僅版本化少量公開區間數字、來源日期、改寫摘要與連結；沒有官方圖表、完整表格或專有引擎 |
| 文獻規則 | 以自行撰寫的程式實作並改寫方法，連到原文；不複製論文或原研究成功率 |
| 字型、logo、圖片、圖表 runtime | 系統字型、自製 SVG；沒有第三方字型下載、logo 或圖表套件 |
| Playwright | 僅開發依賴，Apache-2.0（見套件 LICENSE），不包含在 dist/ 或網站 runtime |
| QA 截圖及 fixture | 自製畫面與明確合成數字，不含個人 CSV 或市場觀察值 |

[MSCI Index Terms](https://www.msci.com/legal/index-terms) 對重製與再散布設有限制；目前沒有相符完整月資料的重分發許可。不要因資料在官方查詢可見就包入 Git 或網站。

[Vanguard 官方預測頁](https://corporate.vanguard.com/content/corporatesite/us/en/corp/vemo/vemo-return-forecasts.html) 與[地區數值表](https://www.vanguardmexico.com/en/home/insights/economic-market-outlook/vanguard-capital-markets-model-forecasts-2026) 說明應同時提供揭露、來源及方法背景。本版附原始連結與自行改寫的限制說明，不宣稱因此取得全面重製權；尚無 Vanguard 個別書面再呈現許可。公開網站前由擁有者確認引用方式，必要時改成來源連結及使用者自行輸入錨點。

本工具不是 Vanguard 或 MSCI 官方產品，也未獲其認可。Vanguard 的預測具假設性、非實際投資結果、非保證，會隨模型日期改變。其資產預測包含波動及相關性等分布資訊；本工具僅取區間中點作為名目 USD 幾何漂移錨點，未重建原分布。預測未扣通膨、稅及基金費用；本工具另外處理費用與購買力。近端十年後的銜接是自訂研究假設。

## 公開狀態更新

2026-10-17 依擁有者進一步要求，公開既有研究工具於 GitHub Pages。此動作沒有取得或新增第三方個別書面授權；本清單列出的資料、引用範圍與限制持續適用。沒有將使用者本機 CSV、完整月序列或官方完整表格加入部署。
