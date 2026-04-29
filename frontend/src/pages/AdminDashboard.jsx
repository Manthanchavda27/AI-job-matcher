import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalJobs: 0, totalResumes: 0, totalApplications: 0 });
  const [jobForm, setJobForm] = useState({ title: "", company: "", location: "", type: "", salary: "", skills: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [activityLogs, setActivityLogs] = useState([]);

  const loadAll = async () => {
    try {
      const [statsRes, usersRes, resumesRes, activityRes] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/users"),
        api.get("/api/admin/resumes"),
        api.get("/api/admin/activity"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setResumes(resumesRes.data || []);
      setActivityLogs(activityRes.data || []);
    } catch (err) {
      console.error("Failed to load admin data", err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);



  const toggleUserStatus = async (id) => {
    try {
      await api.patch(`/api/admin/users/${id}/block`);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user");
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">🛡️ Admin Dashboard</h1>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total Users", value: stats.totalUsers },
            { label: "Total Jobs", value: stats.totalJobs },
            { label: "Resumes Uploaded", value: stats.totalResumes },
            { label: "Total Applications", value: stats.totalApplications },

          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>



        {/* USER MANAGEMENT */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">👥 User Management</h2>

          {users.map((user) => (
            <div key={user._id} className="bg-white p-4 rounded-lg shadow mb-3 flex justify-between">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email} • {user.role}</p>
              </div>
              <button
                onClick={() => toggleUserStatus(user._id)}
                className={`text-sm ${user.isBlocked ? "text-green-600" : "text-red-600"}`}
              >
                {user.isBlocked ? "Unblock" : "Block"}
              </button>
            </div>
          ))}

          {users.length === 0 && <p className="text-gray-500 text-sm">No users found.</p>}
        </section>

        {/* RESUME OVERSIGHT */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">📄 Resume Oversight</h2>

          {resumes.length === 0 && <p className="text-gray-500">No resumes uploaded yet.</p>}

          {resumes.map((res) => (
            <div key={res._id} className="bg-white p-4 rounded-lg shadow mb-3">
              <p className="font-medium">{res.originalName}</p>
              <p className="text-sm text-gray-500">
                {res.userId?.name} ({res.userId?.email}) • Uploaded on{" "}
                {new Date(res.createdAt).toLocaleDateString()}

              </p>
            </div>
          ))}
        </section>

        {/* ACTIVITY LOG */}
        <section>
          <h2 className="text-xl font-semibold mb-4">🕵️ User Activity Log</h2>

          {activityLogs.length === 0 && (
            <p className="text-gray-500 text-sm">No activity recorded yet.</p>
          )}

          <div className="bg-white rounded-xl shadow overflow-hidden">
            {activityLogs.length > 0 && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log) => (
                    <tr key={log._id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{log.name}</td>
                      <td className="px-4 py-3 text-gray-500">{log.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                          }`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.action === "login"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                          }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{log.ip}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
