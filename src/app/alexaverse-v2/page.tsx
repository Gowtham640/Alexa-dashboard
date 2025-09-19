"use client";

import Link from "next/link";
import { Event } from "../types/types";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase-client";

const events: Event[] = [
  {
    id: "workshop",
    name: "Workshop",
    description: "Interactive learning session",
    date: "Sep 04, 2025",
    location: "Mini Hall 2",
    isTeamEvent: false,
  },
  {
    id: "ideathon",
    name: "Ideathon",
    description: "Innovation challenge",
    date: "Sep 03, 2025",
    location: "Mini Hall 2",
    isTeamEvent: true,
  },
  {
    id: "vlogit",
    name: "Vlogit",
    description: "Vlog the event",
    date: "Sep 02-Sep 04, 2025",
    location: "Mini Hall 2",
    isTeamEvent: false,
  },
  {
    id: "debug-the-campus",
    name: "Debug the Campus",
    description: "Find QRs",
    date: "Sep 02, 2025",
    location: "JC Bose Hall",
    isTeamEvent: true,
  },
];

export default function AlexaVerseV2() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      return;
    }
    router.push("/login");
    localStorage.removeItem("isLoggedIn");
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-800/20 via-blue-800/10 to-black pointer-events-none z-0" />

      {/* Alexa Logo */}
      <div className="absolute top-4 left-4 p-2 z-12">
        <Link href="/">
          <img
            src="/alexa-logo.svg"
            alt="Alexa Club Logo"
            className="h-12 w-auto sm:h-10 xs:h-8 mobile:h-6 hover:opacity-80 transition-opacity cursor-pointer"
          />
        </Link>
      </div>

      {/* Logout button */}
      <div className="absolute top-4 right-4 z-12">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="container mx-auto pt-16 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-6 transition-colors"
        >
          ← Back to main page
        </Link>

        <h1 className="text-3xl sm:text-2xl xs:text-xl font-bold text-white mb-8 text-center">
          AlexaVerse 2.0 Events
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event.id} href={`/alexaverse-v2/${event.id}`}>
              <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer h-full border-l-4 border-purple-500 border border-white/20">
                <h2 className="text-2xl font-bold text-white">{event.name}</h2>
                <p className="text-white/80 mt-2">{event.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-white/60">📅 {event.date}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      event.isTeamEvent
                        ? "bg-purple-500/20 text-purple-200"
                        : "bg-blue-500/20 text-blue-200"
                    }`}
                  >
                    {event.isTeamEvent ? "Team Event" : "Individual"}
                  </span>
                </div>
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
