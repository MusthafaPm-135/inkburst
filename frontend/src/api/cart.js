import API from "./axios";

// Add comic to cart
export const addToCart = async (comicId) => {
    const res = await API.post("/cart/add", {
        comicId
    });

    return res.data;
};

// Get user's cart
export const getCart = async () => {
    const res = await API.get("/cart");
    return res.data;
};

// Remove cart item
export const removeCartItem = async (id) => {
    const res = await API.delete(`/cart/${id}`);
    return res.data;
};
