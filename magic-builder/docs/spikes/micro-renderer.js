// Spike: micro-renderer WebGL2 con esattamente cio' che magic-builder usa.
// Niente scene graph, niente materiali, niente loader, niente luci: gli shader
// fanno l'illuminazione analiticamente. Serve a misurare, non a essere bello.

// ---------- math ----------
export const clamp=(x,a,b)=>x<a?a:x>b?b:x;
export function m4(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);}
export function perspective(o,fovy,asp,n,f){const t=1/Math.tan(fovy/2);o[0]=t/asp;o[1]=0;o[2]=0;o[3]=0;
 o[4]=0;o[5]=t;o[6]=0;o[7]=0;o[8]=0;o[9]=0;o[10]=(f+n)/(n-f);o[11]=-1;o[12]=0;o[13]=0;o[14]=2*f*n/(n-f);o[15]=0;return o;}
export function mul(o,a,b){for(let i=0;i<4;i++){const ai0=a[i],ai1=a[i+4],ai2=a[i+8],ai3=a[i+12];
 for(let j=0;j<4;j++){o[i+j*4]=ai0*b[j*4]+ai1*b[j*4+1]+ai2*b[j*4+2]+ai3*b[j*4+3];}}return o;}
export function lookAt(o,e,c,u){let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2];
 let l=1/Math.hypot(zx,zy,zz);zx*=l;zy*=l;zz*=l;
 let xx=u[1]*zz-u[2]*zy,xy=u[2]*zx-u[0]*zz,xz=u[0]*zy-u[1]*zx;l=1/Math.hypot(xx,xy,xz)||0;xx*=l;xy*=l;xz*=l;
 const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
 o[0]=xx;o[1]=yx;o[2]=zx;o[3]=0;o[4]=xy;o[5]=yy;o[6]=zy;o[7]=0;o[8]=xz;o[9]=yz;o[10]=zz;o[11]=0;
 o[12]=-(xx*e[0]+xy*e[1]+xz*e[2]);o[13]=-(yx*e[0]+yy*e[1]+yz*e[2]);o[14]=-(zx*e[0]+zy*e[1]+zz*e[2]);o[15]=1;return o;}
export function compose(o,p,q,s){const[x,y,z,w]=q,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,
 yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
 o[0]=(1-(yy+zz))*s[0];o[1]=(xy+wz)*s[0];o[2]=(xz-wy)*s[0];o[3]=0;
 o[4]=(xy-wz)*s[1];o[5]=(1-(xx+zz))*s[1];o[6]=(yz+wx)*s[1];o[7]=0;
 o[8]=(xz+wy)*s[2];o[9]=(yz-wx)*s[2];o[10]=(1-(xx+yy))*s[2];o[11]=0;
 o[12]=p[0];o[13]=p[1];o[14]=p[2];o[15]=1;return o;}

// ---------- contesto ----------
export function createContext(canvas,{dprCap=2}={}){
 const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance',
  premultipliedAlpha:false,preserveDrawingBuffer:false});
 if(!gl)throw new Error('WebGL2 non disponibile');
 let dpr=1;
 function resize(){dpr=Math.min(devicePixelRatio||1,dprCap);
  const w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,canvas.width,canvas.height);return canvas.width/canvas.height;}
 return{gl,resize,get dpr(){return dpr;}};}

// ---------- programmi ----------
function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)+'\n'+
  src.split('\n').map((l,i)=>`${i+1}: ${l}`).join('\n'));return s;}
export function createProgram(gl,vs,fs){const p=gl.createProgram();
 gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));
 gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
 const u={},n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
 for(let i=0;i<n;i++){const info=gl.getActiveUniform(p,i);const name=info.name.replace(/\[0\]$/,'');
  u[name]={loc:gl.getUniformLocation(p,name),type:info.type,size:info.size};}
 return{program:p,uniforms:u};}
const SET={};
export function setUniform(gl,u,name,v){const e=u[name];if(!e)return;const{loc,type}=e;
 switch(type){
  case gl.FLOAT:gl.uniform1f(loc,v);break;
  case gl.FLOAT_VEC2:gl.uniform2fv(loc,v);break;
  case gl.FLOAT_VEC3:gl.uniform3fv(loc,v);break;
  case gl.FLOAT_VEC4:gl.uniform4fv(loc,v);break;
  case gl.FLOAT_MAT4:gl.uniformMatrix4fv(loc,false,v);break;
  case gl.INT:case gl.BOOL:case gl.SAMPLER_2D:gl.uniform1i(loc,v);break;
  default:gl.uniform1f(loc,v);}}

// ---------- geometria ----------
export function createMesh(gl,{attributes,indices,instanced}){
 const vao=gl.createVertexArray();gl.bindVertexArray(vao);const buffers={};
 let loc=0,count=0;
 for(const[name,a]of Object.entries(attributes)){
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,a.data,a.dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,a.size,gl.FLOAT,false,0,0);
  if(a.divisor)gl.vertexAttribDivisor(loc,a.divisor);
  else count=a.data.length/a.size;
  buffers[name]={buffer:b,loc,...a};loc++;}
 let ibo=null,icount=0;
 if(indices){ibo=gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  icount=indices.length;}
 gl.bindVertexArray(null);
 return{vao,buffers,count,ibo,icount,instanced:instanced||0,
  update(name,data){const e=buffers[name];gl.bindBuffer(gl.ARRAY_BUFFER,e.buffer);
   gl.bufferSubData(gl.ARRAY_BUFFER,0,data);}};}

// ---------- stato e disegno ----------
export const BLEND={NONE:0,ALPHA:1,ADD:2};
export function setState(gl,{blend=BLEND.NONE,depthTest=true,depthWrite=true,cull=null}){
 depthTest?gl.enable(gl.DEPTH_TEST):gl.disable(gl.DEPTH_TEST);
 gl.depthMask(depthWrite);
 if(cull===null)gl.disable(gl.CULL_FACE);else{gl.enable(gl.CULL_FACE);gl.cullFace(cull);}
 if(blend===BLEND.NONE){gl.disable(gl.BLEND);return;}
 gl.enable(gl.BLEND);
 blend===BLEND.ADD?gl.blendFunc(gl.SRC_ALPHA,gl.ONE)
  :gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);}
export function draw(gl,mesh,mode){const m=mode===undefined?gl.TRIANGLES:mode;
 gl.bindVertexArray(mesh.vao);
 if(mesh.ibo){mesh.instanced?gl.drawElementsInstanced(m,mesh.icount,gl.UNSIGNED_SHORT,0,mesh.instanced)
  :gl.drawElements(m,mesh.icount,gl.UNSIGNED_SHORT,0);}
 else{mesh.instanced?gl.drawArraysInstanced(m,0,mesh.count,mesh.instanced)
  :gl.drawArrays(m,0,mesh.count);}}

// ---------- loop ----------
export function loop(fn){let last=performance.now(),raf=0,running=true;
 const tick=now=>{if(!running)return;const dt=Math.min((now-last)/1000,0.05);last=now;
  fn(dt,now/1000);raf=requestAnimationFrame(tick);};
 raf=requestAnimationFrame(tick);
 return()=>{running=false;cancelAnimationFrame(raf);};}
