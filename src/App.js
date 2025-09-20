import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "./components/HomePage";
import ProduceDetail from "./components/ProduceDetail";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/produce/:id" element={<ProduceDetail />} />
            <Route path="/admin/:token" element={<ProtectedAdminRoute />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
