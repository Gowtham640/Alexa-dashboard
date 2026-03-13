export async function GET() {
  try {
    const res = await fetch(
      "https://acktrax--gowtham6409728-qwsx9lla.leapcell.dev/v1/teams",
      {
        headers: {
          "X-Password": process.env.HACKTRAX_API_PASSWORD!,
        },
      }
    );

    const data = await res.json();

    return Response.json(data);
  } catch (error) {
    console.error("Hacktrax API error:", error);
    return Response.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}