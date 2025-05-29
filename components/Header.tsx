import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-agi-border bg-agi-dark">
      <div className="mx-auto flex flex-col items-center justify-center">
        <div className="flex gap-4 items-center">
          <div className="relative w-[60px] h-[60px] flex items-center justify-center">
            {/* Outer Ring */}
            <div className="absolute w-[56px] h-[56px] rounded-full border-2 border-[#00B5E2]"></div>
            {/* Middle Ring */}
            <div className="absolute w-[40px] h-[40px] rounded-full border-2 border-[#00B5E2]"></div>
            {/* Inner Dot */}
            <div className="w-[16px] h-[16px] rounded-full bg-[#8DC63F] z-10"></div>
          </div>

          <span className="text-lg font-bold">AGI Auto Builder</span>
        </div>
        <nav className="ml-8 flex space-x-2">
          <Link href="#" className="text-white hover:text-agi-blue">
            Home
          </Link>
          <Link href="#" className="text-white hover:text-agi-blue">
            Features
          </Link>
          <Link href="#" className="text-white hover:text-agi-blue">
            Docs
          </Link>
          <Link href="#" className="text-white hover:text-agi-blue">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
