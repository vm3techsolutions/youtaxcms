"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfiles } from "@/store/slices/profileSlice";

export default function ProfileList() {
  const dispatch = useDispatch();
  const { profiles, loading, error } = useSelector((state) => state.profile);

  useEffect(() => {
    dispatch(fetchProfiles());
  }, [dispatch]);

  if (loading) return <p>Loading profiles...</p>;
  if (error) return <p className="text-red-500">{JSON.stringify(error)}</p>;

  return (
    <div className="mt-4">
      <h2 className="font-semibold mb-2">My Profile Fields</h2>
      <ul className="list-disc pl-6 space-y-1">
        {profiles.map((p) => (
          <li key={p.id}>
            <span className="font-medium">{p.profile_field}</span>:{" "}
            <span>{p.field_value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
