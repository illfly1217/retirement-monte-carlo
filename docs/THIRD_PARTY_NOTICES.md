# 第三方來源與資料說明

盤點日期 2026-10-17，版本 1.3。本工具不是 MSCI、Vanguard、BLS 或主計總處官方產品。

| 內容 | 來源與使用範圍 |
|---|---|
| HTML、CSS、JS、方法說明 | 本專案原創；使用者已授權保存至公開 GitHub，尚未指定開源授權 |
| 台灣 CPI | 主計總處總指數，1981-01–2026-09。依[政府資料開放授權第 1 版](https://data.gov.tw/license)，保留提供機關及[原始來源](https://data.gov.tw/dataset/6019)；格式轉換與月變動計算由本工具完成，不暗示官方認可 |
| 美國 CPI | U.S. Bureau of Labor Statistics CPI-U 全項目、城市平均、未季調 CUUR0000SA0，經 [FRED CPIAUCNS](https://fred.stlouisfed.org/series/CPIAUCNS) 取得。[BLS public domain 使用說明](https://www.bls.gov/opub/copyright-information.htm)，保留來源，不使用 logo |
| MSCI 月資料與參數摘要 | 官方 ACWI IMI USD Net、1997-01–2026-09 月末水準已在本地核對；只內建彙總參數及來源，不提供原始月序列。原始資料再散布與彙總用途分別依 [Index Terms](https://www.msci.com/legal/index-terms)／[Notice](https://www.msci.com/legal/notice-and-disclaimer) 記錄，不宣稱已取得 MSCI 個別授權，也不把未確定的條款適用解釋當成計算功能限制；詳見 [研究紀錄](MSCI_PARAMETER_RESEARCH.md) |
| VCMM | 既有少量公開區間數字、日期、改寫摘要與[官方來源](https://corporate.vanguard.com/content/corporatesite/us/en/corp/vemo/vemo-return-forecasts.html)，沒有完整表格、官方圖表或專有引擎 |
| 文獻規則 | 自行實作並改寫方法，連到原文，不複製論文或原研究成功率 |
| 字型、logo、圖片、圖表 runtime | 系統字型、自製 SVG；沒有第三方字型下載、logo 或圖表套件 |
| Playwright | 僅開發依賴，Apache-2.0，不隨網站 runtime 發布 |

CPI 已隨專案保存版本、來源與日期，沒有訪客資料上傳／匯入。2025-10 美國缺值未插補，跨缺月變動不當作單月通膨。測試 fixtures 為合成數字，未供產品使用。

Vanguard 預測具假設性，非實際結果或保證，會隨日期改變。資產預測包含波動、相關性及分布資訊，本工具只用少量區間中點作名目 USD 幾何漂移錨點，沒有重建其模型。官方預測未扣通膨、稅或基金成本；本工具另處理成本及購買力，十年後銜接、全球權重及長期假設均自行設定。[官方數值與方法背景](https://www.vanguardmexico.com/en/home/insights/economic-market-outlook/vanguard-capital-markets-model-forecasts-2026)。本說明不構成第三方個別書面授權書。
