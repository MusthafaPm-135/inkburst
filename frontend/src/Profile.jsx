import { useEffect, useState } from "react";
import api from "./api/axios";

function Profile() {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const getProfile = async () => {

            try {

                const res = await api.get("/profile");

                console.log("PROFILE RESPONSE:", res.data);

                setUser(res.data.user);

            } catch (error) {

                console.log("PROFILE ERROR:", error.response?.data || error.message);

            } finally {

                setLoading(false);

            }

        };

        getProfile();

    }, []);

    if (loading) {
        return <h3>Loading...</h3>;
    }

    if (!user) {
        return <h3>Please login</h3>;
    }

    return (
        <div>
            <h2>Welcome {user.username}</h2>
            <p>Email: {user.email}</p>
        </div>
    );
}

export default Profile;