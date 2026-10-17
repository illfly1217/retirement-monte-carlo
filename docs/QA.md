# QA 紀錄（2026-10-17）

## 結論

本機可試用；完整 Git 歷史與原始碼已保存至公開 GitHub。**已依使用者進一步要求公開於 [GitHub Pages](https://njames741.github.io/retirement-monte-carlo/)**。既有 Sites 本次未操作。

## 自動化驗證

- `npm test`：**32/32 通過**（31 項引擎／CSV 測試、1 項正式 production Worker 協議整合測試）。
- `npm run check`：正式模組、scripts、tests、Playwright config 全部語法通過。
- GitHub Actions：[最終程式驗證 c9c7bc5](https://github.com/njames741/retirement-monte-carlo/actions/runs/39023767914) 成功；前一輪 [1bd69d7](https://github.com/njames741/retirement-monte-carlo/actions/runs/39023444897) 也成功。
- 真正 Chromium 瀏覽器回歸：**9 passed、1 skipped**。桌面 5 項、手機尺寸 4 項；手機 100k 測試刻意跳過，viewport 模擬無法證明實體手機記憶體足夠。測試 artifacts 含 screenshot／失敗時 trace。
- Node Worker shim 測試與 Chromium 回歸分開記錄；未混用成瀏覽器成績。

文件與畫面 commit `0f6e959` 的重跑曾在 100k 測試遇到預設 5 秒 assertion timeout，當時實際 Worker 已進到 85% 百分位計算，沒有產品錯誤。此完成等待已改為 45 秒；這不是 5 秒效能承諾，也沒有用 retry 隱藏失敗。其餘 8 個瀏覽器測試當輪通過。最新版本以 [Checks 工作流程的終態](https://github.com/njames741/retirement-monte-carlo/actions/workflows/ci.yml) 為準。

研究測試包含種子、年初提領、實付上限、零提領、最後一年耗盡、CPI 購買力、對數／幾何／算術期望、費用只扣一次與 ETF NAV 例外、Stationary 幾何區塊及循環、IID、CPI 同索引、混合欄位月份對齊、GK 嚴格門檻及最後 15 年、動態上下限、分位及 Wilson、可手算網格、VCMM 銜接、CSV 單位／日期／缺月等。

新增 GK 非單調案例存在 6 處成功率局部回升；搜尋仍逐點掃完 150 點，與獨立逐點 oracle 一致。數值溢位測試先重現直方圖 TypeError，再確認現在回明確的數值範圍錯誤。快取命中也測非法策略拒絕。

## 實際瀏覽器操作

環境：Windows x64、Codex in-app browser、Chromium/Chrome 155.0.0.0、Intel i7-12700KF、回報 20 logical processors；桌面 viewport 1280×720。未設定 CPU throttling。手機為同瀏覽器 390×844 viewport，另有 CI Pixel 7 emulation；沒有實體手機測時或 Safari／Firefox 驗證。

| 功能 | 實測結果 |
|---|---|
| 預設 50 年、4%、10k | 可由預設表單直接執行；耗盡 4,304/10,000，與 Node 一致 |
| 四策略 | fixed、percent、GK、dynamic 各自跑完；固定比例 0% 耗盡仍只有約 21.9% 雙重成功，指標有區分 |
| 100k、取消、重跑 | 開始後可停止；保留舊結果、新建 Worker 重跑完成，耗盡 42,950/100,000，與 Node 一致 |
| 報酬／通膨 | 自訂參數、歷史 Stationary／IID、自訂歷史漂移及 VCMM；固定、獨立隨機、歷史同步 CPI 均跑完 |
| 圖表 | hover 年值、點擊釘選離開仍顯示、方向鍵、Escape、年度滑桿、顯示期間、對數、P1/P99、最好／最差；直方圖與耗盡年 tooltip 可用 |
| CSV 格式 | 缺月拒絕，合法合成資料讀入；資料明標 SYNTHETIC QA ONLY，不當市場觀察值 |
| 保存與清除 | 重新載入後 IndexedDB 資料仍在；清除後再載入確定移除；參數及生活費成功底線亦保存 |
| 換 CSV | 先含 CPI、再換無 CPI，正確改回固定通膨；合法換檔會清除舊校驗錯誤 |
| 下載 | 空白 CSV 模板、年度 CSV、研究 JSON 均實際下載；年度 CSV 52 列（含 header、年0–50）、15 欄、無 NaN/Infinity；JSON 有真實結果、設定及環境、無原始 returns/dates |
| 比較 | 四策略共用市場；無資料時 2 種報酬情境，有資料時 3 種情境 |
| 搜尋 | 完整 150 點，預設條件最高通過網格 1.5%；非連續最優或未來保證 |
| 響應式 | 桌面及 390px 手機無橫向頁面溢出；手機抽屜可開、執行後關閉、可重跑與切頁籤 |
| 子路徑 | 在 /retirement-monte-carlo/ 真正操作；CI 額外檢查 app/data/engine/charts/style/worker 相對資源；沒有依賴根路徑 |
| Console | 本機完成操作後無 error／warn |

## 本次修正

1. 初始資產 `min=1, step=10000` 使預設 1,000,000 不合法，瀏覽器擋住 submit；改成整數 step，並保留表單提交回歸。
2. 改參數時保留舊結果的原始金額與年數標籤，避免新標籤混舊數字；狀態提示需重跑。
3. 縮短顯示年數會同步限制滑桿及年度標籤；輸入立即重畫。
4. 成功條件設定亦保存；修正換 CSV 後殘留 CPI 模式及舊錯誤。
5. Worker 快取命中仍驗證；快取計時不再冒稱重新生成市場。
6. CSV 水準比值及跨年累積非有限值明確拒絕；期末平均採先除後加，降低總和溢位。
7. 移除外部字型請求，網站只使用系統字型及本機模組；更新非條件式「年初必定較保守」等方法文字。

## 實際效能

下列為本機實測，不是通用速度保證。完整 JSON 見 [browser](benchmark-browser.json) 與 [Node](benchmark-node.json)。兩次完整模擬皆從新市場開始（marketCached=false）；時間由 Worker 自身 performance.now 計量，包含市場生成及完整摘要，排除畫面繪製、下載、工具往返時間。

| 執行環境／操作 | 時間 |
|---|---:|
| 瀏覽器 50 年 × 10k 完整模擬 | **0.530 秒**（市場 0.383 秒） |
| 瀏覽器 50 年 × 100k 完整模擬 | **7.261 秒**（市場 5.814 秒） |
| 瀏覽器 10k × 150 點搜尋，包含重新生成市場 | **約 1.68 秒**（介面精度 0.01 秒） |
| Node 24.20.0、10k 完整模擬 | 0.290 秒 |
| Node 24.20.0、100k 完整模擬 | 2.909 秒 |
| Node 10k × 150 點搜尋，市場已備妥 | 1.227 秒 |

相同預設及 seed=741，兩環境的耗盡數及生活費成功率一致。先前 100k 瀏覽器量測為 5.269 秒；當時尚未加最後數值邊界檢查，且單次速度受 host 負載與 JIT 影響，不將差異全歸因於程式。保留原記錄，不取較快的一次冒充最終版本。

## 環境與發布限制

- 沙箱內 listener 雖顯示啟動，fetch 回 EACCES／逾時、瀏覽器無法連到；沙箱外相同 server 在 127.0.0.1 成功。GitHub CLI 憑證也需沙箱外讀 keyring，原登入仍有效。
- 本次 CSV「upload」是工具對本機選檔的名稱；產品使用 File API、IndexedDB，沒有 POST／上傳 API，也沒有將測試資料傳往網際網路。
- 前階段 Pages API 回 404；本次依使用者要求啟用 build_type=workflow，[發布 run](https://github.com/njames741/retirement-monte-carlo/actions/runs/39024556102) 成功。真正公開網址的 10k 模擬、P1/P99、對數、年度滑桿、CSV 下載均通過，console 無 error／warn；後續仍手動發布。
- 未取得 MSCI 完整可重分發月資料。無債券、多資產、台灣 CPI、TWD、個人稅、快照匯入；Vanguard 參考引用方式仍需公開前確認（見 THIRD_PARTY_NOTICES）。
- 未驗證實體手機 100k 記憶體峰值及跨瀏覽器；可選單檔 HTML 也沒有另做瀏覽器驗證。主要可用產品為模組化 dist/。

## 畫面證據

[桌面完整畫面](screenshots/desktop.png) · [桌面預覽](screenshots/desktop-preview.png) · [手機完整畫面](screenshots/mobile.png)

## 首次公開發布後驗證

- 日期：2026-10-17；部署 commit `ced5918`，verify／deploy 均成功。
- 公開網址：https://njames741.github.io/retirement-monte-carlo/
- 50 年 × 10k，seed 741，瀏覽器約 0.52 秒；耗盡 43.0%、雙重成功 57.0%。這是另外一次公開頁面 smoke test，未取代前述完整效能紀錄。
- module Worker、互動圖表與 CSV 下載正常；沒有重新匯入或上傳任何歷史 CSV。
- [公開頁面畫面](screenshots/github-pages.png)。
