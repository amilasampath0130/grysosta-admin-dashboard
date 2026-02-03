"use client";

import React, { useState, useEffect } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  lastLogin?: string;
  createdAt: string;
}

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      console.log("FRONTEND TOKEN:", token);
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error("Admin access required");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.message || "Unexpected response");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone.",
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        },
      );

      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        alert(data.message || "Failed to delete user");
      }
    } catch (err) {
      alert("Failed to delete user. Please try again.");
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return <div className="text-center p-4">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        Error: {error}
        <button
          onClick={fetchUsers}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[
              "ID",
              "Name",
              "Email",
              "Mobile",
              "Role",
              "Last Login",
              "Created At",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user, index) => (
              <tr
                key={user._id}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {index + 1}
                </td>
                <td className="px-6 py-4 text-sm">{user.name || "N/A"}</td>
                <td className="px-6 py-4 text-sm">{user.email}</td>
                <td className="px-6 py-4 text-sm">{user.mobile || "N/A"}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 inline-flex text-xs font-semibold rounded-full 
                      ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "user"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                </td>
                <td className="px-6 py-4 text-sm">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={user.role === "admin"}
                    title={
                      user.role === "admin"
                        ? "Cannot delete admin"
                        : "Delete user"
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
