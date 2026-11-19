import Image from "next/image";

export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <Image
      src="/icon.svg"
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-md"
    />
  );
}
