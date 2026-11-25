import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import ComicCard from "../components/ComicCard";
import { getComics } from "../api/comics";

const PAGE_SIZE = 8;
export default function ShopPage() {
    const location = useLocation();
    const [comics, setComics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [genre, setGenre] = useState("");
    const [author, setAuthor] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);
    const [layout, setLayout] = useState("grid");
    const query = new URLSearchParams(location.search).get("q")?.toLowerCase() || "";
    useEffect(() => { getComics().then(setComics).finally(() => setLoading(false)); }, []);
    const genres = [...new Set(comics.map(c => c.genre).filter(Boolean))];
    const authors = [...new Set(comics.map(c => c.author).filter(Boolean))];
    const ceiling = Math.max(0, ...comics.map(c => Number(c.price) || 0));
    const visible = useMemo(() => {
        let rows = comics.filter(c => (!query || [c.title,c.author,c.genre,c.description].filter(Boolean).some(v => v.toLowerCase().includes(query))) && (!genre || c.genre === genre) && (!author || c.author === author) && (!maxPrice || Number(c.price) <= Number(maxPrice)));
        if (sort === "price-low") rows.sort((a,b) => Number(a.price)-Number(b.price));
        if (sort === "price-high") rows.sort((a,b) => Number(b.price)-Number(a.price));
        if (sort === "title") rows.sort((a,b) => a.title.localeCompare(b.title));
        if (sort === "newest") rows.sort((a,b) => Number(b.id)-Number(a.id));
        return rows;
    }, [comics, query, genre, author, maxPrice, sort]);
    const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const pageRows = visible.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
    return <><SiteHeader/><main className="shop-page">
        <div className="shop-breadcrumb"><a href="/">Home</a><span>/</span><b>Shop</b></div>
        <div className="shop-heading"><div><p className="eyebrow">THE KEYRA COMICS SHOP</p><h1>Filter &amp; Explore</h1><p>{query ? `Results for “${query}”` : "Find your next favorite story."}</p></div><div className="shop-controls"><label>Sort by <select value={sort} onChange={e=>{setSort(e.target.value);setPage(1)}}><option value="newest">Newest</option><option value="title">Title A–Z</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label><div className="layout-toggle"><button className={layout==="grid"?"selected":""} onClick={()=>setLayout("grid")} aria-label="Grid view">▦</button><button className={layout==="list"?"selected":""} onClick={()=>setLayout("list")} aria-label="List view">☷</button></div></div></div>
        <div className="shop-layout"><aside className="shop-filters"><div className="filter-title">CATEGORIES</div><button className={!genre?"filter-active":""} onClick={()=>{setGenre("");setPage(1)}}>All comics <span>{comics.length}</span></button>{genres.map(g=><button key={g} className={genre===g?"filter-active":""} onClick={()=>{setGenre(genre===g?"":g);setPage(1)}}>{g}<span>{comics.filter(c=>c.genre===g).length}</span></button>)}<hr/><label className="filter-title" htmlFor="price-filter">PRICE RANGE</label><input id="price-filter" type="range" min="0" max={Math.max(1,ceiling)} value={maxPrice || ceiling} onChange={e=>{setMaxPrice(Number(e.target.value)===ceiling?"":e.target.value);setPage(1)}}/><div className="price-range"><span>₹0</span><span>₹{maxPrice || ceiling}</span></div><hr/><div className="filter-title">ARTIST / AUTHOR</div>{authors.map(a=><label className="filter-check" key={a}><input type="checkbox" checked={author===a} onChange={()=>{setAuthor(author===a?"":a);setPage(1)}}/>{a}</label>)}{!authors.length&&<small>Creator filters will appear with the first release.</small>}<hr/><button className="clear-filters" onClick={()=>{setGenre("");setAuthor("");setMaxPrice("");setPage(1)}}>Clear all filters</button></aside>
        <section className="shop-results"><div className="results-count">{loading?"Loading comics…":`${visible.length} comic${visible.length===1?"":"s"}`}</div>{loading?<div className="shop-empty">Opening the vault…</div>:pageRows.length?<div className={`grid shop-grid ${layout==="list"?"list-view":""}`}>{pageRows.map(c=><ComicCard key={c.id} comic={c}/>)}</div>:<div className="shop-empty"><b>{comics.length?"No comics match these filters.":"The shelves are waiting for their first issue."}</b><p>{comics.length?"Try clearing a filter or changing your search.":"New worlds are being drawn, inked, and lettered. Check back soon."}</p></div>}{visible.length>PAGE_SIZE&&<nav className="pagination" aria-label="Shop pages"><button disabled={page===1} onClick={()=>setPage(page-1)}>‹ Previous</button>{Array.from({length:pages},(_,i)=><button key={i} className={page===i+1?"selected":""} onClick={()=>setPage(i+1)}>{i+1}</button>)}<button disabled={page===pages} onClick={()=>setPage(page+1)}>Next ›</button></nav>}</section></div>
    </main></>;
}

