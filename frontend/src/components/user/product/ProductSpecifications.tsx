interface Props {
  sku?: string;
  category?: string;
  description?: string;
}

export default function ProductSpecifications({
  sku,
  category,
  description,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Description */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Product Description
          </h2>

          <div className="max-h-[350px] overflow-y-auto pr-2">
            <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
              {description ||
                "No description available for this product."}
            </p>
          </div>
        </div>

        {/* Specifications */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Specifications
          </h2>

          <div className="">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="text-sm font-medium text-gray-500">
                SKU
              </span>

              <span className="text-sm font-semibold text-gray-900">
                {sku || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-gray-500">
                Category
              </span>

              <span className="text-sm font-semibold text-gray-900">
                {category || "General"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}