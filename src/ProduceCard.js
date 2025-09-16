const ProduceCard = ({ item, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md overflow-hidden transform transition-transform hover:scale-105 cursor-pointer active:scale-95"
    >
      {/* Image Container */}
      <div className="h-32 bg-gray-100 flex items-center justify-center">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 text-center">
        <h3 className="font-bold text-gray-800 truncate text-sm">{item.name}</h3>
        <p className="text-xs text-gray-500 font-mono mt-1">PLU: {item.plu_code}</p>
      </div>
    </div>
  );
};

export default ProduceCard;
