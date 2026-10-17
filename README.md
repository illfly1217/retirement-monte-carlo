# 全球 ETF 退休研究室

可維護的瀏覽器退休蒙地卡羅應用。繁體中文，USD，100% 全球股票，預設 50 年／4%／10,000 次。不是投資建議或未來保證。

## 開始

需要 Node.js 22 以上，不需要 npm install，無 runtime 套件依賴。

```sh
npm test
npm run check
npm run dev
# http://127.0.0.1:4173
npm run benchmark -- --swr
```

模組化版本必須透過 HTTP(S) 開啟；直接 double-click dist/index.html 不支援相對路徑 module Worker。另有由同一原始碼生成的`retirement-lab.html`單檔版，以Blob Worker運算，供下載後直接在現代瀏覽器開啟（介面實測尚受環境阻擋）。可重建：`node scripts/standalone.mjs`。它不是獨立維護的另一套引擎。

## 使用流程

1. 沒有歷史資料時，使用明確標示的自訂對數常態模型（預設 CAGR 7%、對數波動18%、固定通膨2.5%，全部是研究假設）。
2. 設定初始資產、年數、初始提領率、策略、費用與路徑數，按「執行模擬」。
3. 查看資產耗盡、生活費雙重成功、逐年 P1/5/25/50/75/95/99、期末分布與耗盡年。圖表支援游標、點擊釘選、鍵盤方向鍵、對數刻度、時間範圍與年度滑桿。
4. 「策略與情境」讓四策略共用市場路徑；另可比較歷史、自訂與 VCMM 參考情境。
5. 「提領率探索」選成功定義與生活費底線，以共同路徑掃描 0.1%–15.0%，精度0.1個百分點；不是連續最優解。
6. 匯出年度實質資產／支出百分位 CSV、或 JSON 研究快照。JSON 不含原始月歷史數據。快照匯入及圖表疊加目前未實作。

## MSCI 資料狀態：沒有內建序列

截至2026-10-17，未取得可合法重分發的 MSCI ACWI IMI USD Net Total Return 1994年至今月資料。因此**沒有虛構、插值、從年度數值拆月、偷偷換成 VT／ACWI ETF 或其他代理**。MSCI 歷史模式實作完成，必須自行上傳合法取得的數列才能使用。上傳僅在瀏覽器本機處理與 IndexedDB 保存，不傳送伺服器。

取得方式：向 MSCI Client Service／授權資料商申請相符指數、USD、Net Total Return、monthly month-end、從1994-05起的資料與允許用途。官方查詢介面可能提供部分數列，但可下載不等於可重分發。Fact sheet 的年度摘要不足以代替月資料；標示 Gross 的 PDF 不能當 Net。公開版仍需另行確認 MSCI、Vanguard 等資料的使用和呈現授權。本版維持 owner-private。

### CSV

標題列擇一：

```csv
date,index,cpi
```

```csv
date,return,inflation
```

`date`: YYYY-MM 或有效 YYYY-MM-DD。每月一筆連續遞增，無重複／空值。`index` 與 `cpi` 為正水準；`return` 與 `inflation` 為小數月變動率（5% = 0.05，不接受百分號），必須大於−1。CPI 可省略；至少24個月**報酬**，建議20年以上。水準資料會消耗第一筆來計算下一月報酬。可混合 return+cpi 或 index+inflation，但都會對齊可計算的月份。

資料名稱與成本基礎由使用者指定。工具驗證格式，無法認證指數身份、貨幣、資料真實性或權利。指數Net總報酬另扣基金費用；ETF NAV總報酬不重扣費用與額外tracking drag。所有市場資料避免進版控。

## 架構

| 檔案 | 責任 |
|---|---|
| `dist/engine.js` | 純計算：市場路徑、提領、百分位、Wilson區間、提領率搜尋 |
| `dist/data.js` | CSV解析與校驗、統計、附日期來源的VCMM常數 |
| `dist/worker.js` | Web Worker訊息協議、單一市場路徑快取、比較 |
| `dist/charts.js` | 無第三方圖表依賴的互動SVG |
| `dist/app.js` | 參數、儀表板、IndexedDB、匯出與取消 |
| `dist/index.html`, `dist/style.css` | 語意化繁體中文介面與響應式版面 |
| `tests/engine.test.mjs` | 演算法、時間點、邊界與CSV自動化測試 |
| `scripts/benchmark.mjs` | 真實10k／100k運算測速，可重現 |
| `.openai/hosting.json` | 固定的Sites identity與靜態輸出目錄 |

