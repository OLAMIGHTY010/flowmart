import { apiClient } from "./api";

export const uploadServices = {
  getSignature: async (folder?: string) => {
    const response = await apiClient.post<{
      success: boolean;
      signature: string;
      timestamp: number;
      cloudName: string;
      apiKey: string;
      folder: string;
    }>("/upload/signature", { folder });
    return response;
  },

  uploadImageToCloudinary: async (file: File, folder?: string) => {
    // 1. Get Signature from our secure backend
    const signatureData = await uploadServices.getSignature(folder);
    if (!signatureData.success) throw new Error("Failed to get upload signature");

    // 2. Prepare FormData for Cloudinary API
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", signatureData.timestamp.toString());
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder);

    // 3. Post directly to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to upload image");
    }

    // Return the secure URL from Cloudinary
    return data.secure_url;
  }
};
