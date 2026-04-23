export const renderStars = (rating: number, size: string = "size-5", svgPaths: any) => {
  return Array.from({ length: 5 }, (_, i) => (
    <div key={i} className={`relative shrink-0 ${size}`}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g>
          <path d="M20 20H0V0H20V20Z" stroke="var(--stroke-0, #FCD34D)" />
          <path
            d={svgPaths.p1cb8a680}
            stroke={i < Math.floor(rating) ? "var(--stroke-0, #FCD34D)" : "var(--stroke-0, #E5E7EB)"}
            fill={i < Math.floor(rating) ? "#FCD34D" : "none"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.66667"
          />
        </g>
      </svg>
    </div>
  ));
};

export const getCategoryTranslationKey = (category: string) => {
  switch (category) {
    case 'Smartphones':
      return 'categories.smartphones';
    case 'Laptops':
      return 'categories.laptops';
    case 'Headphones':
      return 'categories.headphones';
    case 'Gaming':
      return 'categories.gaming';
    default:
      return 'categories.smartphones';
  }
};