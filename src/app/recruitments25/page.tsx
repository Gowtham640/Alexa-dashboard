"use client";

import Link from "next/link";
import Image from "next/image";
import { useUserRole } from "../../lib/useUserRole";

const recruitments = [
  {
    id: "Technical",
    name: "Technical",
    description: "Coding, development and problem-solving",
  },
  {
    id: "Creatives",
    name: "Creatives",
    description: "Design, content, and creative storytelling",
  },
  {
    id: "Business",
    name: "Business",
    description: "Management, marketing and operations",
  },
  {
    id: "Events",
    name: "Events",
    description: "Organizing, planning and execution",
  },
];

export default function Recruitments2025() {
  const { userRole, loading: roleLoading } = useUserRole();
  
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-800/20 via-blue-800/10 to-black pointer-events-none z-0" />

      {/* Alexa Logo + Back Link */}
      <div className="absolute top-4 left-4 p-2 z-12 flex flex-col items-start gap-2">
        <Link href="/">
          <Image
            src="/alexa-logo.svg"
            alt="Alexa Club Logo"
            width={48}
            height={48}
            className="h-12 w-auto sm:h-10 xs:h-8 mobile:h-6 hover:opacity-80 transition-opacity cursor-pointer"
          />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center text-purple-300 hover:text-purple-200 text-sm transition-colors"
        >
          ← Back to main page
        </Link>
      </div>

      {/* User Role & Logout */}
      <div className="absolute top-4 right-4 z-12 flex items-center gap-3">
        {!roleLoading && userRole && (
          <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30">
            Role: {userRole}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

            {/* Main Content */}
      <div className="container mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-12 relative z-10">
        <h1 className="text-3xl sm:text-2xl xs:text-xl font-bold text-white mb-8 text-center">
          Recruitments 2025
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recruitments.map((domain) => (
            <Link key={domain.id} href={`/recruitments25/${domain.id}`}>
              <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer h-full border-l-4 border-green-500 border border-white/20">
                <h2 className="text-2xl font-bold text-white">{domain.name}</h2>
                <p className="text-white/80 mt-2">{domain.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>


      {/* Mobile specific scaling */}
      <style jsx>{`
        @media (max-width: 480px) {
          div.absolute.top-4.left-4 img {
            height: 32px;
          }
          div.absolute.top-4.right-4 button {
            padding: 0.5rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}