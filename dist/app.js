import{currencyDefaults,CURRENCIES}from './currency.js';
import{DEFAULTS,STRATEGIES,validate}from './engine.js';
import{vcmmRate,VCMM,statistics}from './data.js';
import{datasetForCurrency}from './datasets.js';
import{CPI}from './cpi-data.js';
import{fanChart,barChart,rateChart,money,pct}from './charts.js';
import{amountInput}from './amount-input.js';
const $=id=>document.getElementById(id);
const initialAmount=amountInput($('initial'),$('initialError'));
function setDrawer(open){document.querySelector('.sidebar').classList.toggle('open',open);$('mobileParams').setAttribute('aria-expanded',String(open));}
const fractionFields=new Set(['rate','cagr','vol','fee','drag','inflation','inflationVol','usWeight','longRun','guard','adjust','ceiling','floor','spendingFloor','successTarget']);
const stringFields=new Set(['currency','strategy','returnMode','sampling','inflationModel','successMetric']);
let selectedStrategy=null;
let dataset=null,last=null,swr=null,busy=false,worker=null,job=0,activeJob=null,comparisons=null,assumptions=null;
const descriptions={fixed:'每年維持初始生活費的購買力，支出穩定但可能耗盡資產。',percent:'按當年資產提領固定比例，支出跟著市場變化，生活費可能大幅縮水。',gk:'依護欄加減支出；全股票改編，最後 15 年停用減碼護欄。',dynamic:'以資產比例決定目標支出，限制每年實質調幅，仍可能耗盡資產。'};
function config(){const c={};for(const k of Object.keys(DEFAULTS)){const e=$(k);c[k]=k==='initial'?initialAmount.read():stringFields.has(k)?e.value:Number(e.value)/(fractionFields.has(k)?100:1);}return c;}
function fill(c){for(const[k,v]of Object.entries(c))if($(k)){if(k==='initial')initialAmount.write(v);else $(k).value=fractionFields.has(k)?Number((v*100).toPrecision(12)):v;}sync();}
function sync(){const c=config();
  const label=CURRENCIES[c.currency].label;
  $('initialCurrency').textContent=c.currency;
  $('planCurrency').textContent=c.currency;
  $('purchasingPowerLabel').textContent=label+'購買力基準';
  $('currencyHint').textContent='切換幣種會套用該幣種的資產與通膨預設。'+(c.currency==='TWD'?'股票報酬以美元估計，假設美元兌台幣匯率不變；未模擬匯率風險。':'股票報酬與購買力皆以美元計。');
  $('inflationModel').querySelector('[value="cpi"]').textContent='內建'+label+' CPI 區塊抽樣（獨立）';
  if(dataset?.cpi?.currency!==c.currency){dataset=datasetForCurrency(c.currency);dataSummary();}
  const hasDetails=['gk','dynamic'].includes(c.strategy);
  $('strategyDetails').hidden=!hasDetails;
  if(selectedStrategy!==c.strategy)$('strategyDetails').open=hasDetails;
  selectedStrategy=c.strategy;
  for(const [strategy,group,fields] of [['gk','gkFields',['guard','adjust']],['dynamic','dynamicFields',['ceiling','floor']]]){
    $(group).hidden=c.strategy!==strategy;
    for(const id of fields){
      if(c.strategy!==strategy&&(!Number.isFinite(c[id])||c[id]<Number($(id).min)/100||c[id]>Number($(id).max)/100)){$(id).value=DEFAULTS[id]*100;c[id]=DEFAULTS[id];}
      $(id).disabled=c.strategy!==strategy;
    }
  }
$('customFields').hidden=c.returnMode!=='custom';$('vcmmFields').hidden=c.returnMode!=='vcmm';$('volField').hidden=c.sampling!=='parametric';$('blockField').hidden=c.sampling!=='stationary'&&c.inflationModel!=='cpi';$('inflationVolField').hidden=c.inflationModel!=='lognormal';$('inflation').disabled=['historical','cpi'].includes(c.inflationModel);$('strategyHint').textContent=descriptions[c.strategy];$('vcmmAnchor').textContent=pct(vcmmRate(c.usWeight),3);if(!last){$('terminalNote').textContent='以退休起點的'+label+'購買力計';$('spendingMetric').textContent=Number.isFinite(c.initial)?money(c.initial*c.rate,false,c.currency):'—';$('spendingNote').textContent=Number.isFinite(c.initial)?`每月約 ${money(c.initial*c.rate/12,false,c.currency)} · 稅前`:'請輸入有效的初始資產。';$('horizon').textContent=`${c.years} 年`;}$('parameters').classList.toggle('dirty',!!last);if(last)$('statusText').textContent='參數已更動；圖表保留上次執行結果，請重新模擬。';if(Number.isFinite(c.initial))try{localStorage.setItem('retirement-config-v2',JSON.stringify(c));}catch{}}
function showTab(name){document.querySelectorAll('.tab-panel').forEach(el=>el.hidden=el.id!==name);document.querySelectorAll('[data-tab]').forEach(el=>{el.classList.toggle('active',el.dataset.tab===name);el.setAttribute('aria-selected',el.dataset.tab===name?'true':'false');});if(name==='dashboard')draw();if(name==='safe'&&swr)rateChart($('swrChart'),swr.result.trials,swr.result.target);}
function err(message){$('error').textContent=message;$('error').hidden=false;}
function setBusy(value){busy=value;$('fields').disabled=value;for(const id of ['compareRun','assumptionRun','swrRun','successTarget','successMetric','spendingFloor'])$(id).disabled=value;$('cancel').hidden=!value;$('progress').hidden=!value;$('status').classList.toggle('busy',value);}
function newWorker(){worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});worker.onmessage=({data:m})=>{if(m.id!==activeJob?.id)return;if(m.type==='progress'){$('progress').value=m.value;$('statusText').textContent=`${m.label} · ${pct(m.value,0)}`;return;}if(m.type==='error'){err(m.message);setBusy(false);$('statusText').textContent='運算未完成，請檢查資料與參數。';activeJob=null;return;}const c=activeJob.config;setBusy(false);$('statusText').textContent=`計算完成 · ${(m.elapsed/1000).toFixed(2)} 秒 · ${c.paths.toLocaleString()} 條路徑 · 種子 ${c.seed}`;if(m.action==='run'){last={result:m.result,config:c,elapsed:m.elapsed,timing:{marketMs:m.marketMs,marketCached:m.marketCached},at:new Date().toISOString(),data:{equityHistory:null,vcmm:{published:VCMM.published,asOf:VCMM.asOf},cpi:{used:c.inflationModel==='cpi',name:dataset.cpi.name,currency:c.currency,from:dataset.cpi.dates[0],to:dataset.cpi.dates.at(-1),version:dataset.cpi.version,retrieved:dataset.cpi.retrieved},fxAssumption:'constant'}};$('parameters').classList.remove('dirty');render();}if(m.action==='compare')renderComparison(m.result,c,m.elapsed);if(m.action==='assumptions')renderAssumptions(m.result,c,m.elapsed);if(m.action==='swr'){swr={result:m.result,config:c};renderSWR();}activeJob=null;};worker.onerror=e=>{err('Worker 執行失敗：'+e.message);setBusy(false);worker.terminate();worker=null;activeJob=null;};}
function start(action){if(busy)return;$('error').hidden=true;const c=config();if(!Number.isFinite(c.initial)){setDrawer(true);$('initial').reportValidity();return;}try{validate(c,dataset);}catch(e){err(e.message);if(!dataset&&c.returnMode==='historical')showTab('data');return;}if(!worker)newWorker();activeJob={id:++job,config:c};setBusy(true);$('progress').value=0;$('statusText').textContent='準備瀏覽器運算…';if(action==='run'){showTab('dashboard');setDrawer(false);}worker.postMessage({id:job,action,config:c,dataset});}
function render(){const{result:r,config:c,elapsed}=last;$('ruinMetric').textContent=pct(1-r.survival);$('ruinNote').textContent=`95% 區間 ${pct(1-r.survivalCI[1])}–${pct(1-r.survivalCI[0])} · ${r.ruined.toLocaleString()} 條路徑`;$('lifestyleMetric').textContent=pct(r.lifestyle);$('lifestyleNote').textContent=`未耗盡，且各年生活費 ≥ 初始 ${pct(c.spendingFloor,0)}`;$('terminalMetric').textContent=money(r.terminal[3],true,c.currency);$('terminalNote').textContent=`${c.currency} 購買力 · P5 ${money(r.terminal[1],true,c.currency)} · P95 ${money(r.terminal[5],true,c.currency)}`;$('spendingMetric').textContent=money(c.initial*c.rate,false,c.currency);$('spendingNote').textContent=`每月約 ${money(c.initial*c.rate/12,false,c.currency)} · 本次模擬`;$('horizon').textContent=`${c.years} 年`;
  $('riskBars').replaceChildren();[10,20,30,50].forEach((d,i)=>{const row=document.createElement('div');row.className='risk-row';const title=document.createElement('span');title.textContent=`下降 >${d}%`;const track=document.createElement('div');track.className='risk-track';const bar=document.createElement('div');bar.className='risk-fill';bar.style.width=`${r.drops[i]*100}%`;track.append(bar);const value=document.createElement('b');value.textContent=pct(r.drops[i]);row.append(title,track,value);$('riskBars').append(row);});
  $('viewYears').max=c.years;$('viewYears').value=c.years;$('yearInspect').max=c.years;$('yearInspect').value=Math.min(25,c.years);$('yearOutput').textContent=`第 ${$('yearInspect').value} 年`;
  $('depletionSubtitle').textContent=r.medianDepletion?`耗盡路徑的首次耗盡年度中位數：第 ${r.medianDepletion} 年`:'這批路徑未發生耗盡；不代表未來不會發生。';
  $('runMeta').textContent=`${c.currency} · ${STRATEGIES[c.strategy]} · ${c.years} 年 × ${c.paths.toLocaleString()} 路徑 · ${(elapsed/1000).toFixed(2)} 秒 · ${c.returnMode==='historical'?'專案歷史':c.returnMode==='vcmm'?'VCMM 參考情境':'自訂假設'} · ${c.sampling} · 種子 ${c.seed}`;
  $('exportCSV').disabled=false;$('exportJSON').disabled=false;draw();}
