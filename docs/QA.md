# 已執行驗證與限制（2026-10-17）

## 通過

- `npm test`：24/24，含引擎測試23項、實際production Worker訊息協議整合測試1項。
- 測試涵蓋種子再現、年初提領、通膨購買力、短付／耗盡、固定比例生活費下降、費用只扣一次、ETF-NAV成本例外、參數模型對數均值與波動、stationary重啟和循環索引、CPI共同抽樣、GK嚴格門檻與最後15年、動態上下限、Wilson、分位排序、可手算提領率網格、VCMM銜接、CSV日期／缺月／空值／百分號等。
- Worker測試使用Node worker_threads shim，載入正式`dist/worker.js`，測run、策略比較共用市場、情境比較、150點搜尋與歷史缺資料錯誤。**這不是瀏覽器實測。**
- `npm run check`：全部JS模組語法通過。
- 單檔生成器執行成功；合併的主模組與Blob Worker模組各經`node --check`通過。
- Node實測50年10k／100k及10k網格搜尋，機型、runtime、種子、時間與結果見`benchmark-node.json`。不能將這些時間宣稱成瀏覽器成績。

## 未完成：瀏覽器QA及部署

- 本機dev server回報啟動`http://127.0.0.1:4173`。
- 同一命令環境發出fetch時回`EACCES`；PowerShell亦回通訊端存取被拒。
- in-app browser連該localhost回`ERR_CONNECTION_TIMED_OUT`。
- `open_in_codex`回工具錯誤，沒有成功開啟預覽。
- 因此桌面／手機畫面、圖表游標與滑桿、file input、下載、IndexedDB、Worker在瀏覽器中的執行及效能尚未實機驗證；不能宣稱通過。
- Sites建立成功且保持owner-private，但source helper遠端Git操作回`getaddrinfo() thread failed to start`。尚未push、save_version、deploy，沒有可交付已運作的Site URL。
- 沒有請求變更公開受眾、生成Sign-in bypass token、停用防火牆或降低網站存取控制。

## 開通環境後的必要QA

1. 用10k預設跑完；與benchmark相同seed比對失敗機率、median、spending結果。
2. 切換四策略與VCMM，試10k/100k；記錄瀏覽器及實際耗時。
3. 用標示為測試fixture的可手算CSV驗證匯入、CPI對齊與歷史區塊；不把fixture稱為市場歷史或放進產品預設。
4. 檢查年度hover、鍵盤、P1/P99、log、最好最差、顯示年數、滑桿、CSV/JSON下載、手機響應式。
5. 停止100k運算後可重新執行；重載保留CSV與參數；清除只影響本機月資料。
6. 同一Site完成private部署，檢查終態succeeded與回傳URL，再交付使用者測試。仍不公開。
