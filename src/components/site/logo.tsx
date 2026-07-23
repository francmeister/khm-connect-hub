import { KHM_LOGO_URL, SITE_NAME } from "@/lib/khm";
import { Link } from "@tanstack/react-router";

interface LogoProps {
  className?: string;
  height?: number;
}

export function KhmLogo({ className, height = 40 }: LogoProps) {
  return (
    <Link
      to="/"
      className={"inline-flex items-center " + (className ?? "")}
      aria-label={`${SITE_NAME} home`}
    >
      <img
        src={KHM_LOGO_URL}
        alt="KHM Technology"
        style={{ height, width: "auto" }}
        className="block select-none"
        draggable={false}
      />
    </Link>
  );
}
