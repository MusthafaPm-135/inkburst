export default function AdminIcon({name}) {
  const paths = {
    Overview: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
    Comics: 'M12 5v16M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z',
    Add: 'M12 4v16M4 12h16',
    Readers: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2',
    Orders: 'M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 8h6M9 12h6',
    More: 'M4 12h1M11.5 12h1M19 12h1'
  };
  return <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.More}/></svg>;
}
