import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";

const ProtectedAdminRoute = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Security constants (should be environment variables in production)
  const ADMIN_PASSCODE = "123456";
  const ADMIN_ROUTE_TOKEN = "d4sh8o4rd_s3cur3_t0k3n_2024";
  const AUTH_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    // Verify the route token first
    if (token !== ADMIN_ROUTE_TOKEN) {
      navigate("/", { replace: true });
      return;
    }

    // Check if user is already authenticated
    const adminAuth = sessionStorage.getItem("adminAuth");
    const authTime = sessionStorage.getItem("adminAuthTime");

    if (adminAuth === ADMIN_PASSCODE && authTime) {
      const timeElapsed = Date.now() - parseInt(authTime);

      if (timeElapsed < AUTH_TIMEOUT) {
        // Still within auth timeout, allow access
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        // Auth expired, clear storage and show modal
        sessionStorage.removeItem("adminAuth");
        sessionStorage.removeItem("adminAuthTime");
        setShowPasscodeModal(true);
        setIsLoading(false);
      }
    } else {
      // No auth or invalid auth, show modal
      setShowPasscodeModal(true);
      setIsLoading(false);
    }
  }, [token, navigate]);

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();

    if (passcode === ADMIN_PASSCODE) {
      // Store authentication state
      sessionStorage.setItem("adminAuth", ADMIN_PASSCODE);
      sessionStorage.setItem("adminAuthTime", Date.now().toString());

      setIsAuthenticated(true);
      setShowPasscodeModal(false);
      setPasscode("");
      setPasscodeError("");
    } else {
      setPasscodeError("Invalid passcode. Please try again.");
      setPasscode("");
    }
  };

  const handleModalClose = () => {
    navigate("/", { replace: true });
  };

  const handlePasscodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 6) {
      setPasscode(value);
      setPasscodeError("");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    sessionStorage.removeItem("adminAuthTime");
    navigate("/", { replace: true });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If authenticated, show admin dashboard
  if (isAuthenticated) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Show passcode modal
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Admin Authentication Required</h3>
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
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 text-sm">
                You must enter the admin passcode to access this protected area
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="passcode" className="block text-sm font-medium text-gray-700 mb-2">
                6-Digit Passcode
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
                Authenticate
              </button>
            </div>
          </form>

          {/* Warning Footer */}
          <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200 rounded-b-xl">
            <p className="text-xs text-yellow-800 text-center">
              🔐 Unauthorized access is prohibited
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedAdminRoute;
