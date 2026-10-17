import {DEFAULTS} from './engine.js';
import {INFLATION_PRESETS} from './scenarios.js';
import {EQUITY_PARAMETERS} from './equity-parameters.js';

// Planning presets, not a live FX quote or a conversion of the user's assets.
export const CURRENCIES=Object.freeze({
  TWD:Object.freeze({label:'台幣',initial:30000000,...INFLATION_PRESETS.TWD}),
  USD:Object.freeze({label:'美元',initial:1000000,...INFLATION_PRESETS.USD}),
});
export function currencyDefaults(currency='TWD'){
  if(!CURRENCIES[currency])throw Error('未知幣種。');
  const {initial,inflation,inflationVol}=CURRENCIES[currency];
  return {...DEFAULTS,currency,initial,inflation,inflationVol,inflationModel:'preset',returnMode:EQUITY_PARAMETERS.status==='ready'?'msci':'custom'};
}
