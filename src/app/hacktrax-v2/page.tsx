"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HacktraxTeamTable from "@/app/components/HacktraxTeamTable";
import { HacktraxTeam } from "@/app/types/types";

export default function HacktraxPage() {
  const router = useRouter();

  const [teams, setTeams] = useState<HacktraxTeam[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch("/api/hacktrax-v2/teams");

        if (!res.ok) {
          throw new Error("Failed to fetch teams");
        }

        const data = await res.json();

        let parsedTeams: HacktraxTeam[] = [];

        if (Array.isArray(data)) parsedTeams = data;
        else if (data?.teams) parsedTeams = data.teams;
        else if (data?.data) parsedTeams = data.data;
        else {
          const values = Object.values(data);
          if (Array.isArray(values[0])) parsedTeams = values[0] as HacktraxTeam[];
        }

        setTeams(parsedTeams);
      } catch (err) {
        console.error("Failed to fetch teams", err);
      }
    };

    fetchTeams();
  }, []);

  const getYearOfStudy = (registerNumber: string): number => {
    const batchYear = parseInt(registerNumber.substring(2, 4));
    const currentYear = 2025;
    return currentYear - 2000 - batchYear + 1;
  };

  const filteredTeams = teams.filter((team) => {
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      team.team_name.toLowerCase().includes(searchLower) ||
      team.members.some(
        (m) =>
          m.name.toLowerCase().includes(searchLower) ||
          m.registration_number.toLowerCase().includes(searchLower)
      );

    const matchesYear = yearFilter
      ? team.members.some(
          (m) =>
            getYearOfStudy(m.registration_number).toString() === yearFilter
        )
      : true;

    return matchesSearch && matchesYear;
  });

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  const handleExport = () => {
    if (filteredTeams.length === 0) {
      setToastMessage("No teams to export");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    const rows: string[] = [];

    filteredTeams.forEach((team) => {
      team.members.forEach((member) => {
        rows.push(
          [
            team.team_name,
            member.name,
            member.registration_number,
            member.email_id,
            member.phone_number,
            team.transaction_id,
          ].join(",")
        );
      });
    });

    const csvHeader = [
      "Team Name",
      "Member Name",
      "Register Number",
      "Email",
      "Phone",
      "Transaction ID",
    ];

    const csvContent = [csvHeader.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "hacktrax-teams.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage("Teams exported successfully");
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-800/20 via-blue-800/10 to-black z-0 pointer-events-none" />

      <div className="relative z-10 p-8">
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

        {/* Logout */}
        <div className="absolute top-4 right-4 z-12">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="container mx-auto pt-16">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-6 transition-colors"
          >
            ← Back to dashboard
          </Link>

          <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg overflow-hidden max-w-6xl mx-auto border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-900 to-purple-900 p-6 text-white border-b border-purple-700 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Hacktrax 2.0</h1>
                <span>👥 {filteredTeams.length} Teams</span>
              </div>

              <button
                onClick={handleExport}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg"
              >
                Export
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Team Registrations
                </h2>

                {/* Desktop Filters */}
                <div className="hidden md:flex gap-4">
                  <select
                    value={yearFilter || ""}
                    onChange={(e) => setYearFilter(e.target.value || null)}
                    className="bg-gray-800/50 border border-purple-500/30 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800/50 border border-purple-500/30 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Mobile Icons */}
                <div className="flex md:hidden gap-2">
                  <button
                    onClick={() => setShowMobileSearch(!showMobileSearch)}
                    className="p-2 bg-gray-800/50 rounded-lg text-white"
                  >
                    🔍
                  </button>

                  <button
                    onClick={() => setShowMobileFilter(!showMobileFilter)}
                    className="p-2 bg-gray-800/50 rounded-lg text-white"
                  >
                    ⚙️
                  </button>
                </div>
              </div>

              {/* Mobile Inputs */}
              {showMobileSearch && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search teams..."
                    className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg py-2 px-4 text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}

              {showMobileFilter && (
                <div className="mb-4">
                  <select
                    value={yearFilter || ""}
                    onChange={(e) => setYearFilter(e.target.value || null)}
                    className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg py-2 px-4 text-white"
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              )}

              {/* Table */}
              <div className="border border-white/20 rounded-lg overflow-hidden bg-gray-900/50 backdrop-blur-sm">
                <HacktraxTeamTable teams={filteredTeams} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded">
          {toastMessage}
        </div>
      )}
    </div>
  );
}