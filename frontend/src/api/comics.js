import API from "./axios";

export const getComics = async () => {
    try {
        const response = await API.get("/comics");
        // Ensure we always return an array, even if the server sends something else
        return Array.isArray(response.data) ? response.data : response.data.comics || [];
    } catch (error) {
        console.error("Error fetching comics:", error);
        return []; // Return an empty array so .map() never crashes!
    }
};