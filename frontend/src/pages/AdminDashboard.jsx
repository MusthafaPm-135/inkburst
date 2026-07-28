import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalComics: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0
    });

    const [comics, setComics] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        genre: '',
        price: '',
        description: ''
    });

    const [coverFile, setCoverFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [message, setMessage] = useState(null);
    const [statsError, setStatsError] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingComic, setEditingComic] = useState(null);

    useEffect(() => {
        fetchStats();
        fetchComics();
    }, []);

    const fetchStats = async () => {
        try {
            setStatsError("");
            const res = await axios.get(
                "http://localhost:5000/api/admin/stats",
                { withCredentials: true }
            );

            if (res.data.success) {
                setStats(res.data.stats);
            } else {
                setStatsError(res.data.message || "Unable to load dashboard statistics.");
            }
        } catch (err) {
            console.error(err);
            setStatsError(
                err.response?.data?.message ||
                "Unable to load dashboard statistics. Please log out and log in again."
            );
        }
    };

    const fetchComics = async () => {
        try {
            const res = await axios.get(
                "http://localhost:5000/api/comics"
            );

            if (Array.isArray(res.data)) {
                setComics(res.data);
            } else if (Array.isArray(res.data.comics)) {
                setComics(res.data.comics);
            } else if (Array.isArray(res.data.data)) {
                setComics(res.data.data);
            } else {
                setComics([]);
            }
        } catch (err) {
            console.error(err);
            setComics([]);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setFormData({
            title: "",
            author: "",
            genre: "",
            price: "",
            description: ""
        });
        setCoverFile(null);
        setPdfFile(null);
        setEditingId(null);
        setEditingComic(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage(null);

        const uploadData = new FormData();

        uploadData.append("title", formData.title);
        uploadData.append("author", formData.author);
        uploadData.append("genre", formData.genre);
        uploadData.append("price", formData.price);
        uploadData.append("description", formData.description);

        if (coverFile) uploadData.append("cover_image", coverFile);
        if (pdfFile) uploadData.append("pdf_file", pdfFile);

        try {
            const url = editingId
                ? `http://localhost:5000/api/admin/comics/${editingId}`
                : "http://localhost:5000/api/admin/comics";
            const res = await axios({
                method: editingId ? "put" : "post",
                url,
                data: uploadData,
                headers: {
                    "Content-Type": "multipart/form-data"
                },
                withCredentials: true
                }
            );

            if (res.data.success) {
                setMessage({
                    type: "success",
                    text: editingId ? "Comic updated successfully." : "Comic uploaded successfully."
                });
                resetForm();

                fetchStats();
                fetchComics();
            }

        } catch (err) {
            console.error(err);

            setMessage({
                type: "error",
                text: err.response?.data?.message ||
                    (editingId ? "Unable to update the comic." : "Unable to upload the comic.")
            });
        }
    };

    const handleEdit = (comic) => {
    setEditingId(comic.id);
    setEditingComic(comic);
    setMessage(null);

    setFormData({
        title: comic.title,
        author: comic.author,
        genre: comic.genre,
        price: comic.price,
        description: comic.description || ""
    });

    setCoverFile(null);
    setPdfFile(null);
};

    const handleDelete = async (id) => {

        if (!window.confirm("Delete this comic?"))
            return;

        try {

            await axios.delete(
                `http://localhost:5000/api/admin/comics/${id}`,
                {
                    withCredentials: true
                }
            );

            if (editingId === id) {
                resetForm();
            }

            setMessage({
                type: "success",
                text: "Comic deleted successfully."
            });

            fetchStats();
            fetchComics();

        } catch (err) {

            console.error(err);
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Unable to delete the comic."
            });

        }

    };

    return (
        <div style={{ padding: "2rem" }}>

            <h2>Admin Dashboard</h2>

            {message && (
                <p
                    style={{
                        color: message.type === "success" ? "#2e8b57" : "#d9534f",
                        fontWeight: "bold"
                    }}
                >
                    {message.text}
                </p>
            )}

            {statsError && (
                <p style={{ color: "#d9534f", fontWeight: "bold" }}>
                    Dashboard statistics could not load: {statsError}
                </p>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: "20px",
                    marginBottom: "40px"
                }}
            >

                <div style={cardStyle}>
                    <h3>Total Comics</h3>
                    <p style={numberStyle}>
                        {stats.totalComics}
                    </p>
                </div>

                <div style={cardStyle}>
                    <h3>Total Users</h3>
                    <p style={numberStyle}>
                        {stats.totalUsers}
                    </p>
                </div>

                <div style={cardStyle}>
                    <h3>Total Orders</h3>
                    <p style={numberStyle}>
                        {stats.totalOrders}
                    </p>
                </div>

                <div style={cardStyle}>
                    <h3>Total Revenue</h3>
                    <p style={numberStyle}>
                        ${Number(stats.totalRevenue).toFixed(2)}
                    </p>
                </div>

            </div>

            <h3>{editingId ? "Edit Comic" : "Add New Comic"}</h3>

            {editingComic && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: "20px",
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "8px"
                    }}
                >
                    <img
                        src={`http://localhost:5000/uploads/covers/${editingComic.cover_image}`}
                        alt={`Current cover for ${editingComic.title}`}
                        width="90"
                        style={{ objectFit: "cover", borderRadius: "4px" }}
                    />
                    <div>
                        <strong>Currently editing: {editingComic.title}</strong>
                        <p style={{ margin: "8px 0" }}>
                            Leave either file field empty to keep its existing file.
                        </p>
                        <a
                            href={`http://localhost:5000/api/admin/comics/${editingComic.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            View current PDF
                        </a>
                    </div>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                    marginBottom: "40px"
                }}
            >

                <input
                    type="text"
                    name="title"
                    placeholder="Title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                />

                <input
                    type="text"
                    name="author"
                    placeholder="Author"
                    value={formData.author}
                    onChange={handleInputChange}
                    required
                />

                <input
                    type="text"
                    name="genre"
                    placeholder="Genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    required
                />

                <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    placeholder="Price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                />

                <textarea
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="5"
                    required
                />

                <label>Cover Image</label>

                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                        setCoverFile(e.target.files[0])
                    }
                    required={!editingId}
                />

                <label>Comic PDF</label>

                <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                        setPdfFile(e.target.files[0])
                    }
                    required={!editingId}
                />

                <button type="submit">
                    {editingId ? "Update Comic" : "Upload Comic"}
                </button>

                {editingId && (
                    <button type="button" onClick={resetForm}>
                        Cancel Edit
                    </button>
                )}

            </form>

            <h3>Manage Comics</h3>

            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse"
                }}
            >

                <thead>

                    <tr>

                        <th>Title</th>
                        <th>Author</th>
                        <th>Genre</th>
                        <th>Price</th>
                        <th>Description</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {comics.map((comic) => (

                        <tr key={comic.id}>

                            <td>{comic.title}</td>

                            <td>{comic.author}</td>

                            <td>{comic.genre}</td>

                            <td>${comic.price}</td>

                            <td>
                                {comic.description || "No description"}
                            </td>

                            <td>
    <button
        onClick={() => handleEdit(comic)}
        style={{
            color: "blue",
            marginRight: "10px",
            cursor: "pointer"
        }}
    >
        Edit
    </button>

    <button
        onClick={() => handleDelete(comic.id)}
        style={{
            color: "red",
            cursor: "pointer"
        }}
    >
        Delete
    </button>
</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
};

const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center"
};

const numberStyle = {
    fontSize: "28px",
    fontWeight: "bold"
};

export default AdminDashboard;
