# v1.2 使用者回饋修正

依使用者要求先建立 issues，再依序實作：

1. [#1 字級與排版](https://github.com/njames741/retirement-monte-carlo/issues/1)：提高說明、控制、指標、表格與圖表字級，調整欄寬及手機操作，新增手機參數面板內的關閉按鈕。
2. [#2 策略設定](https://github.com/njames741/retirement-monte-carlo/issues/2)：固定策略隱藏及停用細節，GK／動態策略僅自動展開自己的欄位；離開策略時無效的隱藏參數還原預設，避免阻擋其他策略或策略比較。
3. [#3 幣種](https://github.com/njames741/retirement-monte-carlo/issues/3)：新使用者預設 TWD／3,000 萬／2% 通膨；USD／100 萬／2.5%。支援切換、保存、重設、舊設定遷移，結果、圖表及匯出保留各自幣種。明示固定匯率假設。
4. [#4 專案資料](https://github.com/njames741/retirement-monte-carlo/issues/4)：移除所有上傳／匯入操作與 IndexedDB 讀取，隨專案保存兩地官方 CPI；VCMM 常數保持具日期的內建參考。CPI 支援獨立區塊抽樣，排除缺月跨月變動。**完整 MSCI 月序列仍缺可發布資料，issue 保留追蹤，不宣稱已完成這部分。**

沒有下載替代股票指數、虛構月序列或把年度報酬拆成月報酬。股票參數模型可直接使用，未備妥的歷史股票抽樣選項停用。
