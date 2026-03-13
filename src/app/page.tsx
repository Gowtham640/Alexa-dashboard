"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-800/20 via-blue-800/10 to-black pointer-events-none"></div>

      {/* Alexa Logo */}
      <div className="absolute top-4 left-4 p-2 z-12">
        <Link href="/">
          <img 
            src="/alexa-logo.svg" 
            alt="Alexa Club Logo" 
            className="h-12 w-auto sm:h-10 xs:h-8 mobile:h-6 cursor-pointer"
          />
        </Link>
      </div>

      {/* Logout Button */}
      <div className="absolute top-4 right-4 z-12">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-base sm:text-sm xs:text-xs"
        >
          Logout
        </button>
      </div>

      {/* Centered Cards */}
      <div className="flex flex-col sm:flex-row items-center justify-center min-h-screen px-4 gap-6 relative z-10">
        {/* AlexaVerse 2.0 */}
        <Link href="/alexaverse-v2" className="w-full sm:w-auto">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/20 w-full max-w-md sm:max-w-sm xs:max-w-xs transition-all duration-200 hover:scale-102 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] cursor-pointer">
            <h1 className="text-4xl sm:text-3xl xs:text-2xl font-bold text-white mb-2 text-center">
              AlexaVerse 2.0
            </h1>
          </div>
        </Link>

        {/* Recruitments 2025 */}
        <Link href="/recruitments25" className="w-full sm:w-auto">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/20 w-full max-w-md sm:max-w-sm xs:max-w-xs transition-all duration-200 hover:scale-102 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] cursor-pointer">
            <h1 className="text-4xl sm:text-3xl xs:text-2xl font-bold text-white mb-2 text-center">
              Recruitments 2025
            </h1>
          </div>
        </Link>

        {/* Hacktrax 2.0 */}
        <Link href="/hacktrax-v2" className="w-full sm:w-auto">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/20 w-full max-w-md sm:max-w-sm xs:max-w-xs transition-all duration-200 hover:scale-102 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] cursor-pointer">
            <h1 className="text-4xl sm:text-3xl xs:text-2xl font-bold text-white mb-2 text-center">
              HackTrax 2.0
            </h1>
          </div>
        </Link>
      </div>

      {/* Mobile specific scaling */}
      <style jsx>{`
        @media (max-width: 480px) {
          .absolute.top-4.left-4 img {
            height: 32px;
          }
          .absolute.top-4.right-4 button {
            padding: 0.5rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}
