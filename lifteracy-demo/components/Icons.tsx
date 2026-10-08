// Small inline icons in the style of WhatsApp's UI.

type P = { size?: number; className?: string };

const svg = (size: number, className: string | undefined, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
    {children}
  </svg>
);

export const BackIcon = ({ size = 24, className }: P) =>
  svg(size, className, <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />);

export const VideoIcon = ({ size = 24, className }: P) =>
  svg(size, className, <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />);

export const PhoneIcon = ({ size = 22, className }: P) =>
  svg(
    size,
    className,
    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.58.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z" />,
  );

export const MoreIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />,
  );

export const MicIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5.3-3a5.3 5.3 0 0 1-10.6 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-1.7z" />,
  );

export const SendIcon = ({ size = 24, className }: P) =>
  svg(size, className, <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />);

export const EmojiIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-3.5-9A1.5 1.5 0 1 0 8.5 8a1.5 1.5 0 0 0 0 3zm7 0A1.5 1.5 0 1 0 15.5 8a1.5 1.5 0 0 0 0 3zM12 17.5a5.5 5.5 0 0 0 5.11-3.5H6.89A5.5 5.5 0 0 0 12 17.5z" />,
  );

export const ClipIcon = ({ size = 22, className }: P) =>
  svg(
    size,
    className,
    <path d="M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5a1 1 0 0 1-2 0V6H10v9.5a2.5 2.5 0 0 0 5 0V5a4 4 0 0 0-8 0v12.5a5.5 5.5 0 0 0 11 0V6h-1.5z" />,
  );

export const CameraIcon = ({ size = 22, className }: P) =>
  svg(
    size,
    className,
    <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />,
  );

export const PlayIcon = ({ size = 28, className }: P) => svg(size, className, <path d="M8 5v14l11-7z" />);

export const PauseIcon = ({ size = 28, className }: P) =>
  svg(size, className, <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />);

export const TrashIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />,
  );

export const ReplyIcon = ({ size = 18, className }: P) =>
  svg(size, className, <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />);

export const TicksIcon = ({ size = 16, className }: P) => (
  <svg width={size} height={size * 0.69} viewBox="0 0 16 11" className={className} aria-hidden="true" fill="currentColor">
    <path d="M11.07.65 10.4.13a.48.48 0 0 0-.68.08L4.5 6.9 2.3 4.84a.48.48 0 0 0-.68.02l-.5.53a.48.48 0 0 0 .02.68l3.07 2.9c.2.19.52.17.7-.05l6.24-7.6a.48.48 0 0 0-.08-.67z" />
    <path d="M15.07.65 14.4.13a.48.48 0 0 0-.68.08L8.5 6.9l-.6-.56-.98 1.2 1.33 1.26c.2.19.52.17.7-.05l6.24-7.6a.48.48 0 0 0-.08-.67z" />
  </svg>
);

// The bot's avatar: an open book on Lifteracy green.
export const BotAvatar = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="20" fill="#25a35a" />
    <path d="M9 13.5c3.6-1 7.3-.6 10.2 1.4v13.3c-2.9-2-6.6-2.4-10.2-1.4z" fill="#fff" />
    <path d="M31 13.5c-3.6-1-7.3-.6-10.2 1.4v13.3c2.9-2 6.6-2.4 10.2-1.4z" fill="#e6f7ec" />
    <path d="M20 9l2.4 2.4H21v2h-2v-2h-1.4z" fill="#ffd54a" />
  </svg>
);

export const UserAvatar = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="20" fill="#dfe5e7" />
    <circle cx="20" cy="16" r="7" fill="#fff" />
    <path d="M7 34c2-6.5 7-9.5 13-9.5s11 3 13 9.5A19.9 19.9 0 0 1 20 40 19.9 19.9 0 0 1 7 34z" fill="#fff" />
  </svg>
);
