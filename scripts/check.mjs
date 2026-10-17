import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
async function check(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const file=`${directory}/${entry.name}`;
    if(entry.isDirectory())await check(file);
    else if(/\.(m?js)$/.test(file)){
      const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});
      if(result.status!==0)process.exit(1);
    }
  }
}
for(const directory of ['dist','scripts','tests'])await check(directory);
const result=spawnSync(process.execPath,['--check','playwright.config.mjs'],{stdio:'inherit'});
if(result.status!==0)process.exit(1);
console.log('All production, script, test and browser config modules passed syntax checks.');
