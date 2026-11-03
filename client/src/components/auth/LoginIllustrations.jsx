export function AdminIllustration() {
  return (
    <svg
      viewBox="0 0 460 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="login-svg-art admin-svg"
      role="img"
      aria-label="College Administration & Campus Architecture Visual"
    >
      <defs>
        <linearGradient id="adminSkyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="pillarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#E2D9EE" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#C5B9D7" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="domeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Soft Glow Aura */}
      <circle cx="230" cy="130" r="110" fill="url(#adminSkyGrad)" filter="url(#softGlow)" />

      {/* Decorative Ground Plaza Grid */}
      <ellipse cx="230" cy="225" rx="190" ry="22" fill="#FFFFFF" fillOpacity="0.06" />
      <ellipse cx="230" cy="225" rx="140" ry="14" fill="#FFFFFF" fillOpacity="0.08" />

      {/* Neoclassical Plinth Base */}
      <rect x="90" y="210" width="280" height="10" rx="3" fill="#E2D9EE" fillOpacity="0.4" />
      <rect x="105" y="202" width="250" height="8" rx="2" fill="#E2D9EE" fillOpacity="0.55" />
      <rect x="115" y="196" width="230" height="6" rx="2" fill="#FFFFFF" fillOpacity="0.7" />

      {/* Columns (4 Classical Pillars) */}
      {/* Pillar 1 */}
      <rect x="135" y="115" width="16" height="81" rx="2" fill="url(#pillarGrad)" />
      <rect x="131" y="112" width="24" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
      <rect x="131" y="193" width="24" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.8" />

      {/* Pillar 2 */}
      <rect x="185" y="115" width="16" height="81" rx="2" fill="url(#pillarGrad)" />
      <rect x="181" y="112" width="24" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
      <rect x="181" y="193" width="24" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.8" />

      {/* Pillar 3 */}
      <rect x="259" y="115" width="16" height="81" rx="2" fill="url(#pillarGrad)" />
      <rect x="255" y="112" width="24" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
      <rect x="255" y="193" width="24" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.8" />

      {/* Pillar 4 */}
      <rect x="309" y="115" width="16" height="81" rx="2" fill="url(#pillarGrad)" />
      <rect x="305" y="112" width="24" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
      <rect x="305" y="193" width="24" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.8" />

      {/* Center Grand Entrance Arch */}
      <path
        d="M214 196 V145 Q230 133 246 145 V196 Z"
        fill="#1E1238"
        fillOpacity="0.65"
      />
      <circle cx="230" cy="155" r="4" fill="#FBBF24" fillOpacity="0.8" />

      {/* Classical Entablature & Pediment (Triangle Roof) */}
      <rect x="120" y="104" width="220" height="8" rx="2" fill="#FFFFFF" fillOpacity="0.85" />
      <polygon points="110,104 230,55 350,104" fill="url(#pillarGrad)" />
      <polygon points="122,100 230,58 338,100" fill="#2E1A47" fillOpacity="0.3" />

      {/* Grand Central Cupola Dome */}
      <path
        d="M205 55 Q230 20 255 55 Z"
        fill="url(#domeGrad)"
      />
      <rect x="228" y="12" width="4" height="14" fill="#FBBF24" />
      <circle cx="230" cy="11" r="3" fill="#FBBF24" />

      {/* Floating Institutional Badge: NAAC A++ / Governance */}
      <g transform="translate(45, 60)">
        <rect width="105" height="42" rx="10" fill="#FFFFFF" fillOpacity="0.12" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1" />
        <circle cx="22" cy="21" r="11" fill="url(#shieldGrad)" />
        <path d="M22 14 L24.5 19 L30 19.8 L26 23.7 L27 29 L22 26.2 L17 29 L18 23.7 L14 19.8 L19.5 19 Z" fill="#FFFFFF" transform="scale(0.55) translate(8, 7)" />
        <text x="38" y="18" fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="sans-serif">INSTITUTION</text>
        <text x="38" y="30" fill="#A78BFA" fontSize="8" fontWeight="600" fontFamily="sans-serif">A++ Accredited</text>
      </g>

      {/* Floating Workload Metric Node */}
      <g transform="translate(310, 48)">
        <rect width="112" height="44" rx="10" fill="#FFFFFF" fillOpacity="0.12" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1" />
        <circle cx="22" cy="22" r="12" fill="#10B981" fillOpacity="0.3" stroke="#10B981" strokeWidth="1.5" />
        <path d="M17 22 L20 25 L27 18" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="40" y="19" fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="sans-serif">ALLOCATION</text>
        <text x="40" y="31" fill="#34D399" fontSize="8.5" fontWeight="700" fontFamily="sans-serif">100% Balanced</text>
      </g>

      {/* Floating Audit Metric Card (Bottom Left) */}
      <g transform="translate(30, 160)">
        <rect width="90" height="36" rx="8" fill="#FFFFFF" fillOpacity="0.1" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1" />
        <text x="12" y="16" fill="#E2D9EE" fontSize="8" fontWeight="700" fontFamily="sans-serif">ACTIVE MENTORS</text>
        <text x="12" y="28" fill="#FBBF24" fontSize="11" fontWeight="800" fontFamily="sans-serif">Verified Faculty</text>
      </g>
    </svg>
  );
}

