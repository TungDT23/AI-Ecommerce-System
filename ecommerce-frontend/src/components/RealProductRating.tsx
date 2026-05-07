import React, { useEffect, useState } from "react";

const RealProductRating: React.FC<{ productId: number }> = ({ productId }) => {
  const [rating, setRating] = useState({ average: 0, count: 0 });

  useEffect(() => {
    let isMounted = true;
    fetch(`http://localhost:8888/api/reviews/product/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const sum = data.reduce(
            (acc: any, curr: any) => acc + curr.rating,
            0,
          );
          setRating({ average: sum / data.length, count: data.length });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (rating.count === 0) {
    return (
      <div className="text-[11px] text-gray-400 font-medium mb-3 mt-1">
        Chưa có đánh giá
      </div>
    );
  }

  const roundedAvg = Math.round(rating.average);
  return (
    <div className="flex items-center gap-1 mb-3 text-[11px] mt-1">
      <span className="text-yellow-400 text-sm tracking-widest">
        {"★".repeat(roundedAvg)}
        <span className="text-gray-200">{"★".repeat(5 - roundedAvg)}</span>
      </span>
      <span className="text-blue-600 ml-1 font-bold">
        ({rating.count} đánh giá)
      </span>
    </div>
  );
};

export default RealProductRating;
