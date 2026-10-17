// Synthetic arithmetic fixtures only. These are not market or CPI observations.
export const levelsCSV=['date,index,cpi',...Array.from({length:25},(_,i)=>`${2000+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')},${100*1.01**i},${100*1.002**i}`)].join('\n');
export const returnsCSV=['date,return',...Array.from({length:24},(_,i)=>`${2000+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')},0.01`)].join('\n');
export const gapCSV=levelsCSV.replace('2000-02','2000-03');
