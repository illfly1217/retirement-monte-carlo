import {CPI} from './cpi-data.js';

export function datasetForCurrency(currency){
  const source=CPI[currency];
  if(!source)throw Error('未提供此幣種的 CPI。');
  const inflation=[],dates=[],gaps=[];
  const serial=month=>Number(month.slice(0,4))*12+Number(month.slice(5))-1;
  source.levels.slice(1).forEach((value,i)=>{
    // Missing releases must never become a fabricated one-month observation.
    if(serial(source.dates[i+1])-serial(source.dates[i])!==1){gaps.push(source.dates[i]+' → '+source.dates[i+1]);return;}
    inflation.push(value/source.levels[i]-1);dates.push(source.dates[i+1]);
  });
  return {name:source.name,returns:[],inflation:[],cpi:{
    ...source,currency,version:CPI.version,retrieved:CPI.retrieved,
    dates,inflation,gaps,
  }};
}
