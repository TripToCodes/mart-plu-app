const ProduceCard = ({ item, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md overflow-hidden transform transition-transform hover:scale-105 cursor-pointer active:scale-95"
    >
      {/* Content */}
      <div className="p-3 text-center">
        <h3 className="font-bold text-gray-800 truncate text-sm">{item.name}</h3>
        <p className="text-md text-blue-500 font-mono mt-1">{item.plu_code}</p>
        <p className="text-xs text-gray-500 font-mono mt-1">{item.description}</p>
      </div>
    </div>
  );
};

export default ProduceCard;
