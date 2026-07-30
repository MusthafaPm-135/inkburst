import { API_ORIGIN } from "./axios";

export const getCoverUrl = (cover) => {
    if (!cover) return "";
    if (/^https?:\/\//i.test(cover)) return cover;
    return `${API_ORIGIN}/uploads/covers/${encodeURIComponent(cover)}`;
};
