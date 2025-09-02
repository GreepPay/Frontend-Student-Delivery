import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SearchableDropdown = ({
    options = [],
    value = '',
    onChange,
    placeholder = 'Select an option',
    searchPlaceholder = 'Search...',
    className = '',
    disabled = false,
    loading = false,
    emptyMessage = 'No options found',
    showSearch = true,
    maxHeight = 'max-h-60',
    renderOption = null,
    renderSelected = null,
    allowClear = false,
    label = '',
    error = '',
    required = false,
    usePortal = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const menuRef = useRef(null);
    const [menuStyles, setMenuStyles] = useState({ top: 0, left: 0, width: 0 });

    const updateMenuPosition = () => {
        if (!dropdownRef.current) return;
        const rect = dropdownRef.current.getBoundingClientRect();
        setMenuStyles({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
        });
    };

    // Filter options based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredOptions(options);
        } else {
            const filtered = options.filter(option => {
                const searchValue = typeof option === 'string' ? option : (option.label || option.name || '');
                return searchValue.toLowerCase().includes(searchTerm.toLowerCase());
            });
            setFilteredOptions(filtered);
        }
    }, [options, searchTerm]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus search input when dropdown opens
            if (showSearch && searchInputRef.current) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
            }
            // Position menu and listen to viewport changes
            updateMenuPosition();
            const handleReposition = () => updateMenuPosition();
            window.addEventListener('scroll', handleReposition, true);
            window.addEventListener('resize', handleReposition);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updateMenuPosition, true);
            window.removeEventListener('resize', updateMenuPosition);
        };
    }, [isOpen, showSearch]);

    // Get display value for selected option
    const getDisplayValue = () => {
        if (!value) return '';

        if (renderSelected) {
            return renderSelected(value, options);
        }

        const selectedOption = options.find(option => {
            const optionValue = typeof option === 'string' ? option : (option.value || option.id);
            return optionValue === value;
        });

        if (selectedOption) {
            return typeof selectedOption === 'string' ? selectedOption : (selectedOption.label || selectedOption.name || selectedOption.value);
        }

        return value;
    };

    // Handle option selection
    const handleOptionSelect = (option) => {
        const optionValue = typeof option === 'string' ? option : (option.value || option.id);
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    // Handle clear selection
    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
    };

    // Toggle dropdown
    const toggleDropdown = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const displayValue = getDisplayValue();

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Main Dropdown Button */}
            <div
                onClick={toggleDropdown}
                className={`
                    relative w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors
                    ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'hover:border-gray-400'}
                    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                    ${className}
                `}
            >
                <div className="flex items-center justify-between">
                    <span className={`block truncate ${!displayValue ? 'text-gray-500' : 'text-gray-900'}`}>
                        {loading ? 'Loading...' : (displayValue || placeholder)}
                    </span>
                    <div className="flex items-center space-x-2">
                        {allowClear && displayValue && !disabled && (
                            <button
                                onClick={handleClear}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                type="button"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        )}
                        <ChevronDownIcon
                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''
                                }`}
                        />
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                usePortal && typeof document !== 'undefined'
                    ? createPortal(
                        <div
                            ref={menuRef}
                            className="bg-white border border-gray-300 rounded-lg shadow-lg"
                            style={{ position: 'absolute', top: menuStyles.top, left: menuStyles.left, width: menuStyles.width, zIndex: 9999 }}
                        >
                            {showSearch && (
                                <div className="p-3 border-b border-gray-200">
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder={searchPlaceholder}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className={`py-1 ${maxHeight} overflow-y-auto`}>
                                {filteredOptions.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                        {searchTerm ? `No results found for "${searchTerm}"` : emptyMessage}
                                    </div>
                                ) : (
                                    filteredOptions.map((option, index) => {
                                        const optionValue = typeof option === 'string' ? option : (option.value || option.id);
                                        const isSelected = optionValue === value;
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => handleOptionSelect(option)}
                                                className={`
                                                    px-3 py-2 text-sm cursor-pointer transition-colors
                                                    ${isSelected
                                                        ? 'bg-green-100 text-green-900 font-medium'
                                                        : 'text-gray-900 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                {renderOption ? renderOption(option, isSelected) : (
                                                    typeof option === 'string' ? option : (option.label || option.name || option.value)
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>,
                        document.body
                    )
                    : (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg" ref={menuRef}>
                            {showSearch && (
                                <div className="p-3 border-b border-gray-200">
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder={searchPlaceholder}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className={`py-1 ${maxHeight} overflow-y-auto`}>
                                {filteredOptions.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                        {searchTerm ? `No results found for "${searchTerm}"` : emptyMessage}
                                    </div>
                                ) : (
                                    filteredOptions.map((option, index) => {
                                        const optionValue = typeof option === 'string' ? option : (option.value || option.id);
                                        const isSelected = optionValue === value;
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => handleOptionSelect(option)}
                                                className={`
                                                    px-3 py-2 text-sm cursor-pointer transition-colors
                                                    ${isSelected
                                                        ? 'bg-green-100 text-green-900 font-medium'
                                                        : 'text-gray-900 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                {renderOption ? renderOption(option, isSelected) : (
                                                    typeof option === 'string' ? option : (option.label || option.name || option.value)
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )
            )}
        </div>
    );
};

export default SearchableDropdown;

