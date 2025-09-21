"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import IndividualRegistrationTableWithRound from "../../components/IndividualRegistrationTableWithRound";
import { IndividualRegistrationWithRound, Recruitment25Data } from "../../types/types";
import Papa, { ParseResult } from "papaparse";
import { useEffect } from "react";
import { supabase } from "../../../lib/supabase-client";
import { useUserRole } from "../../../lib/useUserRole";

interface CSVRow {
  registerNumber?: string;
}

interface DatabaseRecord {
  id?: number;
  created_at?: string;
  name: string;
  registration_number: string;
  phone_number: string;
  srm_mail: string;
  github_link: string;
  linkedin_link: string;
  domain1: string;
  domain2?: string;
  domain1_round: number;
  domain2_round?: number;
  modified_at?: string;
  modified_by1?: string;
  modified_by2?: string;
}

export default function EventsPage() {
  const router = useRouter();
  const { userRole, loading: roleLoading } = useUserRole();

  const [registrations, setRegistrations] = useState<IndividualRegistrationWithRound[]>([]);
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
    const fetchEventsRegistrations = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push("/login");
          return;
        }

        const res = await fetch("/api/events-registrations", {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
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

    fetchEventsRegistrations();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  // CSV Export
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

    Papa.parse(bulkFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ParseResult<CSVRow>) => {
        const dataRows = results.data as CSVRow[];
        
        // Check if the CSV has the correct column name
        if (dataRows.length > 0 && !dataRows[0].hasOwnProperty('registerNumber')) {
          setToastMessage("CSV file must have a column named 'registerNumber'. Please check and try again.");
          setTimeout(() => setToastMessage(""), 5000);
          return;
        }
        
        const regNumbers: string[] = dataRows.map((row) => row.registerNumber?.trim() || "");

        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          // Call the server function to update the database
          const res = await fetch("/api/events-bulk-update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
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

          // Check for missing registration numbers
          const updatedRegNumbers = data.map((record: DatabaseRecord) => record.registration_number);
          const missingRegNumbers = regNumbers.filter(regNum => !updatedRegNumbers.includes(regNum));
          
          // Update local state to reflect the changes
          const updatedRegistrations = registrations.map((p) => {
            if (regNumbers.includes(p.registerNumber)) {
              return { ...p, round: Number(bulkRound) };
            }
            return p;
          });

          setRegistrations(updatedRegistrations);
          
          // Show success message with missing registration numbers if any
          let successMessage = data.message || `Successfully updated ${data.length} participants to round ${bulkRound}`;
          if (missingRegNumbers.length > 0) {
            const missingNumbers = missingRegNumbers.map(num => `registration number: ${num}`).join(', ');
            successMessage += `. Not found: ${missingNumbers}`;
            setToastMessage(successMessage);
            setTimeout(() => setToastMessage(""), 10000); // 10 seconds for missing reg numbers
          } else {
            setToastMessage(successMessage);
            setTimeout(() => setToastMessage(""), 5000); // 5 seconds for normal success
          }

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
        {/* Logo + Back */}
        <div className="absolute top-4 left-4 p-2 z-12 flex flex-col items-start gap-2">
          <Link href="/">
            <img src="/alexa-logo.svg" 
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

        {/* User Role & Logout */}
        <div className="absolute top-4 right-4 z-12 flex items-center gap-3">
          
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
            <div className="bg-gradient-to-r from-pink-900 to-purple-900 p-6 text-white border-b border-purple-700 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Events Domain</h1>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="text-sm sm:text-base">
                    {filteredRegistrations.length} Registrations
                  </span>
                </div>
              </div>

              {/* Bulk & Export Buttons - Only for lead&core */}
              {userRole === 'lead&core' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="px-4 py-2 bg-pink-700 hover:bg-pink-800 text-white rounded-lg cursor-pointer text-sm sm:text-base"
                  >
                    Bulk Update
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg cursor-pointer text-sm sm:text-base"
                  >
                    Export
                  </button>
                </div>
              )}
              
              {/* Export Button - Only for executive */}
              {userRole === 'executive' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg cursor-pointer text-sm sm:text-base"
                  >
                    Export
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Filters (desktop) */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Participant Registrations</h2>
                <div className="hidden md:flex gap-4">
                  {/* Year Filter */}
                  <div className="relative">
                    <select
                      value={yearFilter || ""}
                      onChange={(e) => setYearFilter(e.target.value || null)}
                      className="bg-gray-800/50 border border-purple-500/30 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-8 cursor-pointer text-sm sm:text-base"
                    >
                      <option value="">All Years</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="h-5 w-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Round Filter */}
                  <div className="relative">
                    <select
                      value={roundFilter || ""}
                      onChange={(e) => setRoundFilter(e.target.value || null)}
                      className="bg-gray-800/50 border border-purple-500/30 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-8 cursor-pointer text-sm sm:text-base"
                    >
                      <option value="">All Rounds</option>
                      <option value="1">Round 1</option>
                      <option value="2">Round 2</option>
                      <option value="3">Round 3</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="h-5 w-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search participants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-800/50 border border-purple-500/30 rounded-lg py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text text-sm sm:text-base"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Mobile Icons */}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-2 1v-6L3 6V4z" />
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
                    className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
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
                    className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
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
                    className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                  >
                    <option value="">All Rounds</option>
                    <option value="1">Round 1</option>
                    <option value="2">Round 2</option>
                    <option value="3">Round 3</option>
                  </select>
                </div>
              )}

              {/* Table */}
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

            <label
              htmlFor="bulk-file"
              className="mb-4 w-full inline-block bg-pink-700 hover:bg-pink-800 text-white text-center py-2 rounded-lg cursor-pointer text-sm sm:text-base"
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
                className="px-4 py-2 bg-pink-700 hover:bg-pink-800 text-white rounded-lg cursor-pointer text-sm sm:text-base"
              >
                Move Participants
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 left-4 md:right-4 md:left-auto bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm sm:text-base break-words">
          {toastMessage}
        </div>
      )}

      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 480px) {
          div.absolute.top-4.left-4 img {
            height: 32px;
          }
          div.absolute.top-4.right-4 button {
            padding: 0.5rem;
            font-size: 0.8rem;
          }
          div.bg-gradient-to-r div.flex.gap-2 button {
            padding: 0.5rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}