// Portable, offline-friendly fallback using the same production modules and Worker.
// Does not change the modular source.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
const out=path.resolve(process.argv[2]||'local-data/standalone');mkdirSync(out,{recursive:true});
const read=f=>readFileSync('dist/'+f,'utf8');
const moduleBody=source=>source.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const core=moduleBody(read('data.js'))+'\n'+moduleBody(read('engine.js'));
const worker=core+'\n'+moduleBody(read('worker.js'));
const replacement=`new Worker(URL.createObjectURL(new Blob([${JSON.stringify(worker)}],{type:'text/javascript'})),{type:'module'})`;
const app=moduleBody(read('app.js')).replace("new Worker(new URL('./worker.js',import.meta.url),{type:'module'})",()=>replacement);
const script=core+'\n'+moduleBody(read('cpi-data.js'))+'\n'+moduleBody(read('currency.js'))+'\n'+moduleBody(read('datasets.js'))+'\n'+moduleBody(read('charts.js'))+'\n'+app;
writeFileSync(path.join(out,'standalone-check.mjs'),script);
writeFileSync(path.join(out,'standalone-worker-check.mjs'),worker);
const css=read('style.css').replace(/^@import[^\n]*\n/,'');
const html=read('index.html').replace('<link rel="stylesheet" href="./style.css">',()=>'<style>'+css+'</style>').replace('<script type="module" src="./app.js"></script>',()=>'<script type="module">'+script.replace(/<\/script/gi,'<\\/script')+'</script>');
writeFileSync(path.join(out,'retirement-lab.html'),html);
console.log(JSON.stringify({standalone:path.join(out,'retirement-lab.html'),bytes:Buffer.byteLength(html)}));