export function MentorIllustration() {
  return (
    <svg
      viewBox="0 0 460 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="login-svg-art mentor-svg"
      role="img"
      aria-label="Faculty Mentor & Student Collaboration Visual"
    >
      <defs>
        <linearGradient id="mentorAuraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.06" />
        </linearGradient>
        <filter id="mentorGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Aura background glow */}
      <circle cx="230" cy="130" r="115" fill="url(#mentorAuraGrad)" filter="url(#mentorGlow)" />

      {/* Modern Mentoring Desk / Workstation Surface */}
      <rect x="90" y="180" width="280" height="12" rx="6" fill="#FFFFFF" fillOpacity="0.18" />
      <ellipse cx="230" cy="225" rx="170" ry="18" fill="#FFFFFF" fillOpacity="0.05" />

      {/* Central Interactive Academic Monitor / Tablet */}
      <rect x="155" y="85" width="150" height="98" rx="10" fill="#1C1E3E" stroke="#818CF8" strokeWidth="2" />
      <rect x="165" y="95" width="130" height="78" rx="6" fill="#0F172A" />

      {/* Monitor Display: Growth Curve & Student KPI Bar */}
      <path
        d="M175 145 Q195 140 215 125 T255 110 T285 105"
        stroke="url(#chartGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Area under curve */}
      <path
        d="M175 145 Q195 140 215 125 T255 110 T285 105 V155 H175 Z"
        fill="url(#chartGrad)"
        fillOpacity="0.15"
      />
      {/* Metric dots */}
      <circle cx="215" cy="125" r="3.5" fill="#34D399" />
      <circle cx="255" cy="110" r="3.5" fill="#60A5FA" />
      <circle cx="285" cy="105" r="4" fill="#FBBF24" />

      {/* Monitor Stand */}
      <rect x="223" y="183" width="14" height="18" fill="#94A3B8" />
      <rect x="210" y="200" width="40" height="5" rx="2.5" fill="#CBD5E1" />

      {/* Mentor Silhouette / Avatar Node (Left) */}
      <g transform="translate(100, 105)">
        <circle cx="30" cy="25" r="16" fill="#818CF8" />
        <path d="M12 65 C12 48 20 44 30 44 C40 44 48 48 48 65 Z" fill="#6366F1" />
        <circle cx="30" cy="7" r="5" fill="#FBBF24" />
        {/* Mentor Glasses / Tie hint */}
        <rect x="27" y="47" width="6" height="12" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
      </g>

      {/* Student Silhouette / Avatar Node (Right) */}
      <g transform="translate(300, 115)">
        <circle cx="30" cy="22" r="14" fill="#34D399" />
        <path d="M14 58 C14 44 21 40 30 40 C39 40 46 44 46 58 Z" fill="#059669" />
        {/* Graduation cap */}
        <polygon points="18,12 30,7 42,12 30,17" fill="#FBBF24" />
      </g>

      {/* Floating Guidance Badge (Top Left) */}
      <g transform="translate(35, 45)">
        <rect width="118" height="42" rx="10" fill="url(#cardGrad)" stroke="#818CF8" strokeOpacity="0.4" strokeWidth="1" />
        <circle cx="22" cy="21" r="11" fill="#818CF8" fillOpacity="0.25" />
        <path d="M22 15 V23 M18 19 H26" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />
        <text x="38" y="18" fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="sans-serif">MENTOR ADVISORY</text>
        <text x="38" y="30" fill="#34D399" fontSize="8" fontWeight="600" fontFamily="sans-serif">Bi-Weekly Review Active</text>
      </g>

      {/* Floating Dual Role Badge (Top Right) */}
      <g transform="translate(305, 45)">
        <rect width="120" height="42" rx="10" fill="url(#cardGrad)" stroke="#34D399" strokeOpacity="0.4" strokeWidth="1" />
        <circle cx="22" cy="21" r="11" fill="#10B981" fillOpacity="0.2" />
        <text x="18" y="25" fill="#34D399" fontSize="12" fontWeight="800">★</text>
        <text x="38" y="18" fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="sans-serif">COORDINATOR</text>
        <text x="38" y="30" fill="#93C5FD" fontSize="8" fontWeight="600" fontFamily="sans-serif">Section Supervision</text>
      </g>

      {/* Floating Dossier Verification Badge (Bottom Right) */}
      <g transform="translate(290, 175)">
        <rect width="128" height="34" rx="8" fill="#FFFFFF" fillOpacity="0.1" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1" />
        <text x="12" y="15" fill="#E2E8F0" fontSize="8" fontWeight="700" fontFamily="sans-serif">STUDENT DOSSIERS</text>
        <text x="12" y="26" fill="#FBBF24" fontSize="9" fontWeight="800" fontFamily="sans-serif">100% Verified Progress</text>
      </g>
    </svg>
  );
}

