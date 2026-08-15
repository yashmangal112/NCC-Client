// lib/suggestions.js

const SUGGESTIONS_DEFAULT = {
  home: [
    { label: "This weekend", message: "What's happening this weekend?" },
    { label: "Free events", message: "Show me free events" },
    { label: "Tonight", message: "Anything happening tonight?" },
    { label: "Surprise me", message: "Surprise me" },
    { label: "This month", message: "What's coming up this month?" },
  ],
  music: [
    { label: "Live gigs", message: "Show me live music gigs" },
    { label: "This month", message: "Any concerts this month?" },
    { label: "Tonight", message: "What's playing tonight?" },
    { label: "Free shows", message: "Show me free music events" },
    { label: "This weekend", message: "Any gigs this weekend?" },
  ],
  comedy: [
    { label: "This weekend", message: "Any stand-up shows this weekend?" },
    { label: "Free shows", message: "Show me free comedy shows" },
    { label: "Open mics", message: "Open mics near me" },
    { label: "Tonight", message: "Any comedy shows tonight?" },
    { label: "This month", message: "Comedy shows this month" },
  ],
  sports: [
    { label: "This weekend", message: "What's on this weekend?" },
    { label: "Live matches", message: "Show me live matches" },
    { label: "Free entry", message: "Any free sports events?" },
    { label: "Tonight", message: "Any matches tonight?" },
    { label: "This month", message: "Sports events this month" },
  ],
  festivals: [
    { label: "This month", message: "Festivals this month" },
    { label: "This weekend", message: "Any festivals this weekend?" },
    { label: "Free entry", message: "Free festivals near me" },
    { label: "Tonight", message: "Anything tonight?" },
    { label: "Surprise me", message: "Surprise me" },
  ],
  nightlife: [
    { label: "This weekend", message: "Best parties this weekend" },
    { label: "Free entry", message: "Any free entry nights?" },
    { label: "Tonight", message: "What's on tonight?" },
    { label: "This month", message: "Nightlife events this month" },
    { label: "Surprise me", message: "Surprise me" },
  ],
  fnb: [
    { label: "Food festivals", message: "Food festivals this month" },
    { label: "Free tastings", message: "Any free tasting events?" },
    { label: "This weekend", message: "Food events this weekend" },
    { label: "Tonight", message: "Anything tonight?" },
    { label: "Surprise me", message: "Surprise me" },
  ],
  theatre: [
    { label: "This month", message: "Plays running this month" },
    { label: "This weekend", message: "Anything this weekend?" },
    { label: "Free shows", message: "Any free theatre shows?" },
    { label: "Tonight", message: "Any shows tonight?" },
    { label: "Surprise me", message: "Surprise me" },
  ],
  activities: [
    { label: "This weekend", message: "Fun things to do this weekend" },
    { label: "Kid-friendly", message: "Kid-friendly activities" },
    { label: "Free", message: "Free activities near me" },
    { label: "This month", message: "Activities this month" },
    { label: "Surprise me", message: "Surprise me" },
  ],
  workshops: [
    { label: "This month", message: "Workshops this month" },
    { label: "Free workshops", message: "Any free workshops?" },
    { label: "This weekend", message: "Workshops this weekend" },
    { label: "Surprise me", message: "Surprise me" },
    { label: "Tonight", message: "Any workshops tonight?" },
  ],
  wellness: [
    { label: "Yoga & fitness", message: "Yoga or fitness events" },
    { label: "This weekend", message: "Anything this weekend?" },
    { label: "Free sessions", message: "Any free wellness sessions?" },
    { label: "This month", message: "Wellness events this month" },
    { label: "Surprise me", message: "Surprise me" },
  ],
  screenings: [
    { label: "This weekend", message: "Screenings this weekend" },
    { label: "Free screenings", message: "Any free screenings?" },
    { label: "This month", message: "Screenings this month" },
    { label: "Tonight", message: "Any screenings tonight?" },
    { label: "Surprise me", message: "Surprise me" },
  ],
  experiential_performances: [
    { label: "This weekend", message: "Any shows this weekend?" },
    { label: "This month", message: "Shows this month" },
    { label: "Free entry", message: "Any free performances?" },
    { label: "Tonight", message: "Anything tonight?" },
    { label: "Surprise me", message: "Surprise me" },
  ],
  conferences: [
    { label: "This month", message: "Conferences this month" },
    { label: "Free entry", message: "Any free conferences?" },
    { label: "This weekend", message: "Conferences this weekend" },
    { label: "Surprise me", message: "Surprise me" },
    { label: "Tonight", message: "Any events tonight?" },
  ],
  exhibitions: [
    { label: "This month", message: "Exhibitions this month" },
    { label: "Free entry", message: "Any free exhibitions?" },
    { label: "This weekend", message: "Exhibitions this weekend" },
    { label: "Tonight", message: "Anything tonight?" },
    { label: "Surprise me", message: "Surprise me" },
  ],
  spoken_word: [
    { label: "This weekend", message: "Spoken word events this weekend" },
    { label: "Free events", message: "Any free spoken word events?" },
    { label: "This month", message: "Spoken word this month" },
    { label: "Tonight", message: "Anything tonight?" },
    { label: "Surprise me", message: "Surprise me" },
  ],
};

const GENERIC_SUGGESTIONS = [
  { label: "This weekend", message: "What's happening this weekend?" },
  { label: "Free events", message: "Show me free events" },
  { label: "Tonight", message: "Anything happening tonight?" },
];

function buildSuggestions(tab, city) {
  const base = SUGGESTIONS_DEFAULT[tab] || GENERIC_SUGGESTIONS;
  const list = city && city !== 'ALL'
    ? base.map((s) =>
        s.message.toLowerCase().includes('this weekend')
          ? { label: s.label, message: `${s.message} in ${city}` }
          : s
      )
    : base;

  return list.slice(0, 6);
}

module.exports = { buildSuggestions };