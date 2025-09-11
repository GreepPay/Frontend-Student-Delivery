import React, { useState, useEffect, useCallback } from 'react';
import { capitalizeName } from '../../utils/nameUtils';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    KeyIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import AdminUserModal from './AdminUserModal';
import ConfirmationModal from '../common/ConfirmationModal';
import Pagination from '../common/Pagination';
import AdminUsersTableSkeleton from '../common/AdminUsersTableSkeleton';
import { formatDateTime } from '../../services/systemSettings';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const AdminUsersTab = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(10);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResendOTPModal, setShowResendOTPModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);

    // Statistics
    const [stats, setStats] = useState({
        totalAdmins: 0,
        superAdmins: 0,
        regularAdmins: 0,
        activeAdmins: 0,
        inactiveAdmins: 0
    });

    const fetchAdmins = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm || undefined,
                role: roleFilter !== 'all' ? roleFilter : undefined,
                isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined
            };

            const response = await apiService.getAdminUsers(params);

            setAdmins(response.data.admins || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
            setTotalItems(response.data.pagination?.totalItems || 0);
            setStats(response.data.statistics || {});
        } catch (error) {
            toast.error('Failed to fetch admin users');
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, roleFilter, statusFilter]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const handleCreateAdmin = async (adminData) => {
        try {
            console.log('📧 AdminUsersTab: Original admin data:', adminData);

            // Extract sendInvitation and filter out isActive field
            const { isActive, sendInvitation, ...adminDataForAPI } = adminData;

            // Add sendInvitation back to the payload if it's true
            if (sendInvitation) {
                adminDataForAPI.sendInvitation = true;
            }

            console.log('📧 AdminUsersTab: Processed admin data for API:', adminDataForAPI);
            console.log('📧 AdminUsersTab: sendInvitation value:', sendInvitation);

            const result = await apiService.createAdminUser(adminDataForAPI);
            console.log('📧 AdminUsersTab: Admin creation result:', result);

            // Check if admin was created successfully (handle different response structures)
            const isSuccess = result.success || result.data || (result.status >= 200 && result.status < 300);

            if (isSuccess) {
                // If admin was created successfully and sendInvitation is true, send OTP
                if (sendInvitation && (result.data?.admin?.email || result.admin?.email)) {
                    try {
                        const adminEmail = result.data?.admin?.email || result.admin?.email;
                        console.log('📧 AdminUsersTab: Sending OTP to new admin:', adminEmail);
                        await apiService.resendOTP(adminEmail);
                        toast.success('Admin user created successfully and OTP sent to email');
                    } catch (otpError) {
                        console.error('❌ AdminUsersTab: Error sending OTP:', otpError);
                        toast.success('Admin user created successfully, but OTP email failed to send');
                    }
                } else {
                    toast.success('Admin user created successfully');
                }

                setShowCreateModal(false);
                fetchAdmins();
            } else {
                throw new Error('Admin creation failed: Invalid response structure');
            }
        } catch (error) {
            console.error('❌ AdminUsersTab: Error creating admin:', error);

            // Provide more specific error messages
            let errorMessage = 'Failed to create admin user';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        }
    };

    const handleUpdateAdmin = async (adminData) => {
        try {
            console.log('📧 AdminUsersTab: Updating admin data:', adminData);
            console.log('📧 AdminUsersTab: Selected admin ID:', selectedAdmin.id || selectedAdmin._id);

            // Filter out isActive field as it's not allowed by the backend
            const { isActive, ...adminDataWithoutIsActive } = adminData;

            const result = await apiService.updateAdminUser(selectedAdmin.id || selectedAdmin._id, adminDataWithoutIsActive);
            console.log('📧 AdminUsersTab: Admin update result:', result);

            // Check if update was successful
            const isSuccess = result.success || result.data || (result.status >= 200 && result.status < 300);

            if (isSuccess) {
                toast.success('Admin user updated successfully');
                setShowEditModal(false);
                setSelectedAdmin(null);
                fetchAdmins();
            } else {
                throw new Error('Admin update failed: Invalid response structure');
            }
        } catch (error) {
            console.error('❌ AdminUsersTab: Error updating admin:', error);

            // Provide more specific error messages
            let errorMessage = 'Failed to update admin user';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        }
    };

    const handleDeleteAdmin = async () => {
        try {
            await apiService.deleteAdminUser(selectedAdmin.id || selectedAdmin._id);
            toast.success('Admin user deleted successfully');
            setShowDeleteModal(false);
            setSelectedAdmin(null);
            fetchAdmins();
        } catch (error) {
            toast.error('Failed to delete admin user');
        }
    };

    const handleResendOTP = async () => {
        try {
            await apiService.resendOTP(selectedAdmin.email);
            toast.success('OTP sent to admin email successfully');
            setShowResendOTPModal(false);
            setSelectedAdmin(null);
        } catch (error) {
            toast.error('Failed to send OTP');
        }
    };

    const getRoleBadge = (role) => {
        if (role === 'super_admin') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <ShieldCheckIcon className="w-3 h-3 mr-1" />
                    Super Admin
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <UserIcon className="w-3 h-3 mr-1" />
                Admin
            </span>
        );
    };

    const getStatusBadge = (isActive) => {
        if (isActive) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Active
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <XCircleIcon className="w-3 h-3 mr-1" />
                Inactive
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Total Admins</p>
                            <p className="text-lg font-semibold text-gray-900">{stats.totalAdmins}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <ShieldCheckIcon className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Super Admins</p>
                            <p className="text-lg font-semibold text-gray-900">{stats.superAdmins}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Regular Admins</p>
                            <p className="text-lg font-semibold text-gray-900">{stats.regularAdmins}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Active</p>
                            <p className="text-lg font-semibold text-gray-900">{stats.activeAdmins}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <XCircleIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Inactive</p>
                            <p className="text-lg font-semibold text-gray-900">{stats.inactiveAdmins}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header with Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Admin Users</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage admin accounts, roles, and permissions
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add Admin
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="search" className="sr-only">Search</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    id="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    placeholder="Search admins..."
                                />
                            </div>
                        </div>
                        <div>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            >
                                <option value="all">All Roles</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <button
                                onClick={fetchAdmins}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <FunnelIcon className="w-4 h-4 mr-2" />
                                Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Users Table */}
            {loading ? (
                <AdminUsersTableSkeleton />
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Admin
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Login
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {admins.length === 0 && (
                                    <tr key="empty">
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                            No admin users found
                                        </td>
                                    </tr>
                                )}
                                {admins.length > 0 && admins.map((admin) => (
                                    <tr key={admin.id || admin._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <UserIcon className="h-6 w-6 text-gray-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {capitalizeName(admin.name)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {admin.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(admin.role)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(admin.isActive)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {admin.lastLogin ? formatDateTime(admin.lastLogin) : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDateTime(admin.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAdmin(admin);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedAdmin(admin);
                                                        setShowResendOTPModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Resend OTP"
                                                >
                                                    <KeyIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedAdmin(admin);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-3 border-t border-gray-200">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <AdminUserModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateAdmin}
                    mode="create"
                />
            )}

            {showEditModal && selectedAdmin && (
                <AdminUserModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedAdmin(null);
                    }}
                    onSubmit={handleUpdateAdmin}
                    mode="edit"
                    admin={selectedAdmin}
                />
            )}

            {showDeleteModal && selectedAdmin && (
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedAdmin(null);
                    }}
                    onConfirm={handleDeleteAdmin}
                    title="Delete Admin User"
                    message={`Are you sure you want to delete ${capitalizeName(selectedAdmin.name)}? This action cannot be undone.`}
                    confirmText="Delete"
                    confirmColor="red"
                />
            )}

            {showResendOTPModal && selectedAdmin && (
                <ConfirmationModal
                    isOpen={showResendOTPModal}
                    onClose={() => {
                        setShowResendOTPModal(false);
                        setSelectedAdmin(null);
                    }}
                    onConfirm={handleResendOTP}
                    title="Resend OTP"
                    message={`Send a new OTP code to ${selectedAdmin.email}?`}
                    confirmText="Send OTP"
                    confirmColor="blue"
                />
            )}
        </div>
    );
};

export default AdminUsersTab;
