const Toast = ({ message, type, onClose }) => {
  const bgColor = type === "error" ? "bg-red-100" : "bg-green-100";
  const textColor = type === "error" ? "text-red-800" : "text-green-800";
  const borderColor = type === "error" ? "border-red-200" : "border-green-200";

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div
        className={`${bgColor} ${textColor} ${borderColor} border rounded-lg p-4 shadow-lg transition-all duration-300 transform`}
      >
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">{message}</p>
          <button
            onClick={onClose}
            className={`ml-3 ${textColor} hover:opacity-70 transition-opacity`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
};

export default Toast;
