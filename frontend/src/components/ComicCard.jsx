import { useNavigate } from "react-router-dom";
import API, { API_ORIGIN } from "../api/axios";

function ComicCard({ comic }) {

    const navigate = useNavigate();

    const buyNow = async () => {
        if (!localStorage.getItem("user")) {
            navigate("/login");
            return;
        }
        try {
            await API.post("/cart/add", { comicId: comic.id });
            navigate("/cart");
        } catch (error) {
            alert(error.response?.data?.message || "Could not add this comic to your cart.");
        }
    };

    const showCoverFallback = (event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
                <rect width="600" height="800" fill="#dcd3b7"/>
                <path d="M0 90h600M0 710h600" stroke="#18140f" stroke-width="12"/>
                <text x="300" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#18140f">COVER UNAVAILABLE</text>
            </svg>` )}`;
    };

    const getCoverUrl = (comic) => {
        const cover = comic.cover_image || comic.cover;
        if (!cover) return "";
        if (cover.startsWith("http://") || cover.startsWith("https://")) {
            return cover;
        }
        if (cover.startsWith("/")) {
            return `${API_ORIGIN}${cover}`;
        }
        return `${API_ORIGIN}/uploads/covers/${cover}`;
    };

    return (

        <div className="card">

            <img
                className="comic-cover"
                src={getCoverUrl(comic)}
                alt={comic.title}
                onError={showCoverFallback}
            />

            <div className="card-body"><span className="card-genre">{comic.genre || "Comic"} · ISSUE #{String(comic.id).padStart(3, "0")}</span><h3 className="card-title">{comic.title}</h3><p className="card-author">by {comic.author}</p><p className="card-desc">{comic.description || "A digital comic for your library."}</p><div className="card-foot"><span className="price">₹{Number(comic.price).toFixed(2)}</span><button className="add-btn" onClick={buyNow}>Add to cart</button></div></div>

        </div>

    );

}

export default ComicCard;
