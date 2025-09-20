const ProduceCard = ({ item, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md overflow-hidden transform transition-transform hover:scale-105 cursor-pointer active:scale-95"
    >
      {/* Content */}
      <div className="p-3 text-center">
        {/* Name: clamp to 2 lines */}
        <h3 className="font-bold text-gray-800 text-sm line-clamp-2">{item.name}</h3>

        {/* PLU Code */}
        <p className="text-md text-blue-500 font-mono mt-1">{item.plu_code}</p>

        {/* Description: clamp to 2 lines */}
        <p className="text-xs text-gray-500 font-mono mt-1 line-clamp-2">{item.description}</p>
      </div>
    </div>
  );
};

export default ProduceCard;
