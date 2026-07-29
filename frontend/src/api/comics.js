import API from "./axios";

export const getComics = async () => {
    try {
        // This automatically attaches your localStorage token!
        const response = await API.get("/comics"); 
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default API;