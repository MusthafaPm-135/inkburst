import API from "./axios";

export const getComics = async () => {
    let remoteComics = [];
    try {
        const response = await API.get("/comics");
        // Ensure we always return an array, even if the server sends something else
        remoteComics = Array.isArray(response.data) ? response.data : response.data.comics || [];
    } catch (error) {
        console.warn("The live catalogue could not be reached; showing locally uploaded comics.", error);
    }

    // Admin uploads are also cached locally, so the Browse shelf updates even
    // while the API is unavailable.
    try {
        const localComics = JSON.parse(localStorage.getItem("keyra_local_comics") || "[]");
        const remoteIds = new Set(remoteComics.map((comic) => String(comic.id)));
        return [...localComics.filter((comic) => !remoteIds.has(String(comic.id))), ...remoteComics];
    } catch {
        return remoteComics;
    }
};
