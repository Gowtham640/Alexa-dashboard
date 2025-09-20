"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import IndividualRegistrationTableWithRound from "../../components/IndividualRegistrationTableWithRound";
import { IndividualRegistrationWithRound, Recruitment25Data } from "../../types/types";
import Papa, { ParseResult } from "papaparse";
import { supabase } from "../../../lib/supabase-client";
import { useEffect } from "react";

type BulkCSVRow = {
  registerNumber?: string;
};

export default function BusinessPage() {
  const router = useRouter();

  const [registrations, setRegistrations] = useState<IndividualRegistrationWithRound[]>([]); // Replace with API data later
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [roundFilter, setRoundFilter] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkRound, setBulkRound] = useState("2");
  const [toastMessage, setToastMessage] = useState("");

useEffect(() => {
  const fetchBusinessRegistrations = async () => {
    try {
      const res = await fetch("/api/business-registrations");
      const data = await res.json();

      if (!res.ok) {
        console.error("Backend error:", data.error);
        setToastMessage("Error fetching data from backend");
        setTimeout(() => setToastMessage(""), 3000);
        return;
      }

      setRegistrations(data);
    } catch (err) {
      console.error("Error:", err);
      setToastMessage("Error fetching data from backend");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  fetchBusinessRegistrations();
}, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  const getYearOfStudy = (registerNumber: string): number => {
    const batchYear = parseInt(registerNumber.substring(2, 4));
    const currentYear = 2025;
    return currentYear - 2000 - batchYear + 1;
  };

  const filteredRegistrations = registrations.filter((participant) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      participant.name.toLowerCase().includes(searchLower) ||
      participant.registerNumber.toLowerCase().includes(searchLower) ||
      participant.email.toLowerCase().includes(searchLower) ||
      participant.phone.toLowerCase().includes(searchLower);

    const matchesYear = yearFilter
      ? getYearOfStudy(participant.registerNumber).toString() === yearFilter
      : true;

    const matchesRound = roundFilter
      ? participant.round.toString() === roundFilter
      : true;

    return matchesSearch && matchesYear && matchesRound;
  });

  // --- CSV Export Function ---
  const handleExport = () => {
    if (filteredRegistrations.length === 0) {
      setToastMessage("No participants to export");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    const csvHeader = ["Name", "Register Number", "Email", "Phone", "Round"];
    const csvRows = filteredRegistrations.map((p) =>
      [p.name, p.registerNumber, p.email, p.phone, p.round].join(",")
    );

    const csvContent = [csvHeader.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "participants.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(`${filteredRegistrations.length} participants exported successfully`);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleBulkUpdate = () => {
    if (!bulkFile) return;

    Papa.parse<BulkCSVRow>(bulkFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ParseResult<Record<string, string>>) => {
        const regNumbers: string[] = results.data.map((row) =>
          row.registerNumber?.trim() || ""
        );

        try {
          // Call the server function to update the database
          const res = await fetch("/api/business-bulk-update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              registrationNumbers: regNumbers,
              round: Number(bulkRound)
            })
          });

          const data = await res.json();

          if (!res.ok) {
            console.error("Backend error:", data.error);
            setToastMessage("Error updating database: " + data.error);
            setTimeout(() => setToastMessage(""), 3000);
            return;
          }

          // Update local state to reflect the changes
          const updatedRegistrations = registrations.map((p) => {
            if (regNumbers.includes(p.registerNumber)) {
              return { ...p, round: Number(bulkRound) };
            }
            return p;
          });

          setRegistrations(updatedRegistrations);
          setToastMessage(data.message);

          setShowBulkModal(false);
          setBulkFile(null);
          setTimeout(() => setToastMessage(""), 5000);

        } catch (err) {
          console.error("Error:", err);
          setToastMessage("Error updating database");
          setTimeout(() => setToastMessage(""), 3000);
        }
      },
      error: (err) => {
        console.error("CSV Parsing Error:", err);
        setToastMessage("Failed to parse CSV file");
        setTimeout(() => setToastMessage(""), 3000);
      },
    });
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-800/20 via-blue-800/10 to-black z-0 pointer-events-none" />

      <div className="relative z-10 p-8">
        {/* Alexa Logo + Back Link */}
        <div className="absolute top-4 left-4 p-2 z-12 flex flex-col items-start gap-2">
          <Link href="/">
            <img
              src="/alexa-logo.svg"
              alt="Alexa Club Logo"
              className="h-12 w-auto sm:h-10 xs:h-8 mobile:h-6 hover:opacity-80 transition-opacity cursor-pointer"
            />
          </Link>
          <Link
            href="/recruitments25"
            className="inline-flex items-center text-purple-300 hover:text-purple-200 text-sm transition-colors"
          >
            ← Back to all domains
          </Link>
        </div>

        {/* Logout Button */}
        <div className="absolute top-4 right-4 z-12">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors cursor-pointer text-sm sm:text-base"
          >
            Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="container mx-auto pt-24">
          <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg overflow-hidden max-w-6xl mx-auto border border-white/20">
            <div className="bg-gradient-to-r from-blue-900 to-green-900 p-6 text-white border-b border-blue-600/50 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Business Domain</h1>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="text-sm sm:text-base">
                    {filteredRegistrations.length} Registrations
                  </span>
                </div>
              </div>

              {/* Bulk & Export Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg cursor-pointer text-sm sm:text-base"
                >
                  Bulk Update
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer text-sm sm:text-base"
                >
                  Export
                </button>
              </div>
            </div>

            {/* Filters, Mobile Search, Table, etc. */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Participant Registrations
                </h2>

                {/* Desktop Inputs */}
                <div className="hidden md:flex gap-4">
                  <div className="relative">
                    <select
                      value={yearFilter || ""}
                      onChange={(e) => setYearFilter(e.target.value || null)}
                      className="bg-gray-800/50 border border-green-500/30 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8 cursor-pointer text-sm sm:text-base"
                    >
                      <option value="">All Years</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="h-5 w-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      value={roundFilter || ""}
                      onChange={(e) => setRoundFilter(e.target.value || null)}
                      className="bg-gray-800/50 border border-green-500/30 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8 cursor-pointer text-sm sm:text-base"
                    >
                      <option value="">All Rounds</option>
                      <option value="1">Round 1</option>
                      <option value="2">Round 2</option>
                      <option value="3">Round 3</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="h-5 w-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search participants..."
                      className="bg-gray-800/50 border border-green-500/30 rounded-lg py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-text text-sm sm:text-base"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Mobile Icon Buttons */}
                <div className="flex md:hidden gap-2">
                  <button
                    onClick={() => setShowMobileSearch(!showMobileSearch)}
                    className="p-2 bg-gray-800/50 rounded-lg text-white hover:bg-gray-700"
                    aria-label="Search"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowMobileFilter(!showMobileFilter)}
                    className="p-2 bg-gray-800/50 rounded-lg text-white hover:bg-gray-700"
                    aria-label="Filter"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-2 1v-6L3 6V4z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Inputs */}
              {showMobileSearch && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search participants..."
                    className="w-full bg-gray-800/50 border border-green-500/30 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}
              {showMobileFilter && (
                <div className="mb-4 flex flex-col gap-4">
                  <select
                    value={yearFilter || ""}
                    onChange={(e) => setYearFilter(e.target.value || null)}
                    className="w-full bg-gray-800/50 border border-green-500/30 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                  <select
                    value={roundFilter || ""}
                    onChange={(e) => setRoundFilter(e.target.value || null)}
                    className="w-full bg-gray-800/50 border border-green-500/30 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  >
                    <option value="">All Rounds</option>
                    <option value="1">Round 1</option>
                    <option value="2">Round 2</option>
                    <option value="3">Round 3</option>
                  </select>
                </div>
              )}

              <div className="border border-white/20 rounded-lg overflow-hidden bg-gray-900/50 backdrop-blur-sm">
                <IndividualRegistrationTableWithRound registrations={filteredRegistrations} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6 w-full max-w-md sm:w-96 relative">
            <h2 className="text-xl font-bold mb-4">Bulk Update Participants</h2>

            {/* Styled File Input */}
            <label
              htmlFor="bulk-file"
              className="mb-4 w-full inline-block bg-green-700 hover:bg-green-800 text-white text-center py-2 rounded-lg cursor-pointer text-sm sm:text-base"
            >
              {bulkFile ? bulkFile.name : "Choose CSV File"}
            </label>
            <input
              id="bulk-file"
              type="file"
              accept=".csv"
              onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
              className="hidden"
            />

            <p className="mb-2 font-medium">Move participants to:</p>
            <select
              value={bulkRound}
              onChange={(e) => setBulkRound(e.target.value)}
              className="mb-4 w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-800 text-white cursor-pointer text-sm sm:text-base"
            >
              <option value="1">Round 1</option>
              <option value="2">Round 2</option>
              <option value="3">Round 3</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg cursor-pointer text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg cursor-pointer text-sm sm:text-base"
              >
                Move Participants
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm sm:text-base">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
