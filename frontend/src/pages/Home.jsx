import { useEffect, useState } from "react";
import API from "../api/axios";
import "../styles/Home.css";
import axios from "axios";

function Home() {

    const [comics, setComics] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {

        const fetchComics = async () => {

            try {

                const res = await API.get("/comics");

                setComics(res.data.comics || []);

            } catch (error) {

                console.log("Comic loading error:", error);

            } finally {

                setLoading(false);

            }

        };


        fetchComics();

    }, []);



    if (loading) {

        return (
            <h2 style={{textAlign:"center"}}>
                Loading comics...
            </h2>
        );

    }


    const addToCart = async (comicId) => {

    try {

        const res = await API.post(
            "/cart/add",
            {
                comicId
            }
        );

        alert(res.data.message);

    } catch (err) {

        console.log(err);

        alert(
            err.response?.data?.message ||
            "Failed to add comic"
        );

    }

};

const logout = async () => {

    try {

        await axios.post(
            "http://localhost:5000/api/auth/logout",
            {},
            {
                withCredentials: true
            }
        );

        alert("Logged out successfully");

        window.location.href = "/login";

    } catch (err) {

        console.log(err);

        alert("Logout failed");

    }

};

    return (

        <>

        {/* NAVBAR */}

        <nav className="nav">

            <h1 className="logo">
                🟠 INKBURST
            </h1>


            <div>

                <a href="/login">
                    Login
                </a>


                <a href="/register">
                    Register
                </a>


                <a href="/cart">
                    Cart
                </a>
                <div style={{ textAlign: "right", marginBottom: "20px" }}>
    <button
        onClick={logout}
        style={{
            background: "#e74c3c",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer"
        }}
    >
        Logout
    </button>
</div>

            </div>

        </nav>



        {/* HERO */}

        <section className="hero">

            <h1>
                YOUR NEXT
                <br/>
                OBSESSION IS
                <br/>
                ONE CLICK AWAY
            </h1>


            <p>
                Digital comics from independent creators.
            </p>


        </section>




        {/* COMICS */}

        <section className="section">


            <h2>
                Browse The Stack
            </h2>



            {
                comics.length === 0 ?


                (

                    <div className="coming">

                        <h1>
                            COMING SOON
                        </h1>


                        <p>
                            New comics are being inked right now.
                        </p>


                    </div>

                )


                :


                (

                    <div className="grid">


                    {
                        comics.map((comic)=>(


                            <div 
                            className="card"
                            key={comic.id}
                            >


                                <img

                                src={
                                    `http://localhost:5000/uploads/covers/${comic.cover_image}`
                                }

                                alt={comic.title}

                                />



                                <div className="card-body">


                                    <h3>
                                        {comic.title}
                                    </h3>


                                    <p>
                                        By {comic.author}
                                    </p>


                                    <p>
                                        {comic.genre}
                                    </p>


                                    <p>
                                        ${comic.price}
                                    </p>



                                    <button
                                        onClick={() => addToCart(comic.id)}
                                    >
                                        Add To Cart
                                    </button>


                                </div>


                            </div>


                        ))

                    }


                    </div>

                )

            }


        </section>



        </>

    );

}


export default Home;