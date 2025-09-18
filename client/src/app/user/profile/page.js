"use client";

import { useSelector } from "react-redux";

export default function UserProfile() {
    const user = useSelector((state) => state.user.userInfo);

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-500">No user data found.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-4 text-center">User Profile</h2>
            <div className="space-y-3">
                <div>
                    <h3 className="font-semibold text-gray-700">Full Name:</h3>
                    <p className="text-gray-600">{user.name}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-700">Email:</h3>
                    <p className="text-gray-600">{user.email}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-700">Phone Number:</h3>
                    <p className="text-gray-600">{user.phone || "Not Provided"}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-700">PAN Card:</h3>
                    <p className="text-gray-600">{user.pancard || "Not Provided"}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-700">Location:</h3>
                    <p className="text-gray-600">{user.location || "Not Provided"}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-700">Branch:</h3>
                    <p className="text-gray-600">{user.options || "Not Provided"}</p>
                </div>
            </div>
        </div>
    );
}
