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

interface DebugInfo {
  hasSession: boolean;
  userId?: string;
  userEmail?: string;
  tokenLength: number;
}

export default function TechnicalPage() {
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
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    const fetchTechnicalRegistrations = async () => {
      try {
        console.log("📊 Technical: Starting data fetch...");
        const { data: { session } } = await supabase.auth.getSession();
        
        const sessionInfo = {
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          tokenLength: session?.access_token?.length || 0
        };
        
        console.log("📊 Technical: Session check:", sessionInfo);
        setDebugInfo(sessionInfo);
        
        if (!session) {
          console.log("📊 Technical: No session, redirecting to login");
          router.push("/login");
          return;
        }

        console.log("📊 Technical: Making API call to /api/technical-registrations");
        const res = await fetch("/api/technical-registrations", {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        console.log("📊 Technical: API response status:", res.status);
        const data = await res.json();
        console.log("📊 Technical: API response data:", data);

        if (!res.ok) {
          console.error("📊 Technical: Backend error:", data.error);
          setToastMessage("Error fetching data from backend");
          setTimeout(() => setToastMessage(""), 3000);
          return;
        }

        console.log("📊 Technical: Setting registrations:", data.length, "records");
        setRegistrations(data);
        
        // Test direct Supabase access
        console.log("📊 Technical: Testing direct Supabase access...");
        const { count: directCount, error: directError } = await supabase
          .from('recruitment_25')
          .select('*', { count: 'exact', head: true })
          .or('domain1.ilike.%technical%,domain2.ilike.%technical%');
        
        console.log("📊 Technical: Direct Supabase test:", {
          directCount,
          directError: directError?.message
        });
      } catch (err) {
        console.error("📊 Technical: Error:", err);
        setToastMessage("Error fetching data from backend");
        setTimeout(() => setToastMessage(""), 3000);
      }
    };

    fetchTechnicalRegistrations();
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

  // --- CSV Export Function ---
  const handleExport = () => {
    if (filteredRegistrations.length === 0) {
      setToastMessage("No participants to export");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    const csvData = filteredRegistrations.map((participant) => ({
      Name: participant.name,
      "Registration Number": participant.registerNumber,
      Email: participant.email,
      Phone: participant.phone,
      "Registered At": participant.registeredAt,
      Round: participant.round,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "technical_registrations.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Bulk Update Function ---
  const handleBulkUpdate = () => {
    if (!bulkFile) {
      setToastMessage("Please select a CSV file");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    Papa.parse(bulkFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ParseResult<any>) => {
        try {
          const registrationNumbers = results.data
            .map((row: any) => row.registerNumber)
            .filter((num: any) => num && num.trim() !== "");

          if (registrationNumbers.length === 0) {
            setToastMessage("No valid registration numbers found in CSV");
            setTimeout(() => setToastMessage(""), 3000);
            return;
          }

          const response = await fetch("/api/technical-bulk-update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              registrationNumbers,
              round: parseInt(bulkRound),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            setToastMessage(`Error: ${errorData.error}`);
            setTimeout(() => setToastMessage(""), 3000);
            return;
          }

          const updatedData = await response.json();
          setRegistrations(updatedData);
          setToastMessage(`Successfully updated ${updatedData.length} participants to round ${bulkRound}`);

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
            <Image 
              src="/alexa-logo.svg" 
              alt="Alexa Club Logo" 
              width={48}
              height={48}
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
          {!roleLoading && userRole && (
            <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30">
              Role: {userRole}
            </div>
          )}
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
                <h1 className="text-3xl font-bold">Technical Domain</h1>
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
                  </div>
                </div>
              </div>

              {/* Mobile Filters */}
              <div className="md:hidden mb-4 space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMobileSearch(!showMobileSearch)}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                  >
                    {showMobileSearch ? "Hide Search" : "Search"}
                  </button>
                  <button
                    onClick={() => setShowMobileFilter(!showMobileFilter)}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                  >
                    {showMobileFilter ? "Hide Filters" : "Filters"}
                  </button>
                </div>

                {/* Mobile Search */}
                {showMobileSearch && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search participants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {/* Mobile Filters */}
                {showMobileFilter && (
                  <div className="space-y-2">
                    <select
                      value={yearFilter || ""}
                      onChange={(e) => setYearFilter(e.target.value || null)}
                      className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Rounds</option>
                      <option value="1">Round 1</option>
                      <option value="2">Round 2</option>
                      <option value="3">Round 3</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Desktop Search */}
              <div className="hidden md:block mb-6">
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Toast Message */}
              {toastMessage && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
                  {toastMessage}
                </div>
              )}

              {/* Debug Info Panel */}
              {debugInfo && (
                <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
                  <div><strong>Session:</strong> {debugInfo.hasSession ? 'Active' : 'None'}</div>
                  {debugInfo.userId && <div><strong>User ID:</strong> {debugInfo.userId}</div>}
                  {debugInfo.userEmail && <div><strong>Email:</strong> {debugInfo.userEmail}</div>}
                  <div><strong>Token Length:</strong> {debugInfo.tokenLength}</div>
                </div>
              )}

              {/* Table */}
              <IndividualRegistrationTableWithRound registrations={filteredRegistrations} />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6 w-full max-w-md sm:w-96 relative">
            <h2 className="text-xl font-bold mb-4">Bulk Update Participants</h2>

            {/* Styled File Input */}
            <label
              htmlFor="bulk-file"
              className="block w-full p-4 border-2 border-dashed border-purple-500/50 rounded-lg cursor-pointer hover:border-purple-500/70 transition-colors mb-4"
            >
              <div className="text-center">
                <div className="text-purple-400 mb-2">
                  <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-sm">
                  {bulkFile ? bulkFile.name : "Click to upload CSV file"}
                </span>
              </div>
              <input
                id="bulk-file"
                type="file"
                accept=".csv"
                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            {/* Round Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Round:</label>
              <select
                value={bulkRound}
                onChange={(e) => setBulkRound(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="2">Round 2</option>
                <option value="3">Round 3</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleBulkUpdate}
                disabled={!bulkFile}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Update Participants
              </button>
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile specific scaling for logo */}
      <style jsx>{`
        @media (max-width: 480px) {
          .absolute.top-4.left-4 img {
            height: 32px; /* smaller logo on mobile */
          }
        }
      `}</style>
    </div>
  );
}