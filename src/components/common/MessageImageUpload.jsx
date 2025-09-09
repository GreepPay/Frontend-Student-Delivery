import React, { useState, useRef } from 'react';
import { CameraIcon, XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { compressImage } from '../../services/cloudinaryService';
import toast from 'react-hot-toast';

const MessageImageUpload = ({ onImageSelect, onImageRemove, isUploading = false, resetTrigger = 0 }) => {
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // Reset component when resetTrigger changes
    React.useEffect(() => {
        if (resetTrigger > 0) {
            setPreviewImage(null);
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [resetTrigger]);

    const handleImageSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        try {
            // Compress the image
            const compressedFile = await compressImage(file, 800, 800, 0.8);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewImage(e.target.result);
                setSelectedFile(compressedFile);
                onImageSelect(compressedFile);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Image compression error:', error);
            toast.error('Failed to process image');
        }
    };

    const handleRemove = () => {
        setPreviewImage(null);
        setSelectedFile(null);
        onImageRemove();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="relative">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={isUploading}
            />

            {!previewImage ? (
                <button
                    onClick={handleClick}
                    disabled={isUploading}
                    className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Attach image"
                >
                    <PaperClipIcon className="w-5 h-5" />
                </button>
            ) : (
                <div className="relative">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <button
                        onClick={handleRemove}
                        disabled={isUploading}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                        title="Remove image"
                    >
                        <XMarkIcon className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default MessageImageUpload;
