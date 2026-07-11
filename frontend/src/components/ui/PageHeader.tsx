export function ComingSoonBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-ff-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ff-purple ${className}`}
    >
      Coming Soon
    </span>
  );
}

export function PageHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ff-text">
            {title}
          </h1>
          {badge ? <ComingSoonBadge /> : null}
        </div>
        <p className="mt-1 max-w-2xl text-sm text-ff-gray">{description}</p>
      </div>
    </div>
  );
}
