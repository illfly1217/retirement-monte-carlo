// All rates in the engine are fractions, monthly observations are simple returns.
export const VCMM = Object.freeze({
  published: '2026-07-22', asOf: '2026-06-30', horizon: 10,
  us: [0.042, 0.062], exUS: [0.039, 0.059],
  url: 'https://corporate.vanguard.com/content/corporatesite/us/en/corp/vemo/vemo-return-forecasts.html',
});
export function vcmmRate(usWeight = 0.63) {
  return usWeight * (VCMM.us[0] + VCMM.us[1]) / 2 + (1-usWeight) * (VCMM.exUS[0] + VCMM.exUS[1]) / 2;
}
function csvRows(text) {
  const rows=[]; let row=[], field='', quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++) {
    const ch=text[i];
    if(ch==='"') { if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted; }
    else if(ch===','&&!quoted){row.push(field.trim());field='';}
    else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(field.trim());if(row.some(Boolean))rows.push(row);row=[];field='';}
    else field+=ch;
  }
  if(quoted) throw Error('CSV 引號未成對。');
  row.push(field.trim());if(row.some(Boolean))rows.push(row);return rows;
}
export function parseCSV(text, {name='使用者上傳資料', kind='index-net'}={}) {
  const rows=csvRows(text);if(rows.length<3)throw Error('請提供標題列及至少兩個月的資料。');
  const head=rows.shift().map(x=>x.toLowerCase());
  if(new Set(head).size!==head.length)throw Error('欄位名稱重複。');
  const dateCol=head.indexOf('date'), idx=head.indexOf('index'), ret=head.indexOf('return'), cpi=head.indexOf('cpi'), inf=head.indexOf('inflation');
  if(dateCol<0||(idx<0&&ret<0)||(idx>=0&&ret>=0)) throw Error('須包含 date，以及 index 或 return 其中一欄。');
  if(cpi>=0&&inf>=0)throw Error('cpi 與 inflation 請擇一。');
  const months=[], values=[], prices=[], warnings=[];
  let previousMonth=null;
  function numeric(raw,label,line) {if(raw===undefined||raw==='')throw Error(`第 ${line} 列 ${label} 空白。`);const n=Number(raw);if(!Number.isFinite(n))throw Error(`第 ${line} 列 ${label} 須是有限數字（不含 % 符號）。`);return n;}
  rows.forEach((r,i)=>{
    if(r.length!==head.length)throw Error(`第 ${i+2} 列欄位數不符。`);
    const date=r[dateCol];if(!/^\d{4}-\d{2}(-\d{2})?$/.test(date))throw Error(`第 ${i+2} 列日期須為 YYYY-MM 或 YYYY-MM-DD。`);
    const yr=+date.slice(0,4),mo=+date.slice(5,7);if(mo<1||mo>12||yr<1900||yr>2100)throw Error('日期超出可接受範圍。');
    if(date.length===10){const day=+date.slice(8,10),max=new Date(Date.UTC(yr,mo,0)).getUTCDate();if(day<1||day>max)throw Error('日期的日數無效。');}
    const serial=yr*12+mo-1;if(previousMonth!==null&&serial!==previousMonth+1)throw Error(`第 ${i+2} 列月份須連續遞增，不得缺月或重複。`);previousMonth=serial;
    months.push(date.slice(0,7));const v=numeric(r[idx>=0?idx:ret],idx>=0?'index':'return',i+2);
    if(idx>=0?v<=0:v<=-1)throw Error('指數須大於 0，月報酬須大於 -1。');
    if(ret>=0&&Math.abs(v)>0.8)warnings.push(`${date} 月報酬超過 80%，請確認使用小數（5% = 0.05）。`);
    values.push(v);
    if(cpi>=0||inf>=0){const p=numeric(r[cpi>=0?cpi:inf],cpi>=0?'cpi':'inflation',i+2);if(cpi>=0?p<=0:p<=-1)throw Error('CPI 須大於 0，月通膨須大於 -1。');prices.push(p);}
  });
  const returns=[],inflation=[],dates=[];
  // Index levels and CPI levels both require a preceding observation.
  const start=idx>=0||cpi>=0?1:0;
  for(let i=start;i<values.length;i++){
    returns.push(idx>=0?values[i]/values[i-1]-1:values[i]);dates.push(months[i]);
    if(prices.length)inflation.push(cpi>=0?prices[i]/prices[i-1]-1:prices[i]);
  }
  if(returns.length<24)throw Error('至少需要 24 個連續月報酬；研究用途建議 20 年以上。');
  if(returns.length<240)warnings.push('樣本少於 20 年，無法充分涵蓋市場循環。');
  return {name,kind,returns,inflation,dates,warnings,stats:statistics(returns)};
}
export function statistics(returns){
  const n=returns.length, logs=returns.map(Math.log1p), mean=logs.reduce((a,b)=>a+b,0)/n;
  const arithmetic=returns.reduce((a,b)=>a+b,0)/n;
  const variance=logs.reduce((a,b)=>a+(b-mean)**2,0)/(n-1);
  const denom=logs.reduce((a,b)=>a+(b-mean)**2,0);
  const autocorrelation=logs.slice(1).reduce((a,b,i)=>a+(b-mean)*(logs[i]-mean),0)/denom;
  return {months:n,cagr:Math.expm1(12*mean),arithmeticAnnual:12*arithmetic,logMeanAnnual:12*mean,logVol:Math.sqrt(12*variance),autocorrelation:denom?autocorrelation:0};
}
export const CSV_TEMPLATE='date,index,cpi\n1994-05,,\n1994-06,,\n';
