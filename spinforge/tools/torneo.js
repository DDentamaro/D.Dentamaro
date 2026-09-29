// Torneo simulato del roster: ogni coppia di Blade gioca N round CPU contro CPU.
// Uso:  node tools/torneo.js [round=40] ['{"PARAM":valore}'] ['{"blade":{"raptor":{...}}}']
// Richiede Playwright (npm i -g playwright). Stile CPU di tutti: variabile d'ambiente PROF.
const fs=require('fs'),path=require('path'),os=require('os');
const {chromium}=require(process.env.NODE_PATH_PW||'playwright');
(async()=>{
  const dir=path.join(__dirname,'..'),src=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  const hook=fs.readFileSync(path.join(__dirname,'torneo_hook.js'),'utf8');
  const tmp=path.join(os.tmpdir(),'spinforge_torneo.html');
  fs.writeFileSync(tmp,src.replace("\n  buildSetup();addEventListener",hook));
  const b=await chromium.launch(),p=await b.newPage();
  await p.goto('file://'+tmp);
  const n=+(process.argv[2]||40),phy=JSON.parse(process.argv[3]||'null'),patch=JSON.parse(process.argv[4]||'null');
  if(process.env.PROF)await p.evaluate(v=>window.__PROF=v,process.env.PROF);
  const r=await p.evaluate(([n,phy,patch])=>__tour(n,phy,patch),[n,phy,patch]);
  r.sort((a,b)=>b.wr-a.wr);
  console.log('BLADE'.padEnd(15),'VITT%','   V','   S',' P','PUNTI','BURST+','BURST-','DURATA');
  for(const x of r)console.log(x.name.padEnd(15),String(x.wr).padStart(5),String(x.w).padStart(4),String(x.l).padStart(4),String(x.d).padStart(2),String(x.pts).padStart(5),String(x.burstW).padStart(6),String(x.burstL).padStart(6),String(x.dur).padStart(6));
  const names=r.map(x=>x.name);
  console.log('\nMATRICE: vittorie della riga contro la colonna su '+n);
  console.log(''.padEnd(15)+names.map(x=>x.slice(0,6).padStart(7)).join(''));
  for(const x of r)console.log(x.name.padEnd(15)+names.map(y=>y===x.name?'      -':String(x.vs[y]).padStart(7)).join(''));
  await b.close();
})();
