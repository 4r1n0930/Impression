import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
    const [name, setName] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    
    const handleSave = async () => {
        try {
            const token = localStorage.getItem("token");

            if (name.trim()) {
                await axios.put(
                    "http://localhost:5000/auth/update-name",
                    { name },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            }

            if (photo) {
                const formData = new FormData();
                formData.append("profilePhoto", photo);

                await axios.put(
                    "http://localhost:5000/auth/update-profile-photo",
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            }

            alert("Profile Updated Successfully");

        } catch (err) {
            console.error(err);
        }
    };
    const handlePasswordReset = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.post(
                "http://localhost:5000/auth/send-reset-link",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert(res.data.message);
        } catch (err) {
            console.error(err);
            alert("Failed to send reset link");
        }
    };

    return (
        <div className="profile-container">

            <div className="profile-card">

                <h1>Edit Profile</h1>

                <input
                    type="text"
                    placeholder="Enter New Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                />
                <button
                    type="button"
                    onClick={handlePasswordReset}
                >
                    Send Password Reset Link
                </button>

                <button onClick={handleSave}>
                    Save Changes
                </button>
            </div>

        </div>
    );
};

export default Profile;