# 原始來源清單與資料狀態

查核日期：2026-10-17。所有預測為版本化靜態資料，不在使用者打開頁面時默默更新。

| 來源 | 本版使用與限制 |
|---|---|
| [MSCI ACWI IMI index](https://www.msci.com/indexes/index/664204/msci-acwi-imi-index) | 指數身份；沒有內建月序列 |
| [MSCI factsheet](https://www.msci.com/documents/10199/255599/msci-acwi-imi.pdf) | 歷史始於1994-05-31，指數推出2007-06-05，此前為回溯計算。該PDF目前Gross，不能冒充Net |
| [MSCI data search](https://app2.msci.com/products/index-data-search/) | 可選貨幣與price/total/net；額外歷史資料需洽MSCI |
| [MSCI Index Terms](https://www.msci.com/legal/index-terms) | 未取得再散布完整數列權利，不把公開可見等同授權 |
| [MSCI calculation methodology](https://app2.msci.com/eqb/methodology/meth_docs/MSCI_IndexCalcMethodology_Aug2023.pdf) | Net/Gross及股息處理的官方定義；不從簡易摘要補造月資料 |
| [VT Vanguard官方](https://advisors.vanguard.com/investments/products/new/vt/vanguard-total-world-stock-etf) | 年費0.06%，產品頁截至2026-02-27；實際基準FTSE Global All Cap而非MSCI |
| [VCMM美國官方](https://corporate.vanguard.com/content/corporatesite/us/en/corp/vemo/vemo-return-forecasts.html) | 2026-07-22發布，2026-06-30模型；10年與30年展望，名目USD幾何報酬、未扣稅費通膨 |
| [VCMM Mexico官方表](https://www.vanguardmexico.com/en/home/insights/economic-market-outlook/vanguard-capital-markets-model-forecasts-2026) | 2026-07-23地區頁，10年美股4.2–6.2%、全球除美3.9–5.9%；本版只作全球近似漂移錨點 |
| [Guyton & Klinger 2006原文](https://www.financialplanningassociation.org/sites/default/files/2021-11/2006%20-%20Guyton%20and%20Klinger%20-%20Decision%20Rules%20and%20SWR%20(1).PDF) | 通膨決策與±20%護欄／10%調整、最後15年。全股票改編不宣稱原論文成功率 |
| [Vanguard Dynamic Spending](https://www.vanguardinvestor.co.uk/articles/latest-thoughts/retirement/how-to-make-your-pension-last-and-your-retirement-enjoyable) | 目標資產比例，限制於上年通膨調整支出−2.5%至+5% |
| [Politis & Romano Stationary Bootstrap原始報告](https://statistics.stanford.edu/technical-reports/stationary-bootstrap) | 幾何區塊與隨機起點；[JASA DOI](https://doi.org/10.1080/01621459.1994.10476870) |
| [BLS CPI series identifiers](https://www.bls.gov/cpi/factsheets/cpi-series-ids.htm) | 建議CUUR0000SA0：CPI-U全項目美國城市平均未季調。沒有假裝內建歷史CPI |
| [BLS copyright](https://www.bls.gov/opub/copyright-information.htm) | BLS數據通常public domain；資料仍需註明來源 |

網站明確區分歷史序列、文獻規則、官方預測數值及本工具自己的研究假設。VCMM全球權重、區間中點組合、波動率、10年後銜接、長期7%均非官方ACWI IMI預測。指數Net報酬及美國ETF分配稅亦不混用。

未內建或下載任何受限MSCI月觀察值。單元測試內的規律／常數序列僅是可手算的**測試fixtures**，未供產品模擬使用。
