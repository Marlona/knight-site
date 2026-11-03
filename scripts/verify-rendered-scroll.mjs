import { webkit } from 'playwright';
import assert from 'node:assert/strict';
const browser = await webkit.launch();
try {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:3});
  await page.addInitScript(()=>{
    window.drawn=[];
    const frames=new WeakMap();
    const nativeFetch=window.fetch;
    window.fetch=async(...args)=>{
      const response=await nativeFetch(...args);
      const match=String(args[0]).match(/frame-(\d+)/);
      if(match){const blob=response.blob.bind(response);response.blob=async()=>{const value=await blob();frames.set(value,Number(match[1]));return value;};}
      return response;
    };
    const decode=window.createImageBitmap.bind(window);
    window.createImageBitmap=async(blob,...args)=>{const image=await decode(blob,...args);frames.set(image,frames.get(blob));return image;};
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(frames.has(image))window.drawn.push({frame:frames.get(image),time:performance.now()});return draw.call(this,image,...args);};
  });
  await page.route('**/frame-*.webp',async route=>{await new Promise(resolve=>setTimeout(resolve,100));await route.continue();});
  await page.goto(process.argv[2] ?? 'http://localhost:8787',{waitUntil:'networkidle'});
  await page.evaluate(()=>window.drawn=[]);
  for(let index=0;index<90;index++){
    await page.evaluate(i=>window.__lenis.scrollTo(i*innerHeight*3/193,{immediate:true,force:true}),index);
    await page.waitForTimeout(33);
  }
  const result=await page.evaluate(()=>({distinct:new Set(window.drawn.map(x=>x.frame)).size,draws:window.drawn.length,first:window.drawn[0]?.frame,last:window.drawn.at(-1)?.frame}));
  console.log(result);
  assert.ok(result.distinct>=45,'too few rendered frame updates under 100ms added latency');
} finally { await browser.close(); }
