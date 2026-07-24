import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
    withCredentials: true
});

export const getComics = async () => {
    const res = await API.get("/comics");
    return res.data.comics;
};

export default API;