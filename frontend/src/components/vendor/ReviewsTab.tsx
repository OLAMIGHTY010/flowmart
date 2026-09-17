import { useState } from 'react';
import Icon from '@/components/Icon';

export default function ReviewsTab() {
  const [reviews] = useState([
    { id: '1', product: 'Wireless Earbuds', user: 'Alice', rating: 5, comment: 'Great sound quality!', date: '2 days ago' },
    { id: '2', product: 'Smart Watch', user: 'Bob', rating: 4, comment: 'Good battery life but UI is a bit clunky.', date: '1 week ago' },
    { id: '3', product: 'Power Bank', user: 'Charlie', rating: 5, comment: 'Saved me so many times!', date: '2 weeks ago' },
  ]);

  return (
    <div className="flex-1 lg:mt-0 lg:rounded-none bg-background flex flex-col gap-6 px-5 lg:px-8 pt-6 pb-24 lg:pb-8 -mt-4 rounded-t-3xl animate-in fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-headings font-extrabold text-foreground">Customer Reviews</h2>
        <div className="flex items-center gap-2 text-yellow-500 font-extrabold bg-yellow-50 px-4 py-2 rounded-xl">
          <Icon i="star" size={20} className="fill-current" /> 4.8 Average
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-foreground">{review.product}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="font-semibold text-primary">{review.user}</span> • {review.date}
                </div>
              </div>
              <div className="flex gap-1 text-yellow-500">
                {[1,2,3,4,5].map(star => (
                  <Icon key={star} i="star" size={14} className={star <= review.rating ? 'fill-current' : 'text-gray-300'} />
                ))}
              </div>
            </div>
            <p className="text-sm text-foreground/80 bg-background p-3 rounded-xl border border-border">"{review.comment}"</p>
            <div className="mt-3 text-right">
              <button className="text-xs font-bold text-primary hover:underline">Reply to Customer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
