import ts from 'typescript';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const source = await readFile('lib/sequences.ts', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022} }).outputText;
const {SequenceLoader,sequenceMemoryStats,FRAME_BUDGET} = await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));
let completed=0,aborted=0,peak=0;
globalThis.fetch = (url,{signal}) => new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>resolve({ok:true,blob:async()=>({index:Number(url.match(/frame-(\d+)/)[1])-1})}),100);
  signal.addEventListener('abort',()=>{clearTimeout(timer);aborted++;reject(new Error('aborted'))},{once:true});
});
globalThis.createImageBitmap = async (blob,options)=>{
  await delay(5);completed++;
  return {index:blob.index,width:options.resizeWidth,height:options.resizeHeight,close(){}};
};
const manifest={frameCount:193,variants:{mobile:{width:900,height:1600,path:'mobile/frame-{i}.webp'}}};
const loader=new SequenceLoader('visionary',manifest,'mobile');
loader.start();await delay(1000);
let near=0,samples=0;
for (const direction of [1,-1]) {
  for(let i=0;i<90;i++) {
    const target=direction===1?i:89-i;
    loader.setProgress(target/192);
    await delay(33);
    const frame=loader.nearest(target);
    if(frame && Math.abs(frame.index-target)<=3)near++;
    samples++;
    peak=Math.max(peak,sequenceMemoryStats().bytes);
    assert.ok(peak<=FRAME_BUDGET);
    assert.ok(sequenceMemoryStats().jobs<=2);
  }
}
loader.dispose();await delay(150);
console.log(JSON.stringify({withinThreeFrames:near/samples,completed,aborted,peakMiB:peak/1024/1024}));
if(!process.argv.includes('--baseline'))assert.ok(near/samples>=0.9,'scrubbing must keep up with 30fps target changes at 100ms network latency');
