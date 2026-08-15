import { ImageResponse } from "next/og"

// export const runtime = "edge"
export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Get parameters from the URL
    const name = searchParams.get("name") || ""
    const registrationType = searchParams.get("type") || "single"
    const partner1 = searchParams.get("partner1") || ""
    const partner2 = searchParams.get("partner2") || ""

    // Determine what text to display based on registration type
    let displayText = ""
    let inviteText = ""

    if (registrationType === "couple") {
      displayText = `${partner1} & ${partner2}`
      inviteText = 'You\'re Invited to "The Aegean Escape" –\nA Stellar Sundowner Experience!'
    } else {
      displayText = name
      inviteText = 'You\'re Invited to "The Aegean Escape" –\nA Stellar Sundowner Experience!'
    }

    return new ImageResponse(
      <div
        style={{
          position: "relative",
          width: "1080px",
          height: "1920px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          background: "transparent",
        }}
      >
        {/* Background Image */}
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/aegean_cover_pic.jpg-TqWjTXyrOgk8vHs2F2hyZqOkEU3Gaf.jpeg"
          alt="Event Background"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Darker, more blurred overlay for better text readability */}
        <div
          style={{
            position: "absolute",
            top: "400px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90%",
            padding: "40px",
            backgroundColor: "rgba(0, 0, 0, 0.8)", // Increased opacity for darker background
            borderRadius: "24px",
            backdropFilter: "blur(15px)", // Increased blur effect
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)", // Added shadow for depth
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {/* Greeting */}
          <div 
            style={{ 
              fontSize: "48px", 
              fontWeight: "bold", 
              marginBottom: "20px",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" // Added text shadow
            }}
          >
            HEY,
          </div>

          {/* Name display - highlighted with enhanced visibility */}
          <div
            style={{
              fontSize: "42px", // Increased font size
              fontWeight: "bold",
              marginBottom: "20px",
              color: registrationType === "couple" ? "#f472b6" : "#22d3ee",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)", // Added text shadow
              padding: "10px 20px", // Added padding
              backgroundColor: "rgba(0, 0, 0, 0.4)", // Semi-transparent background
              borderRadius: "12px",
            }}
          >
            {displayText}
          </div>

          {/* Invitation text */}
          <div 
            style={{ 
              fontSize: "32px", 
              lineHeight: "1.4", 
              marginBottom: "20px", 
              whiteSpace: "pre-wrap",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" // Added text shadow
            }}
          >
            {inviteText}
          </div>

          {/* Event description */}
          <div 
            style={{ 
              fontSize: "24px", 
              lineHeight: "1.5", 
              opacity: 1, // Changed from 0.9 to 1 for better visibility
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)" // Added text shadow
            }}
          >
            Join us for an electrifying evening as LRC x Stellar Entertainment brings you The Aegean Escape— an
            immersive sundowner event that blends Grecian aesthetics with futuristic vibes.
          </div>
        </div>
      </div>,
      {
        width: 1080,
        height: 1920,
      },
    )
  } catch (error) {
    console.error("Error generating image:", error)
    return new Response("Error generating image", { status: 500 })
  }
}