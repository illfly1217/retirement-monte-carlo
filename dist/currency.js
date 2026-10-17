import {DEFAULTS} from './engine.js';

// Planning presets, not a live FX quote or a conversion of the user's assets.
export const CURRENCIES=Object.freeze({
  TWD:Object.freeze({label:'台幣',initial:30000000,inflation:0.02,inflationVol:0.01}),
  USD:Object.freeze({label:'美元',initial:1000000,inflation:0.025,inflationVol:0.015}),
});
export function currencyDefaults(currency='TWD'){
  if(!CURRENCIES[currency])throw Error('未知幣種。');
  const {initial,inflation,inflationVol}=CURRENCIES[currency];
  return {...DEFAULTS,currency,initial,inflation,inflationVol};
}
