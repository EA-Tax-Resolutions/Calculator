import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/brand/ea-tax-resolutions-logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="https://www.eataxresolutions.com/" className={`inline-flex items-center ${className}`}>
      <Image src={logo} alt="EA Tax Resolutions" priority className="h-9 w-auto sm:h-10" />
    </Link>
  );
}
