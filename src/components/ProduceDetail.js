import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import LoadingSpinner from "../components/LoadingSpinner";

const ProduceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: item,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["produce", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produce_items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <LoadingSpinner />;

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Item Not Found</h2>
          <p className="text-gray-600 mb-4">The produce item you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4"
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
          <h1 className="text-2xl font-bold text-gray-800">{item.name}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Image Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="h-64 bg-gray-100 flex items-center justify-center">
            {item.photo_url ? (
              <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-400">
                <svg
                  className="w-20 h-20 mx-auto mb-2"
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
                <p className="text-sm">No image available</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* PLU Code */}
          <div className="text-center pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-600 mb-1">PLU Code</p>
            <p className="text-3xl font-bold font-mono text-blue-600">{item.plu_code}</p>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Name</h3>
              <p className="text-gray-900 text-lg">{item.name}</p>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
              <p className="text-gray-600">{item.description || "No description available"}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate("/")}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Search More Produce
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProduceDetail;
