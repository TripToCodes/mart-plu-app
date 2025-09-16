import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import ProduceCard from "../components/ProduceCard";
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const navigate = useNavigate();

  // Admin passcode (in production, this should be environment variable or stored securely)
  const ADMIN_PASSCODE = "123456";

  // Fetch top 30 newest produce items
  const { data: recentProduceItems = [], isLoading: loadingRecent } = useQuery({
    queryKey: ["recentProduce"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produce_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data;
    },
  });

  // Search produce items
  const { data: searchResults = [], isLoading: loadingSearch } = useQuery({
    queryKey: ["searchProduce", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const { data, error } = await supabase
        .from("produce_items")
        .select("*")
        .or(`name.ilike.%${searchQuery}%,plu_code.ilike.%${searchQuery}%`)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: searchQuery.trim().length > 0,
  });

  const handleItemClick = (item) => {
    // Navigate to detail page
    navigate(`/produce/${item.id}`);
  };

  const handleAdminClick = () => {
    setShowAdminModal(true);
    setPasscode("");
    setPasscodeError("");
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();

    if (passcode === ADMIN_PASSCODE) {
      setShowAdminModal(false);
      navigate("/d4sh8o4rd_s3cur3_t0k3n_2024");
    } else {
      setPasscodeError("Invalid passcode. Please try again.");
      setPasscode("");
    }
  };

  const handleModalClose = () => {
    setShowAdminModal(false);
    setPasscode("");
    setPasscodeError("");
  };

  const handlePasscodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 6) {
      setPasscode(value);
      setPasscodeError("");
    }
  };

  const displayItems = searchQuery.trim() ? searchResults : recentProduceItems;
  const isLoading = searchQuery.trim() ? loadingSearch : loadingRecent;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Produce Search</h1>
            <button
              onClick={handleAdminClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Admin
            </button>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search item names or codes..."
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            {searchQuery.trim() ? `Search Results (${searchResults.length})` : "Latest Items"}
          </h2>
          {!searchQuery.trim() && (
            <p className="text-sm text-gray-600 mt-1">30 most recently added produce items</p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {/* No Results */}
        {!isLoading && displayItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
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
            </div>
            <p className="text-gray-500">
              {searchQuery.trim()
                ? "No produce found matching your search."
                : "No produce items available."}
            </p>
          </div>
        )}

        {/* Produce Grid */}
        {!isLoading && displayItems.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {displayItems.map((item) => (
              <ProduceCard key={item.id} item={item} onClick={() => handleItemClick(item)} />
            ))}
          </div>
        )}
      </main>

      {/* Admin Passcode Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Admin Access</h3>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePasscodeSubmit} className="px-6 py-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">
                  Enter the 6-digit admin passcode to continue
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="passcode" className="block text-sm font-medium text-gray-700 mb-2">
                  Passcode
                </label>
                <input
                  type="text"
                  id="passcode"
                  value={passcode}
                  onChange={handlePasscodeChange}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-2xl font-mono tracking-widest"
                  maxLength="6"
                  autoComplete="off"
                  autoFocus
                />
                {passcodeError && (
                  <p className="text-red-500 text-sm mt-2 text-center">{passcodeError}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passcode.length !== 6}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
