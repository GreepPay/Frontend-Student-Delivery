// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Message image service for uploading images in chat messages
export const uploadMessageImage = async (imageFile) => {
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('messageImage', imageFile);

        const response = await fetch(`${API_BASE_URL}/messages/upload-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload image');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error uploading message image:', error);
        throw error;
    }
};

// Delete message image
export const deleteMessageImage = async (imageUrl) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/messages/delete-image`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageUrl })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete image');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting message image:', error);
        throw error;
    }
};

const messageImageService = {
    uploadMessageImage,
    deleteMessageImage
};

export default messageImageService;
