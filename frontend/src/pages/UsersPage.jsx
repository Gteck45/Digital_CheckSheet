// src/pages/UsersPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  User,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Users as UsersIcon,
} from "lucide-react";

import Layout from "../components/Layout/Layout";
import { useAuth } from "../context/AuthContext";
import { apiService, endpoints } from "../utils/api";
import { formatDateTime, isValidEmail } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import UserPagesModal from "../components/UserPagesModal";
import toast from "react-hot-toast";

/* ===============================
   USER MODAL
================================*/

const UserModal = ({ isOpen, onClose, user, roles, onSave }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role_id: "",
    status: "active",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        password: "",
        role_id: user.role_id || "",
        status: user.status || "active",
      });
    } else {
      setFormData({
        username: "",
        email: "",
        password: "",
        role_id: "",
        status: "active",
      });
    }

    setErrors({});
    setShowPassword(false);
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.trim().length > 50) {
      newErrors.username = "Username must be 50 characters or fewer";
    } else if (/\s/.test(formData.username)) {
      newErrors.username = "Username cannot contain spaces";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!user) {
      if (!formData.password) {
        newErrors.password = "Password is required for new users";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = "New password must be at least 8 characters";
    }

    if (!formData.role_id) newErrors.role_id = "Role is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onChange = (e) => {
    const { name, value } = e.target;

    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = { ...formData };

      // Don't send empty password for updates
      if (user && !payload.password) delete payload.password;

      // Convert role_id -> roles: [id]
      payload.roles = payload.role_id ? [parseInt(payload.role_id, 10)] : [];
      delete payload.role_id;

      if (user) {
        await apiService.put(`${endpoints.users.list}/${user.id}`, payload);
        toast.success("User updated successfully");
      } else {
        await apiService.post(endpoints.users.list, payload);
        toast.success("User created successfully");
      }

      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      const data = err?.response?.data;
      const msg =
        (Array.isArray(data?.errors) ? data.errors.map((e) => e.message || e.msg || e).join(", ") : null) ||
        data?.message ||
        "Failed to save user";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fieldClass = (key) =>
    `w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition
     ${errors[key] ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Modal header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user ? "Edit User" : "Add New User"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {user ? "Update user details and role" : "Create a new user account"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              name="username"
              value={formData.username}
              onChange={onChange}
              placeholder="Enter username"
              className={fieldClass("username")}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="Enter email"
              className={fieldClass("email")}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password{" "}
              {user && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (leave blank to keep current)
                </span>
              )}
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={onChange}
                placeholder={user ? "Enter new password (optional)" : "Enter password"}
                className={`${fieldClass("password")} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={onChange}
              className={fieldClass("role_id")}
            >
              <option value="">Select a role</option>
              {Array.isArray(roles) &&
                roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
            {errors.role_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.role_id}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={onChange}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {user ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ===============================
   USERS PAGE
================================*/

const UsersPage = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isPagesModalOpen, setIsPagesModalOpen] = useState(false);
  const [selectedUserForPages, setSelectedUserForPages] = useState(null);

  const usersPerPage = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm,
      };

      const res = await apiService.get(endpoints.users.list, { params });

      const payload = res?.data?.data ?? {};
      const arr = payload.users ?? [];

      setUsers(Array.isArray(arr) ? arr : []);

      const total = payload.pagination?.total ?? (Array.isArray(arr) ? arr.length : 0);
      setTotalPages(Math.max(1, Math.ceil(total / usersPerPage)));
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to fetch users");
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiService.get(endpoints.roles.simple);
      setRoles(res?.data?.data?.roles ?? []);
    } catch (err) {
      console.error("Error fetching roles:", err);
      toast.error("Failed to load roles. Please refresh the page.");
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (u) => {
    setSelectedUser(u);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await apiService.delete(`${endpoints.users.list}/${userId}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to delete user";
      toast.error(msg);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleModalSave = () => {
    fetchUsers();
    window.dispatchEvent(new Event("permissions-updated"));
  };

  const handleViewUserPages = (u) => {
    setSelectedUserForPages(u);
    setIsPagesModalOpen(true);
  };

  const handlePagesModalClose = () => {
    setIsPagesModalOpen(false);
    setSelectedUserForPages(null);
  };

  const list = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  // Stats (from current page list; if you want global stats, backend should send totals)
  const stats = useMemo(() => {
    const total = list.length;
    const active = list.filter((u) => u.status === "active").length;
    const inactive = list.filter((u) => u.status !== "active").length;
    return { total, active, inactive };
  }, [list]);

  const getRoleName = (roleId) => {
    const role = roles.find((r) => String(r.id) === String(roleId));
    return role ? role.name : "Unknown";
  };

  const statusBadge = (status) => {
    const active = status === "active";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          active
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
        {active ? "Active" : "Inactive"}
      </span>
    );
  };

  const StatCard = ({ title, value, icon: Icon, ringClass }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${ringClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <UsersIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              Users
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Manage user accounts, roles and permissions
            </p>
          </div>

          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 font-semibold"
          >
            <Plus className="h-5 w-5" />
            Add User
          </button>
        </div>

        {/* Stats Row (same theme) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total (This Page)"
            value={stats.total}
            icon={UsersIcon}
            ringClass="bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon={CheckCircle}
            ringClass="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
          />
          <StatCard
            title="Inactive"
            value={stats.inactive}
            icon={XCircle}
            ringClass="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
          />
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition"
              />
            </div>

            {searchTerm && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-700">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  Search: {searchTerm}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-14">
              <LoadingSpinner size="lg" />
            </div>
          ) : list.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                <User className="h-6 w-6 text-gray-500 dark:text-gray-300" />
              </div>
              <p className="text-gray-700 dark:text-gray-200 font-medium">No users found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Try adjusting your search or add a new user.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {list.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        {/* User */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center shadow-sm">
                              <User className="h-5 w-5 text-primary-700 dark:text-primary-300" />
                            </div>

                            <div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {u.username}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {u.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {u.email}
                            </span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {getRoleName(u.role_id)}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {statusBadge(u.status)}
                        </td>

                        {/* Last login */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {u.last_login ? formatDateTime(u.last_login) : "Never"}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* <button
                              onClick={() => handleViewUserPages(u)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-blue-400 rounded-lg transition-colors"
                              title="View assigned pages"
                            >
                              <Monitor className="h-4 w-4" />
                            </button> */}

                            <button
                              onClick={() => handleEditUser(u)}
                              className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:text-primary-400 rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            {u.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 rounded-lg transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {currentPage}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {totalPages}
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        title="Previous"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        title="Next"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        <UserModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          user={selectedUser}
          roles={roles}
          onSave={handleModalSave}
        />

        <UserPagesModal
          isOpen={isPagesModalOpen}
          onClose={handlePagesModalClose}
          user={selectedUserForPages}
        />
      </div>
    </Layout>
  );
};

export default UsersPage;