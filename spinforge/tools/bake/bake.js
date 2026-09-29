// Cuoce un modello .glb in uno spritesheet pixel art per Spinforge.
// Uso (da spinforge/tools/bake):  npm i  &&  node bake.js ../../assets/models/blade_raptor.glb raptor [frames] [colori]
// Scrive assets/sprites/<nome>.png, <nome>.json e <nome>_anteprima.png. Richiede Playwright.
const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require(process.env.NODE_PATH_PW||'playwright');
const [,,modelArg,name,frames='36',colors='14',extra='']=process.argv;   // extra: parametri URL aggiuntivi, es. 'sat=1.4&mode=1'
if(!modelArg||!name){console.error('uso: node bake.js <modello.glb> <nome> [fotogrammi] [colori]');process.exit(1)}
const here=__dirname,root=path.resolve(here,'../..'),model=path.resolve(modelArg);
const types={'.html':'text/html','.js':'text/javascript','.glb':'model/gltf-binary'};
const srv=http.createServer((req,res)=>{
  const u=decodeURIComponent(req.url.split('?')[0]);
  const f=u==='/model.glb'?model:path.join(here,u);
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(d)});
}).listen(0,async()=>{
  const port=srv.address().port;
  const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/bake.html?model=/model.glb&frames=${frames}&colors=${colors}&${extra}`);
  await p.waitForFunction(()=>window.result,{timeout:120000}).catch(()=>{});
  const r=await p.evaluate(()=>window.result);
  if(!r){console.error('cottura fallita',errs);process.exit(1)}
  const out=path.join(root,'assets','sprites');fs.mkdirSync(out,{recursive:true});
  const w=(f,d)=>fs.writeFileSync(path.join(out,f),Buffer.from(d.split(',')[1],'base64'));
  w(name+'.png',r.png);w(name+'_anteprima.png',r.preview);
  fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify({S:r.S,H:r.H,n:r.n,palette:r.palette},null,1));
  console.log(JSON.stringify({S:r.S,H:r.H,n:r.n,palette:r.palette,bytes:Buffer.from(r.png.split(',')[1],'base64').length}));
  await b.close();srv.close();
});
