import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Star, CheckCircle2, Loader2 } from "lucide-react";
import { UserInput } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productServices } from "@/services/ProductServices";

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);

  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => productServices.getReviews(productId),
  });

  const postReviewMutation = useMutation({
    mutationFn: (reviewData: any) => productServices.postReview(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      setReviewText("");
      setRating(5);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    postReviewMutation.mutate({
      productId,
      userId: user.id,
      user: user.fullName || "User",
      avatar: user.avatar || "https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?w=150&h=150&fit=crop&crop=faces",
      rating,
      content: reviewText,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      verifiedPurchase: true
    });
  };

  return (
    <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

      {/* Review Form - Only for verified users */}
      <div className="mb-10 rounded-xl bg-gray-50 p-6 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Write a Review</h3>
        
        {!user ? (
          <p className="text-sm text-gray-500">
            Please log in to leave a review.
          </p>
        ) : !user.isVerified ? (
          <div className="flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-100">
            <CheckCircle2 size={16} />
            Only verified users can post a review. Please verify your account in your profile settings.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Your Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none cursor-pointer"
                  >
                    <Star
                      size={24}
                      className={star <= rating ? "fill-orange-400 text-orange-400" : "text-gray-300"}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <UserInput
                label="Your Review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you like or dislike?"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={!reviewText.trim() || postReviewMutation.isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {postReviewMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : "Submit Review"}
            </button>
          </form>
        )}
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-xl">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={review.avatar}
                    alt={review.user}
                    className="h-10 w-10 rounded-full bg-gray-100 object-cover border border-gray-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{review.user}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            className={star <= review.rating ? "fill-orange-400 text-orange-400" : "text-gray-200"}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">• {review.date}</span>
                    </div>
                  </div>
                </div>
                
                {review.verifiedPurchase && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                    <CheckCircle2 size={12} />
                    Verified Purchase
                  </div>
                )}
              </div>
              
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                {review.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