function draw(inspect=null){if(!last||$('dashboard').hidden)return;const{result:r,config:c}=last,years=Math.max(1,Math.min(c.years,Number($('viewYears').value)||c.years));document.querySelector('.primary-chart h2').textContent=`${c.years} 年後的你，可能站在哪裡？`;const sampleView=$('pathView').value==='samples';document.querySelector('.legend').innerHTML=sampleView?'<span class="key sample-best">期末最好樣本</span><span class="key sample-worst">期末最差樣本</span><span class="key median">P50 中位數</span>':'<span class="key pale">P5–P95</span><span class="key mid">P25–P75</span><span class="key median">P50 中位數</span>';$('yearInspect').max=years;$('yearOutput').textContent=`第 ${$('yearInspect').value} 年`;fanChart($('assetChart'),r.assetPercentiles,{currency:c.currency,tails:$('tails').checked,log:$('logScale').checked,initial:c.initial,years,samples:sampleView?r.samples:null,inspect,onYear:y=>{$('yearInspect').value=y;$('yearOutput').textContent=`第 ${y} 年`;}});fanChart($('spendingChart'),r.spendingPercentiles,{currency:c.currency,initial:c.initial*c.rate,years,spending:true,inspect:inspect===null?null:Math.max(1,inspect)});barChart($('histogram'),r.histogram,{N:c.paths,formatX:v=>money(v,true,c.currency),xlabel:'期末實質資產直方圖'});barChart($('depletionChart'),r.depletion.slice(1).map((count,i)=>({low:i+1,count})),{N:c.paths,formatX:v=>`${v}年`,xlabel:'首次耗盡年度'});}
function addRow(tbody,values){const tr=document.createElement('tr');values.forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});tbody.append(tr);}
function renderComparison(rows,c,elapsed){comparisons={rows,config:c};$('compareTable').replaceChildren();for(const r of rows)addRow($('compareTable'),[STRATEGIES[r.strategy],pct(1-r.survival),pct(r.lifestyle),pct(r.drops[1]),pct(r.drops[3])]);$('compareMeta').textContent=`本次：初始 ${money(c.initial,false,c.currency)} · ${pct(c.rate)} · ${c.years} 年 · ${c.paths.toLocaleString()} 路徑 · 生活費底線 ${pct(c.spendingFloor,0)} · ${c.returnMode} / ${c.sampling} · ${(elapsed/1000).toFixed(2)} 秒。`}
function renderAssumptions(rows,c,elapsed){assumptions={rows,config:c};$('assumptionTable').replaceChildren();for(const r of rows)addRow($('assumptionTable'),[r.label,pct(1-r.survival),pct(r.lifestyle),pct(r.drops[1])]);$('assumptionMeta').textContent=`${c.currency} · ${STRATEGIES[c.strategy]} · ${pct(c.rate)} · ${c.years} 年 · ${c.paths.toLocaleString()} 路徑 · 種子 ${c.seed} · ${(elapsed/1000).toFixed(2)} 秒。全部使用相同參數模型隨機衝擊；比較漂移差異。${c.inflationModel==='cpi'?'通膨使用內建 CPI 獨立區塊抽樣。':''}`;}
function renderSWR(){const{result:r,config:c}=swr;$('swrValue').textContent=r.rate===null?'未達標':pct(r.rate);$('swrNote').textContent=`${c.currency} · ${STRATEGIES[c.strategy]} · ${c.years} 年 · ${c.paths.toLocaleString()} 路徑。`+(r.boundary?'已觸及 15% 上界，無法確定最高值。':r.rate===null?'0.1%–15% 的網格均未通過條件。':'網格精度 0.1 個百分點；非未來保證。')+(c.strategy==='percent'&&c.successMetric==='survival'?' 固定比例僅看存續不具經濟意義，建議加入生活費底線。':'');rateChart($('swrChart'),r.trials,r.target);}
function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function dataSummary(){
  const series=dataset.cpi,stats=statistics(series.inflation);
  $('datasetSummary').textContent=series.name+' · '+series.dates[0]+' — '+series.dates.at(-1)+' · '+series.inflation.length+' 個月通膨 · 年化幾何變動 '+pct(stats.cagr,2)+'。區塊抽樣保留局部物價變化，與股票報酬獨立。'+(series.gaps.length?' 缺月區間：'+series.gaps.join('、')+'；已排除跨月變動並在缺口重啟抽樣。':'');
  $('sourceTable').replaceChildren();
  for(const currency of ['TWD','USD']){const source=CPI[currency];addRow($('sourceTable'),[currency+' CPI',source.dates[0]+' — '+source.dates.at(-1),source.dates.length+' 筆月指數','已隨專案內建']);}
  addRow($('sourceTable'),['VCMM 參考參數',VCMM.asOf+' 基準／'+VCMM.published+' 發布','美股 4.2–6.2%；除美 3.9–5.9%','已隨專案內建']);
  addRow($('sourceTable'),['MSCI ACWI IMI 完整月序列','尚未取得可發布資料','歷史股票抽樣暫不可用','由專案追蹤補齊']);
  $('dataVersion').textContent='CPI 資料擷取：'+CPI.retrieved+'；頁面開啟時不向外部服務下載或要求匯入。';
}

