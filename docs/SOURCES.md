# 來源與資料狀態（v1.2）

查核及 CPI 擷取日期：2026-10-17。以下為版本化靜態資料，不在訪客開啟頁面時下載或更新。

| 來源 | 使用方式 |
|---|---|
| [主計總處台灣 CPI](https://data.gov.tw/dataset/6019) | 總指數原始值，基期 2021=100，1981-01–2026-09，549 筆水準；已隨專案內建 |
| [台灣 CPI 原始 XML](https://ws.dgbas.gov.tw/001/Upload/461/relfile/11525/230555/pr0101a1m.xml) | 僅取總指數、原始值、月資料；不混用年增率或分類指數 |
| [政府資料開放授權第 1 版](https://data.gov.tw/license) | 保留提供機關及來源；資料格式轉換與月變動計算由本工具完成 |
| [BLS／FRED CPIAUCNS](https://fred.stlouisfed.org/series/CPIAUCNS) | CPI-U 全項目、城市平均、未季調，BLS CUUR0000SA0；1981-01–2026-09，548 筆水準；已內建 |
| [BLS 資料使用說明](https://www.bls.gov/opub/copyright-information.htm) | public domain，保留來源標示，不使用官方 logo |
| [VCMM 美國官方](https://corporate.vanguard.com/content/corporatesite/us/en/corp/vemo/vemo-return-forecasts.html) | 2026-07-22 發布、2026-06-30 模型。名目 USD 幾何報酬、未扣費用／稅／通膨 |
| [VCMM 官方數值表](https://www.vanguardmexico.com/en/home/insights/economic-market-outlook/vanguard-capital-markets-model-forecasts-2026) | 2026-07-23 地區頁，十年美股 4.2–6.2%、全球除美 3.9–5.9%；沿用既有內建常數 |
| [MSCI ACWI IMI](https://www.msci.com/indexes/index/664204/msci-acwi-imi-index) | 指數身份；尚無可發布完整月序列 |
| [MSCI factsheet](https://www.msci.com/documents/10199/255599/msci-acwi-imi.pdf) | 公開摘要為 Gross，不能當成 Net、不能重建完整月數列；未包入產品 |
| [MSCI Index Terms](https://www.msci.com/legal/index-terms) | 重製及再散布需事先書面許可。相關月序列未內建，股票歷史抽樣暫不開放 |
| [VT 官方](https://advisors.vanguard.com/investments/products/new/vt/vanguard-total-world-stock-etf) | 基金費用假設及 FTSE Global All Cap 基準身份；不是 MSCI ACWI IMI ETF |
| [Guyton–Klinger 2006](https://www.financialplanningassociation.org/sites/default/files/2021-11/2006%20-%20Guyton%20and%20Klinger%20-%20Decision%20Rules%20and%20SWR%20(1).PDF) | 程式自行實作全股票改編，不挪用原研究成功率 |
| [Vanguard Dynamic Spending](https://www.vanguardinvestor.co.uk/articles/latest-thoughts/retirement/how-to-make-your-pension-last-and-your-retirement-enjoyable) | 資產比例目標與上年 CPI 調整支出的 −2.5%／+5% 限制 |
| [Politis–Romano Stationary Bootstrap](https://statistics.stanford.edu/technical-reports/stationary-bootstrap) | 幾何區塊及隨機起點的方法來源 |

美國 2025-10 沒有觀察值。產品排除 2025-10、2025-11 無法計算的單月通膨，不插值，也不把 2025-09→2025-11 當單月；區塊到缺口重新選起點。台灣 CPI 有 548 筆可計算月變動，美國有 546 筆。

VCMM 中點加權、63% 美股權重、波動、十年後銜接與長期 7% 都是工具自己的近似或假設。CPI 與股票衝擊獨立；台幣模式假設 USD/TWD 匯率不變。

維護者更新指令：scripts/update-cpi.ps1 -AsOf YYYY-MM-DD。正式網頁沒有上傳／匯入功能，不讀取過去的 IndexedDB 資料。tests/fixtures.mjs 的合成數字不供產品模擬使用。
