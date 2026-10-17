// Generated summary only. No original monthly observations. See usageReview before publication.
export const EQUITY_PARAMETERS = Object.freeze({
  "status": "ready",
  "name": "MSCI ACWI IMI",
  "version": "2026-10-17/d20cecd373a8",
  "parameters": {
    "cagr": 0.07891454252891024,
    "logVol": 0.15969267734557555
  },
  "sample": {
    "from": "1997-02",
    "to": "2026-09",
    "months": 356,
    "currency": "USD",
    "returnBasis": "Net",
    "dividends": "reinvested",
    "backtestBefore": "2007-06-05"
  },
  "source": "https://app2.msci.com/products/index-data-search/regional_chart.jsp?asOf=16/Oct/2026&size=IMI%20(Large%2BMid%2BSmall%20Cap)&scope=R&style=None&currency=USD&priceLevel=NETR&indexId=664204&indexName=ACWI%20IMI&suite=C",
  "retrieved": "2026-10-17",
  "provenance": {
    "indexCode": "664204",
    "sourceSha256": "ce55521175281418d1c53907f7919c358f42c07666e7176977850ab61b255dc4",
    "inputSha256": "d20cecd373a84e04b6edc301e58b23b0b240f57c9b5860a626cae0fcc04cba57"
  },
  "method": {
    "version": "monthly-log-sample-v1",
    "cagr": "expm1(12 * mean(log1p(r)))",
    "logVol": "sqrt(12) * sample_sd(log1p(r)), n-1",
    "annualization": "12 months; no serial-correlation adjustment"
  },
  "diagnostics": {
    "arithmeticAnnual": 0.08882607098988218,
    "logMeanAnnual": 0.07595548251750744,
    "lag1": 0.07556676496978994
  },
  "usageReview": {
    "rawRedistributionPermission": "not-established",
    "publicDerivedParametersPermission": "not-established",
    "termsUrls": [
      "https://www.msci.com/legal/index-terms",
      "https://www.msci.com/legal/notice-and-disclaimer"
    ],
    "note": "This record documents the review; it does not grant a license. Raw observations are excluded."
  }
});
