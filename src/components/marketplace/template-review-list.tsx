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
    return <p className="text-sm text-slate-600">No reviews yet.</p>;
  }

  return (
    <div className="space-y-2">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">Rating: {review.rating}/5</p>
          {review.comment ? <p className="mt-1 text-sm text-slate-700">{review.comment}</p> : null}
          <p className="mt-1 text-xs text-slate-500">{new Date(review.createdAt).toLocaleString()}</p>
        </article>
      ))}
    </div>
  );
}
