import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const base = 'public/sequences/visionary';
await mkdir(`${base}/mobile-smooth`, {recursive:true});
const manifest = JSON.parse(await readFile(`${base}/manifest.json`, 'utf8'));
for(let start=1;start<=193;start+=4) {
  await Promise.all(Array.from({length:Math.min(4,194-start)},(_,offset)=>start+offset).map(async i=>{
    const frame=`frame-${String(i).padStart(3,'0')}.webp`;
    await sharp(`${base}/mobile/${frame}`).resize(600,1067).webp({quality:76}).toFile(`${base}/mobile-smooth/${frame}`);
  }));
}
manifest.variants.mobile = {...manifest.variants.mobile,width:600,height:1067,path:'mobile-smooth/frame-{i}.webp'};
await writeFile(`${base}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
