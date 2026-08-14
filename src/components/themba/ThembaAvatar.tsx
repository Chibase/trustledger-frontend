import { THEMBA_AVATAR_ALT, THEMBA_AVATAR_SRC } from "@/lib/themba/assets";

type ThembaAvatarProps = {
  size?: number;
  className?: string;
  decorative?: boolean;
};

export function ThembaAvatar({
  size = 40,
  className = "",
  decorative = false,
}: ThembaAvatarProps) {
  return (
    // Static img keeps the global widget off the next/image runtime.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={THEMBA_AVATAR_SRC}
      alt={decorative ? "" : THEMBA_AVATAR_ALT}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`.trim()}
      decoding="async"
    />
  );
}
