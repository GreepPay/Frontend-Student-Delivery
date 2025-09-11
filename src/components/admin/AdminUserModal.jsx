import React, { useState, useEffect } from 'react';
import { capitalizeName } from '../../utils/nameUtils';
import { XMarkIcon, UserIcon, EnvelopeIcon, ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminUserModal = ({ isOpen, onClose, onSubmit, mode, admin }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'admin',
        permissions: [],
        isActive: true,
        sendInvitation: true
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const permissions = [
        { id: 'create_delivery', label: 'Create Deliveries', description: 'Can create new deliveries' },
        { id: 'edit_delivery', label: 'Edit Deliveries', description: 'Can edit existing deliveries' },
        { id: 'delete_delivery', label: 'Delete Deliveries', description: 'Can delete deliveries' },
        { id: 'manage_drivers', label: 'Manage Drivers', description: 'Can manage driver accounts' },
        { id: 'view_analytics', label: 'View Analytics', description: 'Can view platform analytics' },
        { id: 'manage_remittances', label: 'Manage Remittances', description: 'Can manage driver remittances' },
        { id: 'manage_admins', label: 'Manage Admins', description: 'Can manage admin accounts (Super Admin only)' },
        { id: 'manage_system_settings', label: 'System Settings', description: 'Can modify system settings (Super Admin only)' },
        { id: 'manage_earnings_config', label: 'Earnings Configuration', description: 'Can modify earnings rules (Super Admin only)' }
    ];

    const defaultPermissions = {
        admin: ['create_delivery', 'edit_delivery', 'delete_delivery', 'manage_drivers', 'view_analytics', 'manage_remittances'],
        super_admin: ['create_delivery', 'edit_delivery', 'delete_delivery', 'manage_drivers', 'view_analytics', 'manage_remittances', 'manage_admins', 'manage_system_settings', 'manage_earnings_config']
    };

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && admin) {
                setFormData({
                    name: capitalizeName(admin.name) || '',
                    email: admin.email || '',
                    role: admin.role || 'admin',
                    permissions: admin.permissions || [],
                    isActive: admin.isActive !== undefined ? admin.isActive : true,
                    sendInvitation: false
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    role: 'admin',
                    permissions: defaultPermissions.admin,
                    isActive: true,
                    sendInvitation: true
                });
            }
            setErrors({});
        }
    }, [isOpen, mode, admin]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Update permissions when role changes
        if (name === 'role') {
            setFormData(prev => ({
                ...prev,
                role: value,
                permissions: defaultPermissions[value] || []
            }));
        }
    };

    const handlePermissionChange = (permissionId, checked) => {
        setFormData(prev => ({
            ...prev,
            permissions: checked
                ? [...prev.permissions, permissionId]
                : prev.permissions.filter(p => p !== permissionId)
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (formData.permissions.length === 0) {
            newErrors.permissions = 'At least one permission is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            console.log('📧 AdminUserModal: Submitting form data:', formData);
            onSubmit(formData);
        } else {
            console.warn('📧 AdminUserModal: Form validation failed');
            toast.error('Please fix the form errors before submitting');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                {mode === 'create' ? 'Create New Admin' : 'Edit Admin User'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Full Name *
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${errors.name
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                                                }`}
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email Address *
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${errors.email
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                                                }`}
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                    Role *
                                </label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    {formData.role === 'super_admin'
                                        ? 'Super Admins have full access to all features including admin management.'
                                        : 'Regular Admins have limited access to core features.'
                                    }
                                </p>
                            </div>

                            {/* Status */}
                            <div>
                                <div className="flex items-center">
                                    <input
                                        id="isActive"
                                        name="isActive"
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                        Active Account
                                    </label>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    Inactive accounts cannot log in to the system.
                                </p>
                            </div>

                            {/* Send Invitation (Create mode only) */}
                            {mode === 'create' && (
                                <div>
                                    <div className="flex items-center">
                                        <input
                                            id="sendInvitation"
                                            name="sendInvitation"
                                            type="checkbox"
                                            checked={formData.sendInvitation}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="sendInvitation" className="ml-2 block text-sm text-gray-900">
                                            Send invitation email
                                        </label>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Send an email with login credentials to the new admin.
                                    </p>
                                </div>
                            )}

                            {/* Permissions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Permissions *
                                </label>
                                <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-4">
                                    {permissions.map((permission) => {
                                        const isSuperAdminOnly = ['manage_admins', 'manage_system_settings', 'manage_earnings_config'].includes(permission.id);
                                        const isChecked = formData.permissions.includes(permission.id);
                                        const isDisabled = formData.role === 'admin' && isSuperAdminOnly;

                                        return (
                                            <div key={permission.id} className="flex items-start">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id={permission.id}
                                                        name={permission.id}
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                                        disabled={isDisabled}
                                                        className={`h-4 w-4 rounded focus:ring-green-500 ${isDisabled
                                                            ? 'text-gray-300 border-gray-300'
                                                            : 'text-green-600 border-gray-300'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm">
                                                    <label
                                                        htmlFor={permission.id}
                                                        className={`font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'
                                                            }`}
                                                    >
                                                        {permission.label}
                                                        {isSuperAdminOnly && (
                                                            <span className="ml-1 text-xs text-red-600">(Super Admin only)</span>
                                                        )}
                                                    </label>
                                                    <p className={`text-gray-500 ${isDisabled ? 'text-gray-300' : ''}`}>
                                                        {permission.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.permissions && (
                                    <p className="mt-1 text-sm text-red-600">{errors.permissions}</p>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            {mode === 'create' ? 'Create Admin' : 'Update Admin'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserModal;
