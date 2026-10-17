# 全球 ETF 退休研究室

繁體中文、瀏覽器本機運算的退休蒙地卡羅工具。[GitHub Pages](https://njames741.github.io/retirement-monte-carlo/)。

目前版本 **1.2**：預設台幣 TWD、資產 3,000 萬、通膨假設 2%；切換美元 USD 套用資產 100 萬、通膨 2.5%。兩者皆預設 100% 全球股票、50 年、4% 初始提領率、10,000 路徑、自訂名目幾何報酬 7% 與年化對數波動 18%。這些是可調整的研究情境，不是預測或個人投資建議。

## 本機試用

需要 Node.js 22 以上，直接啟動不需安裝開發依賴：

    npm run dev
    # http://127.0.0.1:4173/

ES Modules 與 module Worker 必須透過 HTTP(S)。預覽只監聽 127.0.0.1。測試：

    npm ci
    npx playwright install chromium
    npm run check
    npm test
    npm run test:browser

瀏覽器測試使用 /retirement-monte-carlo/ 子路徑，覆蓋桌面、手機、Worker、圖表、策略、幣種、資料與下載。Windows 沙箱可能限制 listener、瀏覽器或 GitHub keyring，應於原生主機環境驗證，無需停用防火牆。

## 使用方式

1. 選台幣或美元，設定資產、期間及提領率。資產輸入自動顯示千分位逗號，可輸入或貼上 30000000 或 30,000,000；計算及保存使用相同數值。切換幣種會套用對應資產、通膨及通膨波動預設；不依即時匯率轉換自訂金額。重設保留目前幣種。
2. 選提領策略。固定實質／固定比例沒有額外細節；GK 自動展開護欄，動態支出自動展開上下限。
3. 選自訂報酬或內建 VCMM 參考情境。通膨可用固定假設、獨立隨機通膨，或目前幣種的內建 CPI 獨立區塊抽樣。
4. 執行模擬，同時查看資產耗盡與生活費下降。可比較四策略、兩種報酬情境，或掃描 0.1%–15% 提領率。
5. 匯出含幣種的年度實質百分位 CSV 或 JSON 研究快照。快照保存設定、資料版本、結果及時間，不含原始 CPI 月序列。

台幣模式假設美元兌台幣匯率不變：股票報酬仍採美元假設，購買力使用台灣 CPI／通膨假設。尚未模擬外匯風險、個人稅或債券。舊版美元參數以 USD 遷移；既有匯入歷史模式改為可用的參數模型，不再讀取舊 IndexedDB 資料。

## 專案隨附資料

網頁沒有資料匯入或上傳功能，訪客無須準備檔案；開啟時不呼叫第三方資料服務。

| 資料 | 目前內容 |
|---|---|
| VCMM | 2026-06-30 模型、2026-07-22 發布的參考區間；十年後銜接為工具自己的研究假設，未重建專有引擎 |
| 台灣 CPI | 主計總處總指數，1981-01–2026-09，549 筆月水準 |
| 美國 CPI | BLS CPI-U 全項目未季調，經 FRED CPIAUCNS，1981-01–2026-09，548 筆月水準；2025-10 缺值 |
| MSCI 完整股票月序列 | **尚未取得可發布資料，股票歷史 Bootstrap／IID 暫不開放**；沒有以替代指數或合成資料冒充 |

CPI 擷取日期 2026-10-17。只用相鄰月份計算月通膨，排除跨缺月變動；區塊遇缺口會重新取樣，不插值、不將兩月當一月。CPI 與股票衝擊獨立，未保留兩者相關性。

dist/cpi-data.js 保存原始水準、期間、來源及授權連結。維護者以 scripts/update-cpi.ps1 -AsOf YYYY-MM-DD 明確更新並審查資料，網頁不自動執行。合成測試 fixtures 不供產品使用。完整來源見 [SOURCES](docs/SOURCES.md) 及 [第三方說明](docs/THIRD_PARTY_NOTICES.md)。

## 架構與發布

dist/ 是正式原始碼，無需編譯：engine.js 負責計算，worker.js 負責運算及快取，data.js 負責統計及 VCMM，datasets.js 負責 CPI 對齊，currency.js 負責幣種預設，charts.js 負責 SVG，app.js 負責介面與保存。

GitHub 是唯一主要版本來源；既有 Sites 保持原私人狀態，不另同步。main／PR 自動執行 CI；Pages 仍僅由 main 手動觸發 pages.yml、選 publish，不因推送自動部署。發布狀態見 [RELEASE](docs/RELEASE.md)。

可選 node scripts/standalone.mjs 產生單檔於已忽略的 local-data/standalone/，不作 Pages 正式輸出。

方法見 [METHODOLOGY](docs/METHODOLOGY.md)，測試見 [QA](docs/QA.md)，本批工作見 [v1.2 修正紀錄](docs/REVISION_1_2.md)。較早決策與交接紀錄保留歷史狀態，以此版本說明為準。
