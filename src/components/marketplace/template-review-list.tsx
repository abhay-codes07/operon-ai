type TemplateReviewListProps = {
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
  }>;
};

export function TemplateReviewList({ reviews }: TemplateReviewListProps): JSX.Element {
  if (reviews.length === 0) {
    return <p className="text-sm text-slate-400">No reviews yet.</p>;
  }

  return (
    <div className="space-y-2">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-lg border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-3 backdrop-blur-sm">
          <p className="text-sm font-semibold text-white">Rating: {review.rating}/5</p>
          {review.comment ? <p className="mt-1 text-sm text-slate-300">{review.comment}</p> : null}
          <p className="mt-1 text-xs text-slate-500">{new Date(review.createdAt).toLocaleString()}</p>
        </article>
      ))}
    </div>
  );
}
