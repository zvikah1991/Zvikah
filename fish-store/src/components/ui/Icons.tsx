import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function FishIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M3 12c3.5-5 12-7 16-3.5-1.8 1.5-1.8 6 0 7.5C15 20.5 6.5 18.5 3 12z" />
      <circle cx="14.5" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <path d="M19 9c1.5 1 1.5 4 0 6" />
    </svg>
  );
}

export function WaveIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M2 9c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2" />
      <path d="M2 15c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2" />
    </svg>
  );
}

export function FilletIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 14c2-6 6-9 11-9 3 0 5 2 5 4s-3 3-6 3c1 2 1 4-1 6-3 3-8 2-9-4z" />
      <path d="M8 10c1 1 2 3 2 6" />
    </svg>
  );
}

export function ShrimpIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6 18c-2-3-2-8 2-11 3-2.5 8-2.5 9 1 .6 2-1 3-3 2.5" />
      <path d="M14 6c2 0 4 1 4 3s-2 3-4 2" />
      <circle cx="7.5" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SmokeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M7 20c3-3-2-4 1-8 2-3-1-5 1-8" />
      <path d="M12 20c3-3-2-4 1-8 2-3-1-5 1-8" />
      <path d="M17 20c2-2-1-4 0-7" />
    </svg>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M4 13h16" />
      <path d="M12 9v11" />
      <path d="M12 9C10 9 8 7.5 8 6a2 2 0 0 1 4 0 2 2 0 0 1 4 0c0 1.5-2 3-4 3z" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2C10.5 20 4 13.5 4 6a2 2 0 0 1 1-2z" />
    </svg>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="2.5" y="7" width="12" height="9" rx="1" />
      <path d="M14.5 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18.5" r="1.6" />
      <circle cx="17.5" cy="18.5" r="1.6" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function SnowflakeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 2v20M4.5 6l15 12M19.5 6l-15 12" />
      <path d="M8 4l4 3 4-3M8 20l4-3 4 3M4 8l3 4-3 4M20 8l-3 4 3 4" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export const categoryIcons = {
  fish: FishIcon,
  wave: WaveIcon,
  fillet: FilletIcon,
  shrimp: ShrimpIcon,
  smoke: SmokeIcon,
  gift: GiftIcon,
};