`dist` 即可直接部署的原始碼，無編譯轉換，測試和瀏覽器使用同一個引擎。外部字型僅為視覺增強，載入失敗使用系統字型。無資料API、金鑰、後端或運算費；Sites hosting 本身依平台限制。

所有金額與複合運算使用Float64。市場路徑矩陣約 80MB（100k×50年，報酬＋通膨），完整分析再暫用約81MB的資產＋支出矩陣，以及排序暫存；實際瀏覽器峰值更高。Worker完成後僅回傳摘要與最好／最差樣本，保留市場快取。取消會 terminate Worker 並釋放快取。低記憶體手機建議10k或1k。

## 方法與限制

詳見 [docs/METHODOLOGY.md](docs/METHODOLOGY.md)、[docs/SOURCES.md](docs/SOURCES.md)、[docs/DECISIONS.md](docs/DECISIONS.md) 與 [docs/RELEASE.md](docs/RELEASE.md)。

- 年初提領，餘額再獲當年12個月複合報酬。年度而非月度提領。
- Stationary Bootstrap / IID月抽樣 / IID對數常態參數模型。區塊預設24月是研究選擇，可調整。
- CAGR、算術報酬、對數報酬分開。自訂CAGR平移月對數均值，不直接平移簡單報酬。
- GK是100%股票的護欄改編；未複製原文股債現金賣出規則與成功率。
- VCMM是10年公開幾何報酬錨點的全球近似，第11年後銜接使用者長期假設，非VCMM引擎或官方50年預測。
- 固定比例不歸零不代表支出足夠；預設搜尋要求各年生活費不低於初始80%。
- 尚無債券、多資產相關性／再平衡、台灣CPI、TWD匯率、個人稅、股息分配預扣稅與交易成本。
- Bootstrap無法創造樣本未出現的危機；參數模型沒有肥尾或波動叢聚。多跑路徑只減少條件抽樣誤差。

## GitHub 狀態與繼續維護

GitHub connector已確認登入njames741；目前未提供建立repo操作，讀取`njames741/retirement-monte-carlo`回404，本機`gh auth status`顯示token無效。因此第一版**沒有聲稱已建立GitHub repo**。Sites的來源Git與使用者GitHub不同，兩者沒有自動同步。

本次Sites已建立owner-private項目，identity在hosting manifest，但來源推送受限於命令環境：`git ls-remote`回`getaddrinfo() thread failed to start`，尚未成功推送、保存版本或部署。**不能將expected_url當成已上線網址。** 完整專案目前以本機Git及交付專案包保存，待允許網路後繼續同一Site。詳見`docs/HANDOFF.md`。

在有有效GitHub CLI憑證的Codex／本機環境，從本專案執行：

```sh
gh auth login --hostname github.com
gh repo create njames741/retirement-monte-carlo --private --description "全球 ETF 退休蒙地卡羅研究室"
git remote add github https://github.com/njames741/retirement-monte-carlo.git
git push -u github HEAD:main
```

若repo已存在，略過create；若github remote已存在，以`git remote set-url github ...`更新。保留Sites來源remote，不覆寫其origin。先確認`git status`與要推送的分支；勿把`local-data/`或使用者CSV加到Git。

首次來源推送成功後，未來在Work選取同一Site即可從Sites來源儲存取回；首次GitHub建立推送成功後，Codex可clone該私有repo。每次發布前先合併兩邊變更並通過測試，再將完全相同的commit保存到Sites及GitHub，記錄發布版本對應SHA；詳細流程見RELEASE.md。這些是待完成的保存流程，不是已確認的同步狀態。

## 擴充方向

多資產版本應新增資產schema與各月同步抽樣向量，保留跨資產及CPI關聯，再於引擎注入配置／再平衡策略。稅與外幣應新增現金流及numeraire模組，不在圖表端硬扣。資料更新需更新來源、截至日期、授權及基準測試；避免網頁默默讀取日後更動的外部預測。
