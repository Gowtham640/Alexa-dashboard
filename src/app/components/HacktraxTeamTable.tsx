import { HacktraxTeam } from "../types/types";

export default function HacktraxTeamTable({
  teams,
}: {
  teams: HacktraxTeam[];
}) {
  return (
    <div className="overflow-x-auto">

      {/* Desktop Table */}
      <table className="min-w-full divide-y divide-gray-700 hidden md:table">

        <thead className="bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">
              Team Name
            </th>

            <th className="px-6 py-3 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">
              Members
            </th>

            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
              Transaction ID
            </th>
          </tr>
        </thead>

        <tbody className="bg-gray-900/50 divide-y divide-gray-700">

          {teams.map((team, index) => (
            <tr
              key={index}
              className="hover:bg-gray-800/30 transition-colors"
            >

              {/* Team Name */}
              <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">
                {team.team_name}
              </td>

              {/* Members */}
              <td className="px-6 py-4">

                <div className="space-y-4">

                  {team.members.map((member, i) => (

                    <div
                      key={i}
                      className="border-l-4 border-purple-500/50 pl-3 py-2"
                    >

                      <p className="font-bold text-white text-lg">
                        {member.name}
                      </p>

                      <div className="flex flex-col gap-1 mt-2">

                        <p className="text-gray-300">
                          <span className="font-semibold text-purple-200">
                            Reg No:
                          </span>{" "}
                          {member.registration_number}
                        </p>

                        <p className="text-gray-300">
                          <span className="font-semibold text-purple-200">
                            Email:
                          </span>{" "}
                          {member.email_id}
                        </p>

                        <p className="text-gray-300">
                          <span className="font-semibold text-purple-200">
                            Phone:
                          </span>{" "}
                          {member.phone_number}
                        </p>

                      </div>

                    </div>

                  ))}

                </div>

              </td>

              {/* Transaction ID */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {team.transaction_id}
              </td>

            </tr>
          ))}

        </tbody>

      </table>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-4 md:hidden">

        {teams.map((team, index) => (

          <div
            key={index}
            className="bg-gray-900/50 border border-gray-700 rounded-lg p-4"
          >

            <p className="font-bold text-lg text-white mb-2">
              Team: {team.team_name}
            </p>

            <p className="text-gray-400 mb-2">
              <span className="font-semibold text-purple-200">
                Transaction ID:
              </span>{" "}
              {team.transaction_id}
            </p>

            <div className="space-y-3">

              {team.members.map((member, i) => (

                <div
                  key={i}
                  className="bg-gray-800/70 rounded-lg p-3"
                >

                  <p className="font-bold text-white">
                    {member.name}
                  </p>

                  <p className="text-gray-300">
                    <span className="font-semibold text-purple-200">
                      Reg No:
                    </span>{" "}
                    {member.registration_number}
                  </p>

                  <p className="text-gray-300">
                    <span className="font-semibold text-purple-200">
                      Email:
                    </span>{" "}
                    {member.email_id}
                  </p>

                  <p className="text-gray-300">
                    <span className="font-semibold text-purple-200">
                      Phone:
                    </span>{" "}
                    {member.phone_number}
                  </p>

                </div>

              ))}

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}