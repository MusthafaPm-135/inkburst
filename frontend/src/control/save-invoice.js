import { Capacitor } from '@capacitor/core';
export async function saveInvoice(blob, filename) {
  if (Capacitor.isNativePlatform()) {
    const [{Filesystem,Directory},{Share}] = await Promise.all([import('@capacitor/filesystem'),import('@capacitor/share')]);
    const data = await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
    const file = await Filesystem.writeFile({path:filename,data,directory:Directory.Cache});
    await Share.share({title:'KeyraComics invoice',files:[file.uri]});
  } else {
    const url=URL.createObjectURL(blob); const link=document.createElement('a');
    link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
