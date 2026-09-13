import fs from 'node:fs';
import path from 'node:path';
const generated = path.resolve('dist-admin');
if (generated !== path.join(process.cwd(), 'dist-admin')) throw new Error('Unexpected output path');
fs.rmSync(generated, {recursive:true, force:true});
// Bundle the private admin entry, without a dependency on the public storefront.
fs.mkdirSync('dist-admin',{recursive:true});
fs.cpSync('dist/assets','dist-admin/assets',{recursive:true});
fs.copyFileSync('dist/admin.html','dist-admin/index.html');
fs.copyFileSync('public/admin-icon.svg','dist-admin/admin-icon.svg');

fs.copyFileSync('public/admin-eclipse.svg','dist-admin/admin-eclipse.svg');
