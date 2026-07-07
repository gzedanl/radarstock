interface LogoProps {
  className?: string;
}

export default function Logo({ className = "h-10 w-auto" }: LogoProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.svg" alt="RadarStock" className={className} />;
}
