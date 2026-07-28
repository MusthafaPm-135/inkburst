import { useEffect, useState } from "react";
import axios from "axios";

export default function Orders() {

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {

        try {

            const res = await axios.get(
                "http://localhost:5000/api/orders",
                {
                    withCredentials: true
                }
            );

            console.log(res.data);

            setOrders(res.data.orders);

        } catch (err) {

            console.log(err);

        }

    };

    return (

    <div style={{ padding: "30px" }}>

        <h1>My Orders</h1>

        {orders.length === 0 ? (

            <h3>You haven't purchased any comics yet.</h3>

        ) : (

            orders.map(order => (

                <div
                    key={order.id}
                    style={{
                        display: "flex",
                        gap: "20px",
                        marginBottom: "20px",
                        border: "1px solid #ddd",
                        padding: "20px",
                        borderRadius: "10px"
                    }}
                >

                    <img
                        src={`http://localhost:5000/uploads/covers/${order.cover_image}`}
                        alt={order.title}
                        width="120"
                    />

                    <div>

                        <h2>{order.title}</h2>

                        <p>
                            <strong>Author:</strong> {order.author}
                        </p>

                        <p>
                            <strong>Price:</strong> ${order.price}
                        </p>

                        <p>
                            <strong>Status:</strong> {order.payment_status}
                        </p>

                        <p>
                            <strong>Purchased:</strong>{" "}
                            {new Date(order.purchased_at).toLocaleDateString()}
                        </p>

                        <button
    style={{
        marginTop: "10px",
        padding: "10px 20px",
        cursor: "pointer"
    }}
    onClick={() =>
    window.open(
        `http://localhost:5000/api/orders/read/${order.comic_id}`,
        "_blank"
    )
}
>
    Read Comic
</button>

                    </div>

                </div>

            ))

        )}

    </div>

);

}