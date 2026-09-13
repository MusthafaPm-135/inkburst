import fs from 'node:fs';
// Bundle the private admin entry, without a dependency on the public storefront.
fs.mkdirSync('dist-admin',{recursive:true});
fs.cpSync('dist/assets','dist-admin/assets',{recursive:true});
fs.copyFileSync('dist/admin.html','dist-admin/index.html');
fs.copyFileSync('public/admin-icon.svg','dist-admin/admin-icon.svg');

fs.copyFileSync('public/admin-eclipse.svg','dist-admin/admin-eclipse.svg');
