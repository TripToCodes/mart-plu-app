import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import ProduceCard from "../ProduceCard";
import SearchBar from "../SearchBar";
import LoadingSpinner from "../LoadingSpinner";

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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

  const displayItems = searchQuery.trim() ? searchResults : recentProduceItems;
  const isLoading = searchQuery.trim() ? loadingSearch : loadingRecent;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Produce Search</h1>
            <Link
              to="/admin"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Admin
            </Link>
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
    </div>
  );
};

export default HomePage;
