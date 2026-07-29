import API from "./axios"; // Import your custom API instance that has the token interceptor

export const getComics = async () => {
    try {
        const response = await API.get("/comics"); // Use API.get instead of axios.get
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default API;