import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, uploadProducePhoto, deleteProducePhoto } from "../supabase";

const ProduceForm = ({ editingItem, onSuccess, onError, onCancel }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    plu_code: "",
    description: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Set form data when editing
  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || "",
        plu_code: editingItem.plu_code || "",
        description: editingItem.description || "",
      });
      setPhotoPreview(editingItem.photo_url || null);
    } else {
      setFormData({
        name: "",
        plu_code: "",
        description: "",
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
  }, [editingItem]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let photoUrl = editingItem?.photo_url || null;

      // Handle photo upload
      if (photoFile) {
        setUploading(true);
        try {
          // Delete old photo if editing and has existing photo
          if (editingItem?.photo_url) {
            await deleteProducePhoto(editingItem.photo_url);
          }

          // Upload new photo
          const tempId = editingItem?.id || `temp-${Date.now()}`;
          photoUrl = await uploadProducePhoto(photoFile, tempId);
        } catch (error) {
          console.error("Photo upload error:", error);
          throw new Error("Failed to upload photo");
        } finally {
          setUploading(false);
        }
      }

      const itemData = {
        ...data,
        photo_url: photoUrl,
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("produce_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        return "Item updated successfully";
      } else {
        // Create new item
        const { error } = await supabase.from("produce_items").insert([itemData]);

        if (error) throw error;
        return "Item added successfully";
      }
    },
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["allProduce"] });
      queryClient.invalidateQueries({ queryKey: ["recentProduce"] });
      resetForm();
      onSuccess(message);
    },
    onError: (error) => {
      console.error("Save error:", error);
      onError(error.message || "Error saving item");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      plu_code: "",
      description: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        onError("Please select a valid image file");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        onError("Image size must be less than 5MB");
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(editingItem?.photo_url || null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || !formData.plu_code.trim()) {
      onError("Name and PLU code are required");
      return;
    }

    saveMutation.mutate(formData);
  };

  const isLoading = saveMutation.isLoading || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>

        {/* Photo Preview/Upload Area */}
        <div className="flex flex-col space-y-4">
          {/* Preview */}
          {photoPreview && (
            <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          )}

          {/* Upload Input */}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Max 5MB. Supported formats: JPG, PNG, GIF, WebP
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 gap-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="e.g., Red Apple"
            required
            disabled={isLoading}
          />
        </div>

        {/* PLU Code */}
        <div>
          <label htmlFor="plu_code" className="block text-sm font-medium text-gray-700 mb-1">
            PLU Code *
          </label>
          <input
            type="text"
            id="plu_code"
            name="plu_code"
            value={formData.plu_code}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
            placeholder="e.g., 4131"
            required
            disabled={isLoading}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Optional description..."
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {uploading ? "Uploading..." : "Saving..."}
            </span>
          ) : editingItem ? (
            "Update Item"
          ) : (
            "Add Item"
          )}
        </button>

        {editingItem && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ProduceForm;
