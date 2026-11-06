import { writeFileSync } from 'node:fs';
import { connect, launchBrowser, startServer } from '../tests/lib/harness.mjs';
import { ROOT } from '../tests/lib/fixtures.mjs';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const server=await startServer(ROOT); const browser=await launchBrowser({width:1600,height:1000});
const target=await (await fetch(`http://127.0.0.1:${browser.port}/json/new?about:blank`,{method:'PUT'})).json();
const cdp=await connect(target.webSocketDebuggerUrl);
const errors=[]; const ev=async(e)=>{const {result,exceptionDetails}=await cdp.send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}); if(exceptionDetails)throw new Error(exceptionDetails.exception?.description||exceptionDetails.text); return result.value;};
cdp.on('Runtime.consoleAPICalled',p=>{if(p.type==='error')errors.push(p.args.map(a=>a.description||a.value).join(' '));});
try{
 await cdp.send('Page.enable');await cdp.send('Runtime.enable');await cdp.send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
 await cdp.send('Page.navigate',{url:`${server.url}/`}); await cdp.waitFor('Boolean(window.__cute3d && window.__cute3d.ready)',{timeout:30000});
 const animal=process.env.ANIMAL||'koala', outer=process.env.OUTER||'pelt', coat=process.env.COAT||'plush';
 await ev(`window.__cute3d.setAnimal('${animal}'); window.__cute3d.setCoat('${coat}'); window.__cute3d.setOuter('${outer}'); window.__cute3d.setLighting('studio'); window.__cute3d.setExpression('happy')`);
 await ev(`document.querySelector('#fur-breeze').value='${process.env.WIND||'0.8'}'; document.querySelector('#fur-breeze').dispatchEvent(new Event('input',{bubbles:true}))`);
 await sleep(1300);
 console.log(await ev(`({animal:window.__cute3d.state.animal,coat:window.__cute3d.state.coat,outer:window.__cute3d.state.outer,fluff:window.__cute3d.getRig().fluffCount,strands:window.__cute3d.getRig().strandCount,meshes:window.__cute3d.meshCount()})`));
 const shot=await cdp.send('Page.captureScreenshot',{format:'png'}); writeFileSync(process.env.OUT||'/tmp/preview.png',Buffer.from(shot.data,'base64'));
 if(errors.length) console.log('ERRORS',errors.slice(0,5));
}finally{cdp.close();browser.proc.kill();await server.close();}
