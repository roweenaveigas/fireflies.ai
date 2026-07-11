export function FirefliesLogo({
  className = "",
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M7 3.5C7 2.67 7.67 2 8.5 2H12v6.5c0 .83-.67 1.5-1.5 1.5H7V3.5Z"
          fill="#A78BFA"
        />
        <path
          d="M12 2h3.5C16.33 2 17 2.67 17 3.5V8H13.5C12.67 8 12 7.33 12 6.5V2Z"
          fill="#7C3AED"
        />
        <path
          d="M7 10h5v5.5c0 .83-.67 1.5-1.5 1.5H8.5C7.67 17 7 16.33 7 15.5V10Z"
          fill="#8B5CF6"
        />
        <path
          d="M12 10h5v4.5c0 .83-.67 1.5-1.5 1.5H12V10Z"
          fill="#6C5CE7"
        />
        <path
          d="M9 18h3v3.5c0 .83-.67 1.5-1.5 1.5H9.5C8.67 23 8 22.33 8 21.5 8 19.57 8.9 18 9 18Z"
          fill="#C084FC"
        />
        <path
          d="M12 18h2.5c.83 0 1.5.67 1.5 1.5S15.33 21 14.5 21H12v-3Z"
          fill="#A855F7"
        />
      </svg>
      {showWordmark ? (
        <span className="text-[15px] font-semibold tracking-tight text-ff-text">
          fireflies.ai
        </span>
      ) : null}
    </span>
  );
}
