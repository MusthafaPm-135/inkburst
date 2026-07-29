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

    return (

        <div className="card">

            <img
                className="comic-cover"
                src={`${API_ORIGIN}/uploads/covers/${comic.cover_image || comic.cover}`}
                alt={comic.title}
            />

            <div className="card-body"><span className="card-genre">{comic.genre || "Comic"} · ISSUE #{String(comic.id).padStart(3, "0")}</span><h3 className="card-title">{comic.title}</h3><p className="card-author">by {comic.author}</p><p className="card-desc">{comic.description || "A digital comic for your library."}</p><div className="card-foot"><span className="price">₹{Number(comic.price).toFixed(2)}</span><button className="add-btn" onClick={buyNow}>Add to cart</button></div></div>

        </div>

    );

}

export default ComicCard;
