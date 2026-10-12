import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBag,
  Star,
  ArrowRight,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { AIServices, type RecommendationProduct } from '@/services/AIServices';

export default function AIRecommendedFeed() {
  const [recommendations, setRecommendations] = useState<RecommendationProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchFeed = async () => {
      try {
        const feed = await AIServices.getPersonalizedRecommendations(8);
        if (mounted && feed?.length > 0) {
          setRecommendations(feed);
        }
      } catch (err) {
        console.error('Failed to load personalized AI recommendations:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFeed();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs animate-pulse">
          <div className="h-6 w-48 bg-muted rounded-lg mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-muted/60 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  const formatNaira = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '₦0';
    return `₦${num.toLocaleString()}`;
  };

  return (
    <section className="container mx-auto px-6 py-8">
      <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" /> Personalized AI Feed
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              Recommended Specially For You
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Curated by FlowMart neural collaborative filtering based on your tastes & shopping habits
            </p>
          </div>

          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-start sm:self-auto"
          >
            Explore marketplace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recommendations.slice(0, 8).map((product) => {
            const imgUrl = Array.isArray(product.images)
              ? product.images[0]
              : typeof product.images === 'string' && product.images.startsWith('[')
              ? JSON.parse(product.images)[0]
              : product.images || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';

            const matchScore = Math.min(99, Math.round(product.recommendationScore * 100));

            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group bg-card border border-border/80 hover:border-primary/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-md"
              >
                {/* Image & Match Badge */}
                <div className="relative aspect-square w-full bg-muted/40 overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/70 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                      {matchScore > 0 ? `${matchScore}% Match` : 'Top Pick'}
                    </span>
                  </div>
                  {product.oldPrice && parseFloat(product.oldPrice) > parseFloat(product.price) && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500 text-white">
                        <Tag className="w-2.5 h-2.5 inline mr-0.5" /> Sale
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    {product.brand && (
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {product.brand}
                      </span>
                    )}
                    <h3 className="text-xs font-bold text-foreground line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-extrabold text-foreground">
                        {formatNaira(product.price)}
                      </span>
                      {product.oldPrice && (
                        <span className="text-[10px] text-muted-foreground line-through ml-1.5">
                          {formatNaira(product.oldPrice)}
                        </span>
                      )}
                    </div>
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
