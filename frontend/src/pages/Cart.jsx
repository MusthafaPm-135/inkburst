import { useEffect, useState } from "react";
import axios from "axios";

export default function Cart() {

    const [cart, setCart] = useState([]);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {

        try {

            const res = await axios.get(
                "http://localhost:5000/api/cart",
                {
                    withCredentials: true
                }
            );

            setCart(res.data.cart);

        } catch (err) {

            console.log(err);

        }

    };

    const removeItem = async (id) => {

        try {

            await axios.delete(
                `http://localhost:5000/api/cart/${id}`,
                {
                    withCredentials: true
                }
            );

            fetchCart();

        } catch (err) {

            console.log(err);

        }

    };

    const checkout = async () => {

        try {

            const res = await axios.post(
                "http://localhost:5000/api/orders/checkout",
                {},
                {
                    withCredentials: true
                }
            );

            alert(res.data.message);

            fetchCart();

            window.location.href = "/orders";

        } catch (err) {

            console.log(err);

            alert(
                err.response?.data?.message || "Checkout failed"
            );

        }

    };

    const total = cart.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
    );

    return (

        <div style={{ padding: "30px" }}>

            <h1
                style={{
                    textAlign: "center",
                    marginBottom: "40px"
                }}
            >
                🛒 My Cart
            </h1>

            {cart.length === 0 ? (

                <h3 style={{ textAlign: "center" }}>
                    Your cart is empty.
                </h3>

            ) : (

                <>
                    {cart.map(item => (

                        <div
                            key={item.id}
                            style={{
                                display: "flex",
                                gap: "20px",
                                marginBottom: "20px",
                                borderBottom: "1px solid #555",
                                paddingBottom: "20px"
                            }}
                        >

                            <img
                                src={`http://localhost:5000/uploads/covers/${item.cover_image}`}
                                alt={item.title}
                                width="150"
                                style={{
                                    borderRadius: "10px"
                                }}
                            />

                            <div>

                                <h2>{item.title}</h2>

                                <p>
                                    Author: {item.author}
                                </p>

                                <p>
                                    Quantity: {item.quantity}
                                </p>

                                <h2>${item.price}</h2>

                                <button
                                    onClick={() => removeItem(item.id)}
                                    style={{
                                        background: "red",
                                        color: "white",
                                        border: "none",
                                        padding: "10px 20px",
                                        borderRadius: "5px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Remove
                                </button>

                            </div>

                        </div>

                    ))}

                    <hr />

                    <h1
                        style={{
                            textAlign: "center",
                            marginTop: "30px"
                        }}
                    >
                        Total: ${total.toFixed(2)}
                    </h1>

                    <div
                        style={{
                            textAlign: "center",
                            marginTop: "30px"
                        }}
                    >

                        <button
                            onClick={checkout}
                            style={{
                                background: "#00b894",
                                color: "white",
                                border: "none",
                                padding: "15px 40px",
                                fontSize: "18px",
                                borderRadius: "8px",
                                cursor: "pointer"
                            }}
                        >
                            Checkout
                        </button>

                    </div>

                </>

            )}

        </div>

    );

}