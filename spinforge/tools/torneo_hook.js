
  window.__tour=(n,phy,patch)=>{
    if(phy)Object.assign(PHY,phy);
    if(patch)for(const slot in patch)for(const id in patch[slot])PARTS[slot][id].mod={...patch[slot][id]};
    const prof=b=>window.__PROF||({raptor:'aggressive',cyclone:'aggressive',bastion:'defensive',orbit:'balanced',halo:'balanced'})[b.blade.replace('3d','')];
    const R=ROSTER,res=R.map(b=>({name:b.name,w:0,l:0,d:0,pts:0,burstW:0,burstL:0,dur:0,games:0,vs:{}}));
    for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){
      const A=R[i],B=R[j],fa=factorsOf(A),fb=factorsOf(B);let wi=0,wj=0;
      for(let r=0;r<n;r++){
        const da=Math.random()<.5?'right':'left',db=Math.random()<.5?'right':'left';
        player=makeTop(fa,da,true,prof(A),A);enemy=makeTop(fb,db,false,prof(B),B);player.ai.profile=prof(A);
        const flip=r%2;resetTop(player,flip?.62:-.62,flip?-.3:.3);resetTop(enemy,flip?-.62:.62,flip?.3:-.3);
        player.spin=70+30*(.6+Math.random()*.4);enemy.spin=70+30*(.6+Math.random()*.4);
        let t=0;while(t<PHY.ROUND_TIME){stepTop(player,player.dead?{x:0,z:0}:enemyInput(player,enemy),1/120);stepTop(enemy,enemy.dead?{x:0,z:0}:enemyInput(enemy,player),1/120);collide(player,enemy,1/120);t+=1/120;if(player.dead||enemy.dead)break}
        let win=0,pts=1,how='';
        const pd=player.dead,ed=enemy.dead;
        if(pd&&ed){if(pd!==ed){win=pd==='burst'?2:1;pts=2}}
        else if(ed){win=1;pts=ed==='burst'?(enemy.xtreme?3:2):1}
        else if(pd){win=2;pts=pd==='burst'?(player.xtreme?3:2):1}
        else if(Math.abs(player.spin-enemy.spin)>=3)win=player.spin>enemy.spin?1:2;
        const burst=(pd==='burst'||ed==='burst');
        res[i].dur+=t;res[j].dur+=t;res[i].games++;res[j].games++;
        if(win===1){res[i].w++;res[j].l++;res[i].pts+=pts;wi++;if(burst){res[i].burstW++;res[j].burstL++}}
        else if(win===2){res[j].w++;res[i].l++;res[j].pts+=pts;wj++;if(burst){res[j].burstW++;res[i].burstL++}}
        else{res[i].d++;res[j].d++}
      }
      res[i].vs[B.name]=wi;res[j].vs[A.name]=wj;
    }
    return res.map(r=>({...r,dur:+(r.dur/r.games).toFixed(1),wr:+(100*r.w/r.games).toFixed(1)}));
  };
  buildSetup();addEventListener
