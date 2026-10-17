import {prepareMarket,evaluate,searchRate,STRATEGIES} from './engine.js';
let cache=null;
self.onmessage=({data:{id,action,config,dataset}})=>{
  const start=performance.now();
  const progress=(value,label)=>self.postMessage({id,type:'progress',value,label});
  try{
    const key=JSON.stringify(Object.fromEntries(['paths','years','seed','returnMode','sampling','cagr','vol','fee','drag','inflationModel','inflation','inflationVol','block','usWeight','transition','longRun'].map(k=>[k,config[k]])))+JSON.stringify(dataset);
    if(!cache||cache.key!==key)cache={key,market:prepareMarket(config,dataset,progress)};
    let result;
    if(action==='assumptions'){
      const sampling=dataset?(config.sampling==='parametric'?'stationary':config.sampling):'parametric';
      const modes=dataset?['historical','custom','vcmm']:['custom','vcmm'];
      result=modes.map(returnMode=>{
        const c={...config,returnMode,sampling};
        const market=prepareMarket(c,dataset,progress);
        return{label:returnMode==='historical'?'匯入歷史估計':returnMode==='custom'?`自訂 CAGR ${(c.cagr*100).toFixed(1)}%`:'VCMM 10 年 + 長期銜接',returnMode,...evaluate(c,market,{summaryOnly:true})};
      });
    }
    else if(action==='swr') result=searchRate(config,cache.market,progress);
    else if(action==='compare')result=Object.keys(STRATEGIES).map(strategy=>({strategy,...evaluate({...config,strategy},cache.market,{summaryOnly:true})}));
    else result=evaluate(config,cache.market,{progress});
    self.postMessage({id,type:'result',action,result,elapsed:performance.now()-start,marketMs:cache.market.elapsed});
  }catch(e){self.postMessage({id,type:'error',message:e.message});}
};
