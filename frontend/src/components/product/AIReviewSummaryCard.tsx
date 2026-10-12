import { useState, useEffect } from 'react';
import { Sparkles, ThumbsUp, AlertCircle, Star } from 'lucide-react';
import { aiServices, type ReviewAISummary } from '@/services/AIServices';

interface Props {
  productId: string;
}

export default function AIReviewSummaryCard({ productId }: Props) {
  const [summary, setSummary] = useState<ReviewAISummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchSummary() {
      try {
        setLoading(true);
        const data = await aiServices.getProductReviewSummary(productId);
        if (isMounted) setSummary(data);
      } catch (e) {
        // Fallback silently if unavailable
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (productId) {
      fetchSummary();
    }

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/50 p-5 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!summary || summary.totalReviews === 0) {
    return null;
  }

  return (
    <div className="mb-8 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600">
            <Sparkles className="h-4 w-4" />
          </span>
          <h3 className="text-base font-bold text-gray-900">AI Customer Feedback Digest</h3>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <ThumbsUp className="h-3 w-3" />
          {summary.sentimentBreakdown.positivePercent}% Positive Consensus
        </span>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed font-normal">
        {summary.overallVerdict}
      </p>

      {/* Pros & Cons Grid */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 pt-3 border-t border-gray-100">
        {/* Pros */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            Top Highlights
          </span>
          <ul className="space-y-1 text-xs text-gray-600">
            {summary.topPros.map((pro, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        {summary.topCons && summary.topCons.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
              Things to Note
            </span>
            <ul className="space-y-1 text-xs text-gray-600">
              {summary.topCons.map((con, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Aspect Ratings Bar */}
      {summary.aspectRatings && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-700">Quality:</span>
            <span className="flex text-amber-500 font-bold items-center">
              {summary.aspectRatings.productQuality}/5 <Star className="h-3 w-3 fill-amber-400 stroke-none ml-0.5" />
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-700">Delivery:</span>
            <span className="flex text-amber-500 font-bold items-center">
              {summary.aspectRatings.deliverySpeed}/5 <Star className="h-3 w-3 fill-amber-400 stroke-none ml-0.5" />
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-700">Value:</span>
            <span className="flex text-amber-500 font-bold items-center">
              {summary.aspectRatings.valueForMoney}/5 <Star className="h-3 w-3 fill-amber-400 stroke-none ml-0.5" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