document.querySelectorAll('[data-tab]').forEach(e=>e.onclick=()=>showTab(e.dataset.tab));$('methodsNav').onclick=()=>showTab('data');$('mobileParams').onclick=()=>setDrawer(!document.querySelector('.sidebar').classList.contains('open'));$('closeParams').onclick=()=>setDrawer(false);document.addEventListener('click',e=>{if(!e.target.closest('.sidebar')&&!e.target.closest('#mobileParams'))setDrawer(false);});
$('parameters').onsubmit=e=>{e.preventDefault();start('run');};$('parameters').addEventListener('input',()=>{sync();});$('returnMode').addEventListener('change',()=>{if($('returnMode').value==='historical'){$('sampling').value='stationary';}sync();});$('sampling').addEventListener('change',()=>{if($('sampling').value==='parametric'&&$('returnMode').value==='historical')$('returnMode').value='custom';sync();});
$('currency').addEventListener('change',()=>{const preset=currencyDefaults($('currency').value);fill({...config(),initial:preset.initial,inflation:preset.inflation,inflationVol:preset.inflationVol,inflationModel:'constant'});});
$('reset').onclick=()=>fill(currencyDefaults($('currency').value));$('cancel').onclick=()=>{worker?.terminate();worker=null;activeJob=null;setBusy(false);$('statusText').textContent='已停止運算；保留上次完成的結果。';};$('compareRun').onclick=()=>start('compare');$('assumptionRun').onclick=()=>start('assumptions');$('swrRun').onclick=()=>start('swr');
for(const id of ['successTarget','successMetric','spendingFloor'])$(id).addEventListener('input',sync);
for(const id of ['tails','logScale','pathView'])$(id).addEventListener('change',()=>draw());$('viewYears').oninput=()=>draw();$('yearInspect').oninput=()=>{$('yearOutput').textContent=`第 ${$('yearInspect').value} 年`;draw(+$('yearInspect').value);};
$('exportJSON').onclick=()=>{if(!last)return;download('retirement-research-snapshot.json',JSON.stringify({version:'1.2.0',environment:{userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,viewport:{width:innerWidth,height:innerHeight}},...last,comparisons,assumptions,swr,notice:'No raw historical observations included. Model-conditional simulations, not forecasts or guarantees.'},null,2),'application/json');};
$('exportCSV').onclick=()=>{if(!last)return;const r=last.result,currency=last.config.currency,lines=['year,currency,asset_p1,asset_p5,asset_p25,asset_p50,asset_p75,asset_p95,asset_p99,spend_p1,spend_p5,spend_p25,spend_p50,spend_p75,spend_p95,spend_p99'];r.assetPercentiles.forEach((a,i)=>{const sp=i===0?Array(7).fill(''):r.spendingPercentiles[i-1].values;lines.push([i,currency,...a.values,...sp].join(','));});download('retirement-real-'+currency.toLowerCase()+'-percentiles.csv',lines.join('\n'),'text/csv;charset=utf-8');};
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{draw();if(swr&&!$('safe').hidden)renderSWR();},120);});
try{
  const current=localStorage.getItem('retirement-config-v2');
  const legacy=current?null:JSON.parse(localStorage.getItem('retirement-config-v1'));
  const saved=current?JSON.parse(current):legacy?{...legacy,currency:'USD'}:null;
  const restored=saved?{...currencyDefaults(saved.currency||'TWD'),...saved}:currencyDefaults();
  if(restored.returnMode==='historical')restored.returnMode='custom';
  restored.sampling='parametric';
  if(restored.inflationModel==='historical')restored.inflationModel='cpi';
  fill(restored);
}catch{fill(currencyDefaults());}
dataSummary();sync();
