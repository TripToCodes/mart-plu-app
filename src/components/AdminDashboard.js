import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, uploadProducePhoto, deleteProducePhoto } from "../supabase";
import ProduceForm from "../components/ProduceForm";
import LoadingSpinner from "../components/LoadingSpinner";
import Toast from "../components/Toast";
import SearchBar from "../components/SearchBar";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch total count only
  const { data: totalCount = 0, isLoading: loadingCount } = useQuery({
    queryKey: ["produceCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("produce_items")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  // Search produce items (only when searching)
  const { data: searchResults = [], isLoading: loadingSearch } = useQuery({
    queryKey: ["searchProduce", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const { data, error } = await supabase
        .from("produce_items")
        .select("*")
        .or(
          `name.ilike.%${searchQuery}%,plu_code.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        )
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: searchQuery.trim().length > 0,
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
      queryClient.invalidateQueries({ queryKey: ["produceCount"] });
      queryClient.invalidateQueries({ queryKey: ["recentProduce"] });
      queryClient.invalidateQueries({ queryKey: ["searchProduce"] });
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

  // Handle CSV import
  async function handleCsvImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim() !== "");

      if (lines.length < 2) {
        showToast("CSV file must include a header and at least one row", "error");
        setImporting(false);
        return;
      }

      // skip header row
      const newItems = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // split by comma → works if fields don’t contain commas in quotes
        const [name, plu_code, description] = line.split(",");

        if (name && plu_code) {
          newItems.push({
            name: name.trim(),
            plu_code: plu_code.trim(),
            description: description ? description.trim() : "",
          });
        }
      }

      if (newItems.length === 0) {
        showToast("No valid rows found in CSV", "error");
        setImporting(false);
        return;
      }

      // Insert into supabase
      const { error } = await supabase.from("produce_items").insert(newItems);
      if (error) throw error;

      showToast(`CSV imported. Added ${newItems.length} items`, "success");

      // refresh queries
      queryClient.invalidateQueries({ queryKey: ["produceCount"] });
      queryClient.invalidateQueries({ queryKey: ["recentProduce"] });
      queryClient.invalidateQueries({ queryKey: ["searchProduce"] });
    } catch (err) {
      console.error("CSV import error:", err);
      showToast("Error importing CSV", "error");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleCsvExport = async () => {
    try {
      // Fetch all items for export
      const { data: allItems, error } = await supabase
        .from("produce_items")
        .select("name, plu_code, description")
        .order("name");

      if (error) throw error;

      const headers = ["name", "plu_code", "description"];
      const rows = allItems.map((item) =>
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
    } catch (error) {
      console.error("Export error:", error);
      showToast("Error exporting CSV", "error");
    }
  };

  if (loadingCount) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4 space-y-4">
          {/* Back Button Row */}
          <div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
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
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
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
              // Invalidate count to update total
              queryClient.invalidateQueries({ queryKey: ["produceCount"] });
            }}
            onError={(message) => showToast(message, "error")}
            onCancel={() => setEditingItem(null)}
          />
        </div>

        {/* CSV Import/Export Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Import CSV */}
            <div className="flex-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCsvImport}
                accept=".csv"
                className="hidden"
                disabled={importing}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {importing ? (
                  <>
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
                    Importing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    Import CSV
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                CSV format: name, plu_code, description (headers required)
              </p>
            </div>

            {/* Export CSV */}
            <div className="flex-1">
              <button
                onClick={handleCsvExport}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                disabled={totalCount === 0}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Export CSV
              </button>
              <p className="text-xs text-gray-500 mt-2">Download all {totalCount} items as CSV</p>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Produce Items ({totalCount} total)
              </h2>
              {searchQuery.trim() && (
                <p className="text-sm text-gray-500">Found {searchResults.length} items</p>
              )}
            </div>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, PLU code, or description to view items..."
            />
          </div>

          {/* Loading State for Search */}
          {loadingSearch && (
            <div className="p-8 text-center">
              <LoadingSpinner />
            </div>
          )}

          {/* Content States */}
          {!loadingSearch && (
            <>
              {totalCount === 0 ? (
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
              ) : !searchQuery.trim() ? (
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {totalCount} produce items in database
                  </p>
                  <p className="text-sm">
                    Use the search bar above to find and manage specific items
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  No items match your search for "{searchQuery}".
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {searchResults.map((item) => (
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
                                className="w-10 h-10 text-gray-400"
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
                            <p className="text-md text-blue-500 font-mono">{item.plu_code}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
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
                    </div>
                  ))}
                </div>
              )}
            </>
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
