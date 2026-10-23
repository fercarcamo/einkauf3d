import {copyFile,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(root,'dist');
// Only these public app assets are deployed. Local archives and tooling stay out.
const assets=['index.html','app.js','models.js','analytics.js','replay.js','layout.js','style.css','theme.css','video.css','P2P.csv'];
await rm(output,{recursive:true,force:true});
await mkdir(path.join(output,'vendor/three/addons/controls'),{recursive:true});
for(const file of assets)await copyFile(path.join(root,file),path.join(output,file));
for(const file of ['three.module.js','three.core.js'])await copyFile(path.join(root,'node_modules/three/build',file),path.join(output,'vendor/three',file));
await copyFile(path.join(root,'node_modules/three/examples/jsm/controls/OrbitControls.js'),path.join(output,'vendor/three/addons/controls/OrbitControls.js'));
await copyFile(path.join(root,'node_modules/three/LICENSE'),path.join(output,'vendor/three/LICENSE'));
const html=await readFile(path.join(output,'index.html'),'utf8');
if(!html.includes('./node_modules/three/build/three.module.js'))throw Error('Expected development import map not found');
await writeFile(path.join(output,'index.html'),html.replaceAll('./node_modules/three/build/three.module.js','./vendor/three/three.module.js').replaceAll('./node_modules/three/examples/jsm/','./vendor/three/addons/'));
await writeFile(path.join(output,'.nojekyll'),'');
console.log('GitHub Pages build ready: dist/ (app, public sample CSV, Three.js and license).');
