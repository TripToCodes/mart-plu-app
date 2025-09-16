import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, uploadProducePhoto, deleteProducePhoto } from "../supabase";
import ProduceForm from "../ProduceForm";
import LoadingSpinner from "../LoadingSpinner";
import Toast from "../Toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Fetch all produce items
  const { data: produceItems = [], isLoading } = useQuery({
    queryKey: ["allProduce"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produce_items").select("*").order("name");

      if (error) throw error;
      return data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (item) => {
      // Delete photo first if exists
      if (item.photo_url) {
        await deleteProducePhoto(item.photo_url);
      }

      // Delete from database
      const { error } = await supabase.from("produce_items").delete().eq("id", item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProduce"] });
      showToast("Item deleted successfully", "success");
    },
    onError: (error) => {
      console.error("Error deleting item:", error);
      showToast("Error deleting item", "error");
    },
  });

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteMutation.mutate(item);
    }
  };

  const handleCsvExport = () => {
    const headers = ["name", "plu_code", "description", "searched_count"];
    const rows = produceItems.map((item) =>
      headers.map((header) => `"${item[header] || ""}"`).join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `produce_data_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("CSV exported successfully", "success");
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/")}
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-4"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleCsvExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Add/Edit Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingItem ? "Edit Item" : "Add New Item"}
          </h2>
          <ProduceForm
            editingItem={editingItem}
            onSuccess={(message) => {
              showToast(message, "success");
              setEditingItem(null);
            }}
            onError={(message) => showToast(message, "error")}
            onCancel={() => setEditingItem(null)}
          />
        </div>

        {/* Items List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Produce Items ({produceItems.length})
            </h2>
          </div>

          {produceItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V8a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V18a2 2 0 01-2 2z"
                />
              </svg>
              No produce items found. Add your first item above.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {produceItems.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Image Preview */}
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.photo_url ? (
                          <img
                            src={item.photo_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg
                            className="w-6 h-6 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Item Info */}
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">PLU: {item.plu_code}</p>
                        {item.searched_count > 0 && (
                          <p className="text-xs text-blue-600">{item.searched_count} searches</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                        disabled={deleteMutation.isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="px-3 py-1 text-red-600 hover:text-red-700 transition-colors text-sm font-medium"
                        disabled={deleteMutation.isLoading}
                      >
                        {deleteMutation.isLoading ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <div className="mt-2 text-sm text-gray-600">{item.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "success" })}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
