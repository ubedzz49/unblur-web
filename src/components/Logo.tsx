/** The bulb mark used identically across every mockup's nav. Reused everywhere a
 * logo appears -- nav (small), landing hero (large, with the nested opacity layers). */
export function Logo({ size = 16 }: { size?: number }) {
  const height = Math.round((size * 160) / 130);
  return (
    <svg width={size} height={height} viewBox="0 0 130 160" aria-hidden="true">
      <path
        d="M65 34 C48 34 38 51 38 66 C38 79 45 87 51 96 L51 108 L79 108 L79 96 C85 87 92 79 92 66 C92 51 82 34 65 34 Z"
        fill="none"
        stroke="var(--violet)"
        strokeWidth="10"
      />
    </svg>
  );
}

export function LogoHero({ size = 60 }: { size?: number }) {
  const height = Math.round((size * 160) / 130);
  return (
    <svg width={size} height={height} viewBox="0 0 130 160" aria-hidden="true">
      <path
        className="opacity-[0.14]"
        d="M65 18 C38 18 24 40 24 62 C24 80 33 90 42 101 L42 118 L88 118 L88 101 C97 90 106 80 106 62 C106 40 92 18 65 18 Z"
        fill="none"
        stroke="var(--paper)"
        strokeWidth="3"
      />
      <path
        className="opacity-[0.32]"
        d="M65 26 C43 26 31 46 31 65 C31 81 39 90 47 100 L47 114 L83 114 L83 100 C91 90 99 81 99 65 C99 46 87 26 65 26 Z"
        fill="none"
        stroke="var(--paper)"
        strokeWidth="3"
      />
      <path
        d="M65 34 C48 34 38 51 38 66 C38 79 45 87 51 96 L51 108 L79 108 L79 96 C85 87 92 79 92 66 C92 51 82 34 65 34 Z"
        fill="none"
        stroke="var(--violet)"
        strokeWidth="3.5"
      />
      <rect x="53" y="122" width="24" height="6" rx="2" fill="var(--paper)" opacity="0.7" />
    </svg>
  );
}
