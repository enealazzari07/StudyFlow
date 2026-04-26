// StudyFlow — Shared UI Primitives
// Icons, doodles, dock, AI assistant, sticky notes, live cursors

// ═══════════════════════════════════════════════════════════════
// ICONS (feather-style, 1.75 stroke)
// ═══════════════════════════════════════════════════════════════
const Icon = ({ d, size = 20, stroke = 1.75, fill = "none", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {d && <path d={d} />}
    {children}
  </svg>
);

const Icons = {
  Home: (p) => <Icon {...p}><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></Icon>,
  Cards: (p) => <Icon {...p}><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M7 9h6M7 13h4"/><path d="M17 7l4 1-2 13-4-1"/></Icon>,
  Sparkles: (p) => <Icon {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 14l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" strokeWidth="1.3"/></Icon>,
  Users: (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="7" r="2.5" strokeWidth="1.3"/><path d="M16 14c3 0 6 2 6 5" strokeWidth="1.3"/></Icon>,
  Upload: (p) => <Icon {...p}><path d="M12 15V4"/><path d="M7 9l5-5 5 5"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></Icon>,
  Doc: (p) => <Icon {...p}><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008.91 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8.91a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></Icon>,
  Chart: (p) => <Icon {...p}><path d="M3 3v18h18"/><path d="M7 14l4-4 4 3 6-7"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  Play: (p) => <Icon {...p}><path d="M6 4l14 8-14 8V4z" fill="currentColor"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M5 12l5 5L20 7"/></Icon>,
  X: (p) => <Icon {...p}><path d="M6 6l12 12M18 6l-12 12"/></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>,
  ArrowLeft: (p) => <Icon {...p}><path d="M19 12H5M11 19l-7-7 7-7"/></Icon>,
  Chevron: (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  Brain: (p) => <Icon {...p}><path d="M9.5 3A3.5 3.5 0 006 6.5V7a3 3 0 00-1 5.83V14a3 3 0 003 3v1a3 3 0 006 0v-1a3 3 0 003-3v-1.17A3 3 0 0018 7v-.5A3.5 3.5 0 0014.5 3a3.5 3.5 0 00-5 0z"/><path d="M12 7v10" strokeWidth="1.2"/></Icon>,
  Bolt: (p) => <Icon {...p}><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"/></Icon>,
  Star: (p) => <Icon {...p}><path d="M12 3l2.8 6 6.2.8-4.5 4.4 1.1 6.3L12 17.5 6.4 20.5l1.1-6.3L3 9.8 9.2 9z"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 004 0"/></Icon>,
  Bookmark: (p) => <Icon {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></Icon>,
  Share: (p) => <Icon {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></Icon>,
  Folder: (p) => <Icon {...p}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></Icon>,
  MoreH: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></Icon>,
  Edit: (p) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4z"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></Icon>,
  Flip: (p) => <Icon {...p}><path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/><path d="M3 21v-5h5"/></Icon>,
  Eye: (p) => <Icon {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></Icon>,
  Lock: (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></Icon>,
  Mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></Icon>,
  Google: (p) => (
    <svg width={p?.size || 100} height={p?.size ? p.size * 0.33 : 33} viewBox="0 0 100 33" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
      <g clipPath="url(#clip0_9_237)">
        <path d="M12.3154 0.00289917H13.2047C16.2919 0.0700133 19.3289 1.31162 21.5101 3.50961C20.7047 4.33176 19.8826 5.12035 19.094 5.9425C17.8691 4.83511 16.3926 3.97941 14.7819 3.6774C12.3993 3.17404 9.83222 3.62706 7.83557 4.98612C5.65436 6.4123 4.17785 8.8284 3.85906 11.4123C3.50671 13.9626 4.22819 16.6472 5.88926 18.6271C7.48322 20.5566 9.91611 21.7646 12.4329 21.8485C14.7819 21.9828 17.2315 21.2613 18.943 19.617C20.2852 18.4593 20.906 16.6975 21.1074 14.9861C18.3221 14.9861 15.5369 15.0029 12.7517 14.9861V11.5297H24.4799C25.0839 15.2378 24.2114 19.4157 21.3926 22.0667C19.5134 23.9459 16.9128 25.0532 14.2617 25.2714C11.6946 25.523 9.04363 25.0365 6.76175 23.7948C4.02685 22.3351 1.84564 19.8687 0.771812 16.966C-0.234899 14.2982 -0.251678 11.2781 0.68792 8.5935C1.54362 6.14384 3.18792 3.97941 5.30201 2.46934C7.33222 0.976054 9.79866 0.153906 12.3154 0.00289917Z" fill="#3780FF"/>
        <path d="M79.5974 0.875366H83.188V24.8351C81.9967 24.8351 80.7887 24.8519 79.5974 24.8183C79.6142 16.8485 79.5974 8.86194 79.5974 0.875366Z" fill="#38B137"/>
        <path d="M32.4664 9.18073C34.6812 8.76127 37.0805 9.23106 38.9094 10.5566C40.5705 11.7311 41.7282 13.5767 42.0805 15.5901C42.5336 17.9223 41.9631 20.4727 40.453 22.3183C38.8255 24.3821 36.1577 25.4895 33.5571 25.3217C31.1745 25.1874 28.8591 23.9962 27.4497 22.0499C25.8557 19.9022 25.4698 16.9492 26.3423 14.4324C27.2148 11.7311 29.6812 9.66731 32.4664 9.18073ZM32.9698 12.3686C32.0638 12.6035 31.2248 13.1237 30.6208 13.8619C28.9933 15.8082 29.094 18.9794 30.8893 20.7915C31.9128 21.8317 33.4564 22.3183 34.8826 22.0331C36.2081 21.7982 37.3658 20.9089 38.0034 19.7344C39.1107 17.7378 38.792 14.9861 37.0973 13.4257C36.0067 12.419 34.4128 11.9995 32.9698 12.3686Z" fill="#FA3913"/>
        <path d="M50.2517 9.18074C52.7853 8.69417 55.5537 9.39886 57.4497 11.1774C60.5369 13.9458 60.8725 19.1304 58.2383 22.3183C56.6443 24.3318 54.0604 25.4391 51.5101 25.3217C49.0772 25.2546 46.6779 24.0465 45.2349 22.0499C43.6074 19.8519 43.2551 16.8318 44.1779 14.2646C45.1007 11.6472 47.5168 9.65054 50.2517 9.18074ZM50.7551 12.3687C49.849 12.6036 49.0101 13.1237 48.4061 13.8452C46.7953 15.7579 46.8624 18.8787 48.5906 20.7076C49.6141 21.7982 51.2081 22.3351 52.6846 22.0331C53.9933 21.7814 55.1678 20.9089 55.8054 19.7344C56.896 17.721 56.5772 14.9693 54.8658 13.4089C53.7752 12.4022 52.1812 11.9995 50.7551 12.3687Z" fill="#FCBD06"/>
        <path d="M65.3355 10.1539C67.265 8.94585 69.8322 8.61028 71.9127 9.65054C72.5671 9.93578 73.104 10.4224 73.6241 10.9089C73.6409 10.4559 73.6241 9.98612 73.6409 9.51632C74.765 9.5331 75.8892 9.51632 77.0301 9.5331V24.3318C77.0134 26.5633 76.4429 28.9291 74.8322 30.5566C73.0704 32.3519 70.3691 32.9056 67.9362 32.5364C65.3355 32.1505 63.0704 30.2546 62.0637 27.8552C63.0704 27.3687 64.1275 26.9828 65.1677 26.5297C65.755 27.9056 66.9463 29.0801 68.4395 29.3485C69.9328 29.617 71.661 29.2479 72.6342 28.0063C73.6744 26.7311 73.6744 24.9861 73.6241 23.4257C72.8523 24.1807 71.963 24.8519 70.8892 25.1036C68.557 25.7579 65.9899 24.9526 64.1946 23.3754C62.3825 21.7982 61.3087 19.3653 61.4093 16.9492C61.4597 14.2143 63.0033 11.5801 65.3355 10.1539ZM68.8087 12.3016C67.7852 12.4693 66.8288 13.0398 66.1744 13.8284C64.5973 15.7076 64.5973 18.7109 66.1912 20.5566C67.0973 21.6472 68.557 22.2512 69.9664 22.1002C71.2919 21.966 72.5167 21.1271 73.1711 19.9693C74.2785 18.0063 74.0939 15.3385 72.6006 13.6271C71.6778 12.57 70.2013 12.0499 68.8087 12.3016Z" fill="#3780FF"/>
        <path d="M87.5 11.0096C89.5134 9.13039 92.6175 8.4928 95.2014 9.48273C97.651 10.4056 99.2114 12.7378 100 15.1371C96.3591 16.6472 92.7349 18.1405 89.094 19.6505C89.5973 20.6069 90.3691 21.4794 91.4094 21.8317C92.8691 22.3519 94.6141 22.1673 95.839 21.1941C96.3255 20.825 96.7114 20.3384 97.0806 19.8686C98.0034 20.4894 98.9262 21.0935 99.849 21.7143C98.5403 23.6774 96.3423 25.0532 93.9765 25.2713C91.3591 25.5901 88.5738 24.5834 86.8792 22.5364C84.094 19.3149 84.3624 13.9123 87.5 11.0096ZM89.2953 14.1136C88.7249 14.9358 88.49 15.9425 88.5067 16.9324C90.9396 15.9257 93.3725 14.919 95.8054 13.8955C95.4027 12.9559 94.4296 12.3854 93.4396 12.2344C91.8457 11.9492 90.1846 12.8049 89.2953 14.1136Z" fill="#FA3913"/>
      </g>
      <defs>
        <clipPath id="clip0_9_237">
          <rect width="100" height="32.64" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  ),
  Microsoft: (p) => (
    <svg width={p?.size || 100} height={p?.size ? p.size * 0.22 : 22} viewBox="0 0 100 22" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
      <g clipPath="url(#clip0_10_366)">
        <path d="M41.5384 4.26034V17.0414H39.3195V7.01182H39.2899L35.3254 17.0414H33.8461L29.7929 7.01182H29.7633V17.0414H27.7219V4.26034H30.9171L34.5858 13.7278H34.6449L38.5207 4.26034H41.5384ZM43.3728 5.23668C43.3728 4.88165 43.4911 4.58579 43.7574 4.3491C44.0236 4.11242 44.3195 3.99407 44.6745 3.99407C45.0591 3.99407 45.3846 4.11242 45.6213 4.3491C45.858 4.58579 46.0059 4.88165 46.0059 5.23668C46.0059 5.59171 45.8875 5.88756 45.6213 6.12425C45.355 6.36094 45.0591 6.47928 44.6745 6.47928C44.2899 6.47928 43.9941 6.36094 43.7574 6.12425C43.5207 5.85798 43.3728 5.56212 43.3728 5.23668ZM45.7692 7.86981V17.0414H43.6094V7.86981H45.7692ZM52.3077 15.4733C52.6331 15.4733 52.9881 15.4142 53.3727 15.2367C53.7574 15.0887 54.1124 14.8816 54.4378 14.645V16.6568C54.0828 16.8639 53.6982 17.0118 53.2544 17.1006C52.8106 17.1893 52.3373 17.2485 51.8047 17.2485C50.4438 17.2485 49.3491 16.8343 48.5207 15.9763C47.6627 15.1183 47.2485 14.0237 47.2485 12.7219C47.2485 11.2426 47.6923 10.0296 48.5503 9.08283C49.4083 8.13608 50.6213 7.66271 52.2189 7.66271C52.6331 7.66271 53.0473 7.72188 53.4319 7.81064C53.8461 7.8994 54.1716 8.04733 54.4083 8.16567V10.2366C54.0828 9.99996 53.7278 9.79289 53.4023 9.67455C53.0473 9.5562 52.6923 9.46744 52.3372 9.46744C51.4793 9.46744 50.7988 9.73369 50.2662 10.2958C49.7337 10.8579 49.497 11.5976 49.497 12.5444C49.497 13.4615 49.7633 14.2012 50.2662 14.7041C50.7692 15.2071 51.4497 15.4733 52.3077 15.4733ZM60.5621 7.72188C60.7396 7.72188 60.8875 7.72188 61.0355 7.75147C61.1834 7.78105 61.3017 7.81064 61.3905 7.84023V10.0296C61.2722 9.94082 61.1242 9.85203 60.8875 9.79286C60.6509 9.73369 60.4142 9.67455 60.0887 9.67455C59.5562 9.67455 59.1124 9.91123 58.7574 10.355C58.4023 10.7988 58.1952 11.4793 58.1952 12.426V17.0414H56.0355V7.86981H58.1952V9.31952H58.2248C58.4319 8.81656 58.7278 8.43194 59.1124 8.13608C59.5266 7.86981 60 7.72188 60.5621 7.72188ZM61.5088 12.6035C61.5088 11.0946 61.9526 9.88165 62.781 8.99407C63.639 8.1065 64.8225 7.66271 66.3313 7.66271C67.7514 7.66271 68.8757 8.07691 69.6745 8.9349C70.4733 9.79289 70.8876 10.9467 70.8876 12.3964C70.8876 13.8757 70.4438 15.0592 69.6154 15.9467C68.7574 16.8343 67.6035 17.2781 66.1242 17.2781C64.7041 17.2781 63.5799 16.8639 62.7515 16.0355C61.923 15.1775 61.5088 14.0236 61.5088 12.6035ZM63.7574 12.5148C63.7574 13.4615 63.9645 14.2012 64.4083 14.7041C64.852 15.2071 65.4733 15.4733 66.2722 15.4733C67.0414 15.4733 67.6627 15.2367 68.0769 14.7041C68.4911 14.2012 68.6982 13.4615 68.6982 12.4556C68.6982 11.4792 68.4911 10.7396 68.0769 10.2071C67.6627 9.70413 67.0414 9.43786 66.3018 9.43786C65.5029 9.43786 64.9112 9.7041 64.4674 10.2366C63.9645 10.7988 63.7574 11.5384 63.7574 12.5148ZM74.1124 10.2958C74.1124 10.5917 74.2012 10.8579 74.4083 11.0355C74.6154 11.213 75.0296 11.4201 75.71 11.6864C76.568 12.0414 77.1893 12.426 77.5148 12.8402C77.8698 13.284 78.0473 13.787 78.0473 14.4083C78.0473 15.2663 77.7219 15.9467 77.0414 16.4793C76.3905 17.0118 75.4733 17.2485 74.3491 17.2485C73.9645 17.2485 73.5503 17.1893 73.0769 17.1006C72.6035 17.0118 72.2189 16.8935 71.8935 16.7455V14.6154C72.2781 14.8816 72.7219 15.1183 73.1656 15.2662C73.6094 15.4142 74.0236 15.5029 74.4083 15.5029C74.8816 15.5029 75.2662 15.4438 75.4733 15.2958C75.71 15.1479 75.8284 14.9408 75.8284 14.6154C75.8284 14.3195 75.71 14.0828 75.4733 13.8461C75.2367 13.639 74.7633 13.4024 74.1124 13.1361C73.3136 12.8106 72.7514 12.426 72.426 12.0118C72.1006 11.5976 71.9231 11.0651 71.9231 10.4142C71.9231 9.58579 72.2485 8.90528 72.8994 8.37274C73.5503 7.8402 74.4083 7.57395 75.4438 7.57395C75.7692 7.57395 76.1242 7.60354 76.5089 7.6923C76.8935 7.78105 77.2485 7.86981 77.5148 7.95857V10.0592C77.2189 9.88165 76.8935 9.7041 76.5089 9.55617C76.1242 9.40824 75.7396 9.3491 75.3846 9.3491C74.9704 9.3491 74.6449 9.43786 74.4378 9.58579C74.2307 9.79289 74.1124 9.99996 74.1124 10.2958ZM78.9645 12.6035C78.9645 11.0946 79.4083 9.88165 80.2367 8.99407C81.0947 8.1065 82.2781 7.66271 83.787 7.66271C85.2071 7.66271 86.3313 8.07691 87.1301 8.9349C87.929 9.79289 88.3432 10.9467 88.3432 12.3964C88.3432 13.8757 87.8994 15.0592 87.071 15.9467C86.213 16.8343 85.0591 17.2781 83.5799 17.2781C82.1597 17.2781 81.0355 16.8639 80.2071 16.0355C79.4083 15.1775 78.9645 14.0236 78.9645 12.6035ZM81.213 12.5148C81.213 13.4615 81.4201 14.2012 81.8639 14.7041C82.3077 15.2071 82.929 15.4733 83.7278 15.4733C84.497 15.4733 85.1183 15.2367 85.5325 14.7041C85.9467 14.2012 86.1538 13.4615 86.1538 12.4556C86.1538 11.4792 85.9467 10.7396 85.5325 10.2071C85.1183 9.70413 84.497 9.43786 83.7574 9.43786C82.9586 9.43786 82.3668 9.7041 81.923 10.2366C81.4497 10.7988 81.213 11.5384 81.213 12.5148ZM95.5325 9.64493H92.3077V17.0414H90.1183V9.64493H88.5799V7.86981H90.1183V6.59762C90.1183 5.65088 90.4438 4.85206 91.0651 4.23076C91.6864 3.60946 92.4852 3.3136 93.4615 3.3136C93.7278 3.3136 93.9645 3.34318 94.1716 3.34318C94.3787 3.34318 94.5562 3.40236 94.7041 3.46153V5.32543C94.6449 5.29585 94.497 5.23668 94.3195 5.1775C94.142 5.11833 93.9349 5.08875 93.6982 5.08875C93.2544 5.08875 92.8994 5.23668 92.6627 5.50295C92.426 5.76922 92.3077 6.21301 92.3077 6.74555V7.84023H95.5325V5.76922L97.6923 5.11833V7.84023H99.8816V9.61537H97.6923V13.9053C97.6923 14.4674 97.8106 14.8521 97.9881 15.0887C98.1952 15.3254 98.5207 15.4438 98.9645 15.4438C99.0828 15.4438 99.2307 15.4142 99.4083 15.355C99.5858 15.2958 99.7337 15.2367 99.852 15.1479V16.9231C99.7041 17.0118 99.497 17.071 99.1716 17.1302C98.8461 17.1893 98.5503 17.2189 98.2248 17.2189C97.3077 17.2189 96.6272 16.9822 96.1834 16.5088C95.7396 16.0355 95.5029 15.2958 95.5029 14.3195L95.5325 9.64493Z" fill="#737373"/>
        <path d="M10.1183 0H0V10.1183H10.1183V0Z" fill="#F25022"/>
        <path d="M21.3017 0H11.1833V10.1183H21.3017V0Z" fill="#7FBA00"/>
        <path d="M10.1183 11.1835H0V21.3018H10.1183V11.1835Z" fill="#00A4EF"/>
        <path d="M21.3017 11.1835H11.1833V21.3018H21.3017V11.1835Z" fill="#FFB900"/>
      </g>
      <defs>
        <clipPath id="clip0_10_366">
          <rect width="100" height="21.3018" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  ),
  Notion: (p) => (
    <svg width={p?.size || 100} height={p?.size ? p.size * 0.35 : 35} viewBox="0 0 100 35" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
      <g clipPath="url(#clip0_10_425)">
        <path d="M2.07471 1.48735L21.1552 0.078148C23.4989 -0.123001 24.1011 0.0126308 25.5747 1.0839L31.6655 5.3747C32.6701 6.11263 33.0046 6.31378 33.0046 7.11723V30.6495C33.0046 32.1242 32.469 32.9966 30.5943 33.1299L8.43678 34.4713C7.02989 34.538 6.35977 34.3368 5.62299 33.3977L1.13793 27.5656C0.333333 26.492 0 25.6885 0 24.7495V3.83217C0 2.62643 0.535632 1.62068 2.07471 1.48735Z" fill="white"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M21.1552 0.078148L2.07471 1.48735C0.535632 1.62068 0 2.62643 0 3.83217V24.7495C0 25.6885 0.333333 26.492 1.13793 27.5656L5.62299 33.3977C6.35977 34.3368 7.02989 34.538 8.43678 34.4713L30.5943 33.1299C32.4678 32.9966 33.0046 32.1242 33.0046 30.6495V7.11723C33.0046 6.35516 32.7034 6.13562 31.8172 5.48505C31.7662 5.44831 31.7153 5.41153 31.6644 5.3747L25.5747 1.0839C24.1011 0.0126308 23.4989 -0.123001 21.1552 0.078148ZM8.93793 6.73217C7.12874 6.85401 6.71839 6.8816 5.6908 6.04597L3.07816 3.96781C2.81264 3.69884 2.94598 3.36321 3.61494 3.29654L21.9575 1.95631C23.4977 1.82183 24.3 2.35861 24.9023 2.82758L28.0483 5.10689C28.1828 5.1747 28.5172 5.57585 28.1149 5.57585L9.17241 6.71608L8.93793 6.73217ZM6.82874 30.4483V10.4713C6.82874 9.59884 7.09655 9.19654 7.89885 9.12873L29.6552 7.85516C30.3931 7.7885 30.7264 8.25746 30.7264 9.12873V28.9724C30.7264 29.8449 30.592 30.5828 29.3874 30.6495L8.56782 31.8564C7.36322 31.923 6.82874 31.5219 6.82874 30.4483ZM27.3805 11.5426C27.5138 12.146 27.3805 12.7495 26.777 12.8184L25.7736 13.0173V27.7667C24.9023 28.2357 24.1 28.5035 23.4299 28.5035C22.3586 28.5035 22.0908 28.1679 21.2885 27.1633L14.7264 16.8391V26.8276L16.8023 27.2977C16.8023 27.2977 16.8023 28.5046 15.1276 28.5046L10.5103 28.7724C10.3759 28.5035 10.5103 27.8334 10.9782 27.7L12.1839 27.3656V14.1587L10.5103 14.023C10.3759 13.4196 10.7103 12.5483 11.6483 12.4805L16.6023 12.1472L23.4299 22.6046V13.3529L21.6897 13.1529C21.5552 12.4138 22.0908 11.877 22.7598 11.8115L27.3805 11.5426Z" fill="black"/>
        <path d="M47.6255 24.4265V15.3345H47.7829L54.3393 24.4265H56.4036V11.0656H54.1082V20.1483H53.9508L47.3944 11.0656H45.322V24.4253H47.6266L47.6255 24.4265ZM62.891 24.6311C65.9197 24.6311 67.7623 22.6495 67.7623 19.3621C67.7623 16.0839 65.9105 14.0931 62.891 14.0931C59.8818 14.0931 58.0209 16.0931 58.0209 19.3621C58.0209 22.6495 59.8542 24.6311 62.891 24.6311ZM62.891 22.7046C61.2898 22.7046 60.3737 21.4828 60.3737 19.3621C60.3737 17.2506 61.2898 16.0196 62.891 16.0196C64.4841 16.0196 65.4002 17.2506 65.4002 19.3621C65.4002 21.4828 64.4933 22.7046 62.891 22.7046ZM69.86 11.8161V14.3621H68.2588V16.1954H69.86V21.723C69.86 23.6862 70.7864 24.4736 73.1105 24.4736C73.5542 24.4736 73.9806 24.4276 74.314 24.3621V22.5656C74.0358 22.5931 73.86 22.6115 73.5358 22.6115C72.5737 22.6115 72.1473 22.1679 72.1473 21.1679V16.1954H74.314V14.3621H72.1473V11.815H69.86V11.8161ZM75.6898 24.4265H77.9772V14.2966H75.6898V24.4265ZM76.8289 12.6219C77.5875 12.6219 78.199 12.0092 78.199 11.2415C78.199 10.4725 77.5887 9.85181 76.8289 9.85181C76.0795 9.85181 75.4588 10.4725 75.4588 11.2415C75.4588 12.0092 76.0795 12.6207 76.8289 12.6207V12.6219ZM84.2519 24.6311C87.2795 24.6311 89.122 22.6495 89.122 19.3621C89.122 16.0839 87.2703 14.0931 84.2519 14.0931C81.2416 14.0931 79.3806 16.0931 79.3806 19.3621C79.3806 22.6495 81.214 24.6311 84.2519 24.6311ZM84.2519 22.7046C82.6496 22.7046 81.7324 21.4828 81.7324 19.3621C81.7324 17.2506 82.6496 16.0196 84.2519 16.0196C85.8439 16.0196 86.7611 17.2506 86.7611 19.3621C86.7611 21.4828 85.8531 22.7046 84.2519 22.7046ZM90.4887 24.4265H92.7852V18.5288C92.7852 17.038 93.6473 16.0931 95.0163 16.0931C96.4151 16.0931 97.0623 16.8713 97.0623 18.4173V24.4265H99.36V17.8713C99.36 15.4541 98.1278 14.0931 95.8691 14.0931C94.3588 14.0931 93.3404 14.7874 92.8588 15.9173H92.7013V14.2966H90.4887V24.4265Z" fill="black"/>
      </g>
      <defs>
        <clipPath id="clip0_10_425">
          <rect width="100" height="34.4828" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  ),
  Logo: (p) => (
    <svg width={p?.size||28} height={p?.size||28} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="4" width="28" height="32" rx="3" fill="#fafaf7" stroke="#1e293b" strokeWidth="2"/>
      <rect x="8" y="4" width="24" height="32" rx="3" fill="#fff" stroke="#1e293b" strokeWidth="2"/>
      <path d="M12 14h14M12 19h14M12 24h9" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="30" cy="11" r="5" fill="#6366f1"/>
      <path d="M27.5 11l2 2 3-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════
// DOODLES (hand-drawn SVG decorations)
// ═══════════════════════════════════════════════════════════════
const Doodles = {
  Underline: ({ color = "#6366f1", w = 120 }) => (
    <svg width={w} height="10" viewBox="0 0 120 10" fill="none" style={{display:'block'}}>
      <path d="M2 6 Q 30 2, 60 5 T 118 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  Wave: ({ color = "#6366f1", w = 120 }) => (
    <svg width={w} height="8" viewBox="0 0 120 8" fill="none">
      <path d="M1 4 Q 10 1, 20 4 T 40 4 T 60 4 T 80 4 T 100 4 T 119 4" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  Circle: ({ color = "#6366f1", size = 80 }) => (
    <svg width={size} height={size*0.5} viewBox="0 0 100 50" fill="none">
      <path d="M10 25 Q 10 5, 50 6 Q 92 6, 92 25 Q 92 44, 50 44 Q 10 44, 12 26" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  Arrow: ({ color = "#6366f1", w = 60, flip = false }) => (
    <svg width={w} height={w*0.6} viewBox="0 0 60 36" fill="none" style={{transform: flip ? 'scaleX(-1)' : 'none'}}>
      <path d="M4 18 Q 20 8, 50 16" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M42 10 L 52 16 L 44 22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  Star: ({ color = "#6366f1", size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2 L 11.8 7.2 L 17.5 7.5 L 13 11 L 14.5 16.5 L 10 13.5 L 5.5 16.5 L 7 11 L 2.5 7.5 L 8.2 7.2 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  Sparkle: ({ color = "#6366f1", size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 1 L 8 6 L 13 7 L 8 8 L 7 13 L 6 8 L 1 7 L 6 6 Z" fill={color}/>
    </svg>
  ),
  Squiggle: ({ color = "#6366f1", w = 100 }) => (
    <svg width={w} height="14" viewBox="0 0 100 14" fill="none">
      <path d="M2 7 Q 8 2, 14 7 T 26 7 T 38 7 T 50 7 T 62 7 T 74 7 T 86 7 T 98 7" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  Paperclip: ({ color = "#64748b", size = 28 }) => (
    <svg width={size} height={size*1.6} viewBox="0 0 28 44" fill="none">
      <path d="M10 4 Q 4 4, 4 12 L 4 32 Q 4 40, 14 40 Q 24 40, 24 32 L 24 10 Q 24 6, 18 6 Q 12 6, 12 10 L 12 30 Q 12 34, 15 34 Q 18 34, 18 30 L 18 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════
// DOT PAPER BACKGROUND
// ═══════════════════════════════════════════════════════════════
const DotPaper = ({ children, className = "", style = {}, ...rest }) => (
  <div className={`dot-paper ${className}`} style={{ minHeight: '100%', ...style }} {...rest}>
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// STICKY NOTE
// ═══════════════════════════════════════════════════════════════
const StickyNote = ({ color = "yellow", rotate = -1.5, children, tape = false, style = {} }) => (
  <div className={`sticky-note ${color}`} style={{ transform: `rotate(${rotate}deg)`, ...style }}>
    {tape && <div className="tape"></div>}
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// DOCK (magic-ui inspired, with magnification)
// ═══════════════════════════════════════════════════════════════
const Dock = ({ items, active, onSelect }) => {
  return (
    <div className="dock">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            className={`dock-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect && onSelect(item.id)}
            type="button"
          >
            {item.icon}
            <span className="tooltip">{item.label}</span>
            {item.badge && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                background: '#6366f1', color: 'white',
                fontSize: 9.5, fontWeight: 600,
                minWidth: 14, height: 14, padding: '0 4px',
                borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white',
              }}>{item.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════════════════════════════
const AVATAR_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#8b5cf6'];
const Avatar = ({ name, size = 32, color, ring = false }) => {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const bg = color || AVATAR_COLORS[idx];
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: bg,
      color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4,
      fontWeight: 600,
      fontFamily: 'Instrument Sans',
      border: ring ? `2px solid white` : 'none',
      boxShadow: ring ? '0 0 0 1.5px rgba(15,23,42,0.1)' : 'none',
      flexShrink: 0,
    }}>{initials}</div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LIVE CURSOR
// ═══════════════════════════════════════════════════════════════
const LiveCursor = ({ x, y, name, color }) => (
  <div className="live-cursor" style={{ transform: `translate(${x}px, ${y}px)` }}>
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M5.5 3.5 L 5.5 17 L 9 13.5 L 11.5 18.5 L 13.5 17.5 L 11 12.5 L 16 12.5 Z"
        fill={color} stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
    <div className="live-cursor-label" style={{ background: color }}>{name}</div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// COLLAB AVATARS BAR (top-right, Figma-style)
// ═══════════════════════════════════════════════════════════════
const CollabAvatars = ({ users }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
    {users.map((u, i) => (
      <div key={u.name} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: users.length - i }}>
        <Avatar name={u.name} color={u.color} size={30} ring />
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// FLOATING AI ASSISTANT (bottom-right, magic)
// ═══════════════════════════════════════════════════════════════
const AIAssistant = ({ defaultOpen = false, context = "" }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState([
    { role: 'ai', text: context || 'Hi! Ich bin Flow — deine AI-Lernassistentin. Frag mich alles, oder lass mich eine Zusammenfassung oder neue Karten erstellen.' }
  ]);

  const suggestions = [
    "Erstell 10 Karten zu diesem Thema",
    "Fass das Dokument zusammen",
    "Quiz mich zu meinen schwachen Karten",
  ];

  const send = (text) => {
    const t = text || input;
    if (!t.trim()) return;
    setMessages(m => [...m, { role: 'user', text: t }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, { role: 'ai', text: 'Ich überlege… (in der finalen App ruft dies die AI-API auf und streamt die Antwort)' }]);
    }, 600);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="float"
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 80,
            width: 58, height: 58, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4), 0 2px 6px rgba(99,102,241,0.3)',
          }}
        >
          <div className="pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%' }}></div>
          <Icons.Sparkles size={26} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 80,
          width: 380, height: 520,
          background: '#fafaf7',
          backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '14px 14px',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(15,23,42,0.2), 0 4px 12px rgba(15,23,42,0.08)',
          border: '1px solid rgba(15,23,42,0.08)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.06)', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
              }}>
                <Icons.Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Flow</div>
                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                  Bereit zu helfen
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', color: '#64748b' }}>
              <Icons.X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? '#1e293b' : 'white',
                color: m.role === 'user' ? 'white' : '#1e293b',
                fontSize: 13.5, lineHeight: 1.5,
                boxShadow: m.role === 'ai' ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
                border: m.role === 'ai' ? '1px solid rgba(15,23,42,0.05)' : 'none',
              }}>{m.text}</div>
            ))}
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: 'white',
                  border: '1px solid rgba(15,23,42,0.08)',
                  borderRadius: 10,
                  fontSize: 12.5, color: '#475569',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Icons.Sparkles size={12} />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: 12, borderTop: '1px solid rgba(15,23,42,0.06)', background: 'white', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Frag Flow etwas…"
              style={{
                flex: 1, padding: '9px 12px', border: '1px solid #e2e8f0',
                borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit'
              }}
            />
            <button onClick={() => send()} style={{
              padding: '0 14px', background: '#1e293b', color: 'white',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}>
              <Icons.ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// FLASHCARD
// ═══════════════════════════════════════════════════════════════
const Flashcard = ({ front, back, flipped, onFlip, w = 560, h = 340, rotate = 0 }) => (
  <div
    className={`flashcard ${flipped ? 'flipped' : ''}`}
    onClick={onFlip}
    style={{ width: w, height: h, cursor: 'pointer', transform: `rotate(${rotate}deg)` }}
  >
    <div className="flashcard-inner">
      <div className="flashcard-face" style={{
        background: 'white',
        boxShadow: '0 2px 4px rgba(15,23,42,0.06), 0 16px 40px rgba(15,23,42,0.1)',
        border: '1px solid rgba(15,23,42,0.06)',
      }}>
        <div style={{ position: 'absolute', top: 18, left: 20, fontSize: 11, color: '#64748b', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Frage</div>
        <div style={{ position: 'absolute', top: 16, right: 20, color: '#cbd5e1' }}>
          <Icons.Flip size={16} />
        </div>
        <div style={{ fontSize: 30, fontFamily: 'Caveat, cursive', fontWeight: 500, color: '#0f172a', textAlign: 'center', lineHeight: 1.25, maxWidth: '85%' }}>
          {front}
        </div>
      </div>
      <div className="flashcard-face back" style={{
        background: '#eef2ff',
        boxShadow: '0 2px 4px rgba(99,102,241,0.08), 0 16px 40px rgba(99,102,241,0.18)',
        border: '1px solid #c7d2fe',
      }}>
        <div style={{ position: 'absolute', top: 18, left: 20, fontSize: 11, color: '#4f46e5', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Antwort</div>
        <div style={{ fontSize: 22, fontFamily: 'Instrument Sans', color: '#1e293b', textAlign: 'center', lineHeight: 1.45, maxWidth: '85%' }}>
          {back}
        </div>
      </div>
    </div>
  </div>
);

// Export to window so other babel scripts can use
Object.assign(window, { Icon, Icons, Doodles, DotPaper, StickyNote, Dock, Avatar, CollabAvatars, LiveCursor, AIAssistant, Flashcard, AVATAR_COLORS });
