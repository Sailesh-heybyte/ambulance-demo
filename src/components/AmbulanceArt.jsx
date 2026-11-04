export default function AmbulanceArt({ blob = true }) {
  return (
       <svg
      viewBox="0 70 1000 1030"
      role="img"
      aria-label="Ambulance"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* soft orange shape behind the ambulance */}
     {blob && (
  <path
  d="M-40 122L0 122C6 117 26 101 40 95C53 88 66 85 80 84C93 82 106 83 120 85C133 86 146 89 160 94C173 98 186 104 200 110C213 116 220 120 240 130C260 140 293 158 320 170C346 181 373 189 400 197C426 204 453 209 480 215C506 220 533 224 560 230C586 235 613 240 640 247C666 253 693 259 720 269C746 278 780 293 800 304C820 314 826 321 840 333C853 344 869 360 880 375C890 389 898 405 904 420C909 434 912 446 914 460C915 473 916 486 915 500C913 513 911 526 907 540C902 553 895 565 888 580C881 595 873 610 865 630C856 649 846 673 835 695C823 716 810 738 795 760C780 781 760 808 745 825C729 842 716 849 704 862C691 874 683 887 671 900C659 913 646 926 632 940C617 953 601 966 582 980C562 993 540 1007 517 1020C493 1032 466 1045 440 1055C413 1064 386 1072 360 1076C333 1080 306 1080 280 1079C253 1077 226 1072 200 1065C173 1057 146 1049 120 1036C93 1023 60 1001 40 987C20 972 6 956 0 950L-40 950Z"
  fill="#c07946"
  opacity="0.4"
/>
)}

      {/* speed lines */}
      <g stroke="#e3e6ee" strokeWidth="9" strokeLinecap="round" opacity="0.9">
        <line x1="145" y1="484" x2="205" y2="484" />
        <line x1="72" y1="507" x2="106" y2="507" />
        <line x1="95" y1="536" x2="186" y2="536" strokeWidth="13" />
        <line x1="72" y1="567" x2="138" y2="567" />
        <line x1="72" y1="594" x2="184" y2="594" />
        <line x1="90" y1="629" x2="194" y2="629" />
        <line x1="72" y1="661" x2="126" y2="661" strokeWidth="12" />
        <line x1="72" y1="693" x2="172" y2="693" />
        <line x1="156" y1="718" x2="184" y2="718" />
      </g>

      {/* ground shadow */}
      <ellipse cx="595" cy="828" rx="340" ry="17" fill="#000" opacity="0.2" />

      {/* body */}
      <path
        d="M250 443H800Q815 445 828 458L955 640Q963 652 963 665V750Q963 770 945 772H250Q228 770 228 748V465Q228 443 250 443Z"
        fill="#fff"
      />
      <path d="M250 450L372 445L474 660H333Z" fill="#e4404a" />
      <rect x="228" y="662" width="735" height="38" fill="#e4404a" />
      <path d="M236 770H948" stroke="#263459" strokeWidth="9" strokeLinecap="round" />
      <circle cx="274" cy="467" r="9" fill="#7fd1e8" />
      <circle cx="306" cy="467" r="9" fill="#f59a3d" />

      {/* star of life */}
      <circle cx="398" cy="553" r="52" fill="#fff" />
      <g fill="#2a5cc2">
        <rect x="391" y="514" width="14" height="78" rx="6" />
        <rect x="391" y="514" width="14" height="78" rx="6" transform="rotate(60 398 553)" />
        <rect x="391" y="514" width="14" height="78" rx="6" transform="rotate(120 398 553)" />
      </g>

      {/* side door */}
      <rect x="494" y="472" width="192" height="262" rx="12" fill="#eceef7" stroke="#b6bbd0" strokeWidth="4" opacity="0.95" />
      <rect x="538" y="494" width="104" height="104" rx="14" fill="#7fd6ea" />
      <g stroke="#fff" strokeWidth="12" opacity="0.45">
        <line x1="570" y1="598" x2="620" y2="494" />
        <line x1="600" y1="598" x2="642" y2="510" />
      </g>
      <rect x="634" y="632" width="38" height="9" rx="4" fill="#263459" />

      {/* driver window */}
      <path d="M730 472H806Q815 474 820 484L866 566V596H726V478Q726 472 730 472Z" fill="#263459" />
      <path d="M736 480H802L852 572V586H736Z" fill="#59c4e0" />
      <g stroke="#fff" strokeWidth="10" opacity="0.4">
        <line x1="750" y1="586" x2="790" y2="480" />
        <line x1="782" y1="586" x2="822" y2="500" />
      </g>
      <rect x="723" y="632" width="38" height="9" rx="4" fill="#263459" />

      {/* front stripes and lights */}
      <g stroke="#fff" strokeWidth="7" strokeLinecap="round">
        <line x1="790" y1="696" x2="814" y2="664" />
        <line x1="814" y1="696" x2="838" y2="664" />
        <line x1="838" y1="696" x2="862" y2="664" />
      </g>
      <rect x="943" y="718" width="22" height="28" rx="6" fill="#f5a04b" />
      <circle cx="254" cy="736" r="11" fill="#f5a04b" />

      {/* sirens */}
      <path d="M664 443V433Q664 419 685 419Q706 419 706 433V443Z" fill="#e4404a" />
      <rect x="740" y="418" width="32" height="25" rx="6" fill="#3b52c4" />

      {/* wheels */}
      <circle cx="357" cy="775" r="54" fill="#263459" />
      <circle cx="357" cy="775" r="31" fill="#c9cce0" />
      <circle cx="837" cy="775" r="54" fill="#263459" />
      <circle cx="837" cy="775" r="31" fill="#c9cce0" />
    </svg>
  );
}