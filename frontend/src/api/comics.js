import axios from "axios";

const API = axios.create({
    baseURL: "https://inkburst-backend.onrender.com/api",
    withCredentials: true
});

export const getComics = async () => {
    const res = await API.get("/comics");
    return res.data.comics;
};

export default API;