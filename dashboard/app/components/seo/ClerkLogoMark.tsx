/** Clerk logo arcs — keep in sync with public/clerk logo.svg */
export function ClerkLogoMark({ size = 119 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 119 119" fill="none" aria-hidden>
      <path
        d="M47 107C27 107 12 92 12 72"
        stroke="#3D82FE"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <path
        d="M12 47C12 27 27 12 47 12"
        stroke="#26DE8C"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <path
        d="M72 12C92 12 107 27 107 47"
        stroke="#34D186"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <path
        d="M107 72C107 102 77 107 57 77"
        stroke="#FCDF04"
        strokeWidth="24"
        strokeLinecap="round"
      />
    </svg>
  )
}