export function StudentIllustration() {
  return (
    <svg
      viewBox="0 0 460 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="login-svg-art student-svg"
      role="img"
      aria-label="Student Learning & Academic Growth Visual"
    >
      <defs>
        <linearGradient id="studentAuraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="bookCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <filter id="studentGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Aura background glow */}
      <circle cx="230" cy="130" r="115" fill="url(#studentAuraGrad)" filter="url(#studentGlow)" />

      {/* Study Desk Base Surface */}
      <rect x="90" y="195" width="280" height="10" rx="5" fill="#FFFFFF" fillOpacity="0.18" />
      <ellipse cx="230" cy="225" rx="160" ry="16" fill="#FFFFFF" fillOpacity="0.06" />

      {/* Open Hardcover Academic Textbook */}
      <g transform="translate(145, 135)">
        {/* Left Book Wing */}
        <path
          d="M85 45 C50 42 20 48 5 52 V15 C20 10 50 8 85 12 Z"
          fill="#F8FAFC"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />
        {/* Right Book Wing */}
        <path
          d="M85 45 C120 42 150 48 165 52 V15 C150 10 120 8 85 12 Z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />
        {/* Book Spine Center */}
        <rect x="83" y="12" width="4" height="35" rx="1" fill="#4F46E5" />
        {/* Text lines on left page */}
        <line x1="20" y1="22" x2="70" y2="20" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="30" x2="65" y2="28" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="38" x2="60" y2="36" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        {/* Text lines on right page */}
        <line x1="100" y1="20" x2="150" y2="22" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="105" y1="28" x2="150" y2="30" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="110" y1="36" x2="145" y2="38" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Graduation Mortarboard / Cap (Floating Center-Top) */}
      <g transform="translate(200, 48)">
        {/* Diamond Top */}
        <polygon points="30,0 60,14 30,28 0,14" fill="#312E81" stroke="#818CF8" strokeWidth="1.5" />
        {/* Skull Cap Base */}
        <path d="M12 19 V30 Q30 38 48 30 V19 Z" fill="#1E1B4B" />
        {/* Golden Tassel */}
        <circle cx="30" cy="14" r="3" fill="#FBBF24" />
        <path d="M30 14 C35 18 45 22 45 34" stroke="#FBBF24" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="42" y="34" width="6" height="8" rx="2" fill="#F59E0B" />
      </g>

      {/* Left Stack of Textbooks */}
      <g transform="translate(100, 160)">
        <rect x="0" y="24" width="55" height="12" rx="2" fill="#4F46E5" />
        <rect x="4" y="14" width="52" height="11" rx="2" fill="#10B981" />
        <rect x="2" y="4" width="48" height="11" rx="2" fill="#F59E0B" />
      </g>

      {/* Modern Student Laptop with Code & Chart (Right) */}
      <g transform="translate(295, 120)">
        <rect x="5" y="10" width="65" height="42" rx="4" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
        {/* Screen Content */}
        <rect x="9" y="14" width="57" height="34" rx="2" fill="#1E293B" />
        <circle cx="16" cy="21" r="2" fill="#EF4444" />
        <circle cx="22" cy="21" r="2" fill="#F59E0B" />
        <circle cx="28" cy="21" r="2" fill="#10B981" />
        <path d="M14 38 L24 28 L36 32 L46 22 L58 26" stroke="#34D399" strokeWidth="1.5" fill="none" />
        {/* Laptop Keyboard Base */}
        <polygon points="0,52 75,52 70,57 5,57" fill="#CBD5E1" />
      </g>

      {/* Floating Target CGPA Achievement Badge (Top Left) */}
      <g transform="translate(35, 45)">
        <rect width="112" height="42" rx="10" fill="#FFFFFF" fillOpacity="0.12" stroke="#34D399" strokeOpacity="0.4" strokeWidth="1" />
        <circle cx="22" cy="21" r="11" fill="#10B981" fillOpacity="0.25" />
        <text x="17" y="25" fill="#34D399" fontSize="12" fontWeight="800">🎯</text>
        <text x="38" y="18" fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="sans-serif">TARGET CGPA</text>
        <text x="38" y="30" fill="#34D399" fontSize="8.5" fontWeight="700" fontFamily="sans-serif">9.0+ Good Standing</text>
      </g>

      {/* Floating Attendance Safe Badge (Top Right) */}
      <g transform="translate(315, 45)">
        <rect width="112" height="42" rx="10" fill="#FFFFFF" fillOpacity="0.12" stroke="#818CF8" strokeOpacity="0.4" strokeWidth="1" />
        <circle cx="22" cy="21" r="11" fill="#6366F1" fillOpacity="0.25" />
        <text x="17" y="25" fill="#A5B4FC" fontSize="11" fontWeight="800">✓</text>
        <text x="38" y="18" fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="sans-serif">ATTENDANCE</text>
        <text x="38" y="30" fill="#93C5FD" fontSize="8.5" fontWeight="700" fontFamily="sans-serif">Safe & Compliant (&gt;75%)</text>
      </g>

      {/* Floating Mentee Support Pill (Bottom Left) */}
      <g transform="translate(45, 120)">
        <rect width="85" height="32" rx="8" fill="#FFFFFF" fillOpacity="0.1" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1" />
        <text x="10" y="14" fill="#E2E8F0" fontSize="7.5" fontWeight="700" fontFamily="sans-serif">DIRECT REACH</text>
        <text x="10" y="25" fill="#FBBF24" fontSize="8.5" fontWeight="800" fontFamily="sans-serif">1-on-1 Mentor Chat</text>
      </g>
    </svg>
  );
}

