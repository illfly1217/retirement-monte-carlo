# 全球 ETF 退休研究室

繁體中文的瀏覽器退休蒙地卡羅工具。預設 USD 購買力、100% 全球股票、50 年、4% 初始提領率、10,000 路徑。結果條件於資料、模型與參數，不是預測、保證或個人投資建議。

## 本機試用

需要 Node.js 22 以上。產品本身沒有 runtime 套件、API 金鑰或運算伺服器；直接啟動不需 npm install。

```sh
npm run dev
# 開啟 http://127.0.0.1:4173/
```

保持終端機開著；Ctrl+C 停止。ES Modules 與 module Worker 必須透過 HTTP(S)，不要直接雙擊 dist/index.html。

```sh
npm test
npm run check
npm run benchmark -- --swr
# 安裝開發用瀏覽器測試依賴：
npm ci
npx playwright install chromium
npm run test:browser
```

在本次 Codex 沙箱內啟動的 listener 無法由瀏覽器連到；相同程式在沙箱外啟動即可使用。這是本次執行權限差異，不需要變更防火牆或對外開放。

## 使用流程

1. 缺歷史資料時可用自訂或 VCMM 參考情境。自訂 CAGR 7%、年化對數波動 18%、通膨 2.5% 都是研究假設。
2. 設定資產、期間、初始提領率與策略，執行模擬。四策略為固定實質、固定比例、Guyton–Klinger 全股票護欄改編及動態上下限。
3. 同時查看資產耗盡與生活費風險。固定比例幾乎不歸零，仍可能無法支付生活費。
4. 圖表支援游標、點擊釘選、左右鍵、年度滑桿、對數刻度、P1/P99 及期末最好／最差樣本。
5. 比較四策略、比較報酬情境，或以共同路徑掃描 0.1%–15% 提領率，步距 0.1 個百分點。預設成功要求未耗盡且各年生活費至少為初始 80%。
6. 匯出年度實質 USD 百分位 CSV 或 JSON 研究快照。快照含設定、結果、運算時間、瀏覽器環境；不含原始月序列。快照匯入與疊圖尚未實作。

100,000 路徑已在桌面瀏覽器驗證。50 年市場矩陣約 80MB，完整分析另暫用約 81MB 資產／支出矩陣及排序空間；實際峰值更高。低記憶體手機建議 1,000 或 10,000 路徑。停止會終止 Worker，保留上次結果，再次執行會新建 Worker。

## 歷史資料與 CSV

沒有內建可合法重分發的 MSCI ACWI IMI USD Net Total Return 完整歷史月序列。未虛構、插值、拆分年度報酬或換成其他指數／ETF。歷史模式須自行匯入合法取得的 CSV；缺資料會明示並拒絕執行。

```csv
date,index,cpi
```

或

```csv
date,return,inflation
```

每月一筆、連續遞增，date 為 YYYY-MM 或有效 YYYY-MM-DD。月報酬與通膨使用小數（5% = 0.05），須大於 −1；指數與 CPI 水準須為正。CPI 可省略；可混合 return+cpi 或 index+inflation。水準需要前一個月，因此任一欄用水準時會消耗首列，兩者對齊同一月份。至少 24 個月可計算報酬，建議 20 年以上。

資料只由瀏覽器 File API 讀取，保存在該來源的 IndexedDB；沒有 CSV 上傳 API。工具不認證資料身份、USD、Net 定義或使用權。指數 Net 總報酬另扣基金費用；ETF NAV 淨總報酬抽樣不重扣費用或追蹤拖累。純參數模型的 CAGR 始終視為基金成本前。

不要將使用者 CSV 放進 dist 或 Git。local-data/ 已忽略；tests/fixtures.mjs 只有明確標示的合成測試數字，產品不使用它們。

## GitHub 與發布

主要開發及版本控制為 **Codex＋[公開 GitHub Repository](https://github.com/njames741/retirement-monte-carlo)**；網站目標為 GitHub Pages。原 bundle 歷史已恢復並保留。

- `.github/workflows/ci.yml`：push main、PR 自動跑語法、32 項 Node／Worker 測試及桌面／手機 Chromium 回歸。
- `.github/workflows/pages.yml`：只允許手動 workflow_dispatch；main 分支且選擇 publish 才能部署。重新測試後只封裝 dist/。
- **目前網站尚未發布，須先由擁有者本機試用確認。** Pages 未啟用，推送原始碼只會跑測試。
- 既有 Sites 維持原私人狀態，本次未修改受眾或部署；`.openai/hosting.json` 僅保留舊 identity，不再作主要發布流程。

子路徑預覽（PowerShell）：

```powershell
$env:PORT='4175'
$env:BASE_PATH='/retirement-monte-carlo/'
npm run dev
# http://127.0.0.1:4175/retirement-monte-carlo/
```

新終端機的預設仍是 4173 根路徑。預期公開網址只有在實際部署成功後才能當作已上線；詳細操作及授權檢查見 [RELEASE](docs/RELEASE.md)。

## 架構與研究規格

| 檔案 | 責任 |
|---|---|
| dist/engine.js | 純計算、市場生成、提領、百分位、Wilson、網格搜尋 |
| dist/data.js | CSV 校驗、統計、具日期的 VCMM 常數 |
| dist/worker.js | Worker 協議、驗證與單一市場矩陣快取 |
| dist/charts.js | 互動 SVG，沒有第三方圖表 runtime |
| dist/app.js | 介面、設定、IndexedDB、匯出、取消 |
| dist/index.html、style.css | 語意化繁中頁面、系統字型、響應式版面 |
| tests/ | 引擎、正式 Worker 整合、合成 fixtures、瀏覽器回歸 |
| scripts/ | 預覽、Node 測速、可選單檔產生器 |

`dist/` 就是正式模組化原始碼，無需編譯。可選 `node scripts/standalone.mjs` 產生單檔研究版；不另行維護或作 Pages 輸出。

詳見 [方法](docs/METHODOLOGY.md)、[來源](docs/SOURCES.md)、[決策](docs/DECISIONS.md)、[QA 與實測](docs/QA.md)、[接續工作](docs/HANDOFF.md)。

尚無債券、多資產相關性／再平衡、台灣 CPI、TWD 匯率、個人稅、ETF 分配預扣及交易成本。未來應在市場向量與現金流模組擴充，保留同步月份；不在圖表端另建計算。未指定開源授權；公開 Repository 不代表第三方資料獲授權。
