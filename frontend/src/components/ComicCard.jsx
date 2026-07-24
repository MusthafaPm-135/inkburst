import { useNavigate } from "react-router-dom";

function ComicCard({ comic }) {

    const navigate = useNavigate();

    const buyNow = () => {

        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        const exists = cart.find(item => item.id === comic.id);

        if (!exists) {
            cart.push(comic);
        }

        localStorage.setItem("cart", JSON.stringify(cart));

        navigate("/cart");
    };

    return (

        <div className="card">

            <img
                src={`http://localhost:5000/${comic.cover}`}
                alt={comic.title}
                width="220"
            />

            <h3>{comic.title}</h3>

            <p>{comic.author}</p>

            <p>{comic.genre}</p>

            <h4>₹{comic.price}</h4>

            <button onClick={buyNow}>
                Buy Now
            </button>

        </div>

    );

}

export default ComicCard;