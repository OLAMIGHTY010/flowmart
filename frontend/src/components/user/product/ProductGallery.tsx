import { useState, useEffect } from "react";

interface Props {
  images: string[];
}

export default function ProductGallery({
  images,
}: Props) {
  const [selected, setSelected] = useState(images[0]);

  // Sync state if images array changes
  useEffect(() => {
    setSelected(images[0]);
  }, [images]);

  return (
    <div className="flex flex-col gap-4">
      {/* Large image display */}
      <div className="flex items-center justify-center h-[250px] md:h-[450px] w-full rounded-xl border border-gray-200 bg-white  overflow-hidden">
        <img
          src={selected}
          alt="Product gallery display"
          className="h-full max-w-full object-cover transition duration-300 hover:scale-105"
        />
      </div>

      {/* Thumbnail images selection */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {images.map((image, index) => {
            const isSelected = selected === image;
            return (
              <button
                key={index}
                onClick={() => setSelected(image)}
                className={`flex-shrink-0 rounded-lg border-2 bg-white p-1 transition overflow-hidden h-20 w-20 cursor-pointer ${
                  isSelected
                    ? "border-orange-500 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <img
                  src={image}
                  alt={`Product thumbnail ${index + 1}`}
                  className="h-full w-full object-contain"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}