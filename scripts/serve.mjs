import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export function previewServer({root=path.resolve('dist'),basePath='/'}={}) {
  if(!basePath.startsWith('/')||!basePath.endsWith('/'))throw Error('BASE_PATH must start and end with /.');
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
  return http.createServer(async(req,res)=>{
    try {
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(basePath!=='/'&&pathname===basePath.slice(0,-1)){res.writeHead(301,{Location:basePath}).end();return;}
      if(!pathname.startsWith(basePath)){res.writeHead(404).end('Not found');return;}
      const file=path.resolve(root,pathname.slice(basePath.length)||'index.html');
      if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
      const data=await readFile(file);
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
    } catch {res.writeHead(404).end('Not found');}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const port=Number(process.env.PORT||4173),basePath=process.env.BASE_PATH||'/';
  const server=previewServer({basePath});
  server.on('error',e=>{console.error(`Preview failed: ${e.code} (${e.message})`);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}${basePath}`));
}
