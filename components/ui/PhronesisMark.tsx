import Image from "next/image";

type PhronesisMarkProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export default function PhronesisMark({
  size = 36,
  className = "",
  priority = false,
}: PhronesisMarkProps) {
  return (
    <Image
      src="/brand/phronesis-app-icon.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      priority={priority}
      className={`flex-none rounded-[22%] object-cover ${className}`}
    />
  );
}
