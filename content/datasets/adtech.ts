/**
 * Reusable adtech datasets.
 *
 * The learner works in performance marketing on a team that runs search and
 * native ads. Lessons import from here so examples feel consistent across the
 * curriculum and match the shape of real workbooks the team operates.
 *
 * Naming convention reflected here:
 *   [buyer_prefix]-[country]-[device]-[vertical_prefix][keyword_list][lang]-
 *   [domain_prefix]-[id]-[ddmmyy]-[campaign_type]-[seq]-[content_angle]-[bid_type]
 *
 * Example: `yc-mx-a-card9999es-mts-4378857-010526-permax-1-newarticle-bid`
 *   yc       = Yoav Cohen (buyer)
 *   mx       = Mexico
 *   a        = device (m/d/a = mobile/desktop/all)
 *   card9999 = Car Deals vertical, keyword list 9999
 *   es       = Spanish (language)
 *   mts      = Mytips.com (domain)
 *   4378857  = internal article id
 *   010526   = creation date 1 May 2026
 *   permax   = Performance Max (Google campaign type)
 *   1        = sequence
 *   newarticle = content angle
 *   bid      = bidding strategy tail
 */

export type CellPrimitive = string | number | boolean | null;
export type SheetData = CellPrimitive[][];

// ---------------------------------------------------------------------------
// Platforms and feeds
// ---------------------------------------------------------------------------

export const PLATFORMS = [
  "Taboola",
  "Outbrain",
  "MediaGo",
  "Poppin",
  "Facebook",
  "TikTok",
  "Google",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_CATEGORIES: Record<Platform, "Native" | "Social" | "Search"> = {
  Taboola: "Native",
  Outbrain: "Native",
  MediaGo: "Native",
  Poppin: "Native",
  Facebook: "Social",
  TikTok: "Social",
  Google: "Search",
};

/**
 * Platform × Feed grid. Mirrors the team's "Allowed accounts" tab: which
 * platform supports which feed (Tonic Rsoc, S1-D, Traffic Club, Inuvo-D).
 */
export const PLATFORMS_FEEDS: Record<Platform, readonly string[]> = {
  Taboola: ["Tonic Rsoc", "S1-D", "Traffic Club"],
  Google: ["Tonic Rsoc", "Traffic Club"],
  MediaGo: ["Tonic Rsoc", "Inuvo-D", "S1-D", "Traffic Club"],
  Poppin: ["Tonic Rsoc", "Inuvo-D", "S1-D", "Traffic Club"],
  TikTok: ["Tonic Rsoc"],
  Outbrain: ["Tonic Rsoc", "Inuvo-D", "S1-D", "Traffic Club"],
  Facebook: ["Tonic Rsoc", "Traffic Club"],
};

// ---------------------------------------------------------------------------
// Verticals
// ---------------------------------------------------------------------------

/**
 * Verticals used across the curriculum, with the team's 4-letter prefix and
 * Google ads category. Drawn from the team's offer-naming sheet. Every vertical
 * name ends in " PR" by team convention.
 */
export const VERTICALS_DETAIL = [
  { name: "Car Deals PR", prefix: "card", category: "Autos & Vehicles" },
  { name: "Bathroom Remodeling PR", prefix: "bath", category: "Home & Garden" },
  { name: "Cruises PR", prefix: "crui", category: "Travel & Transportation" },
  { name: "Hearing Aids PR", prefix: "hear", category: "Health" },
  { name: "Online MBA PR", prefix: "onmb", category: "Jobs & Education" },
  { name: "Dental Implants PR", prefix: "deim", category: "Health" },
  { name: "Solar Systems & Panels PR", prefix: "sola", category: "Business & Industrial" },
  { name: "Senior Living PR", prefix: "seli", category: "People & Society" },
  { name: "Pet Insurance PR", prefix: "peti", category: "Finance" },
  { name: "Cleaning Services PR", prefix: "clea", category: "Home & Garden" },
  { name: "Roofing Services PR", prefix: "roof", category: "Home & Garden" },
  { name: "Reverse Mortgage PR", prefix: "reve", category: "Finance" },
  { name: "Tires PR", prefix: "tire", category: "Autos & Vehicles" },
  { name: "Cremation Services PR", prefix: "crem", category: "People & Society" },
  { name: "Funeral PR", prefix: "fune", category: "People & Society" },
  { name: "SUV Deals PR", prefix: "suvd", category: "Autos & Vehicles" },
  { name: "Storage Units PR", prefix: "stor", category: "Business & Industrial" },
  { name: "Stair Lift PR", prefix: "stai", category: "Computers & Electronics" },
  { name: "Credit Cards PR", prefix: "cred", category: "Finance" },
  { name: "MBA Degrees PR", prefix: "mbad", category: "Jobs & Education" },
  { name: "Apartments For Rent PR", prefix: "apar", category: "Real Estate" },
  { name: "Lasik Eye Surgery PR", prefix: "lasi", category: "Health" },
  { name: "Cataract Surgery PR", prefix: "cata", category: "Health" },
  { name: "Hair Transplantation PR", prefix: "hatr", category: "Health" },
  { name: "Locksmith PR", prefix: "lock", category: "Home & Garden" },
  { name: "Funeral Insurance PR", prefix: "fuin", category: "Finance" },
  { name: "Mattress PR", prefix: "matt", category: "Home & Garden" },
  { name: "HVAC PR", prefix: "hvac", category: "Home & Garden" },
  { name: "Personal Loans PR", prefix: "pers", category: "Finance" },
  { name: "Internet Providers PR", prefix: "inte", category: "Internet & Telecom" },
] as const;

export const VERTICALS = VERTICALS_DETAIL.map((v) => v.name);

// ---------------------------------------------------------------------------
// Buyers
// ---------------------------------------------------------------------------

/**
 * The buyer roster. Two-letter prefixes are the first segment of every
 * campaign name, matching the team's actual practice.
 */
export const BUYERS_DETAIL = [
  { name: "Yoav Cohen", prefix: "yc", team: "Native EMEA" },
  { name: "Dina Dayan", prefix: "dd", team: "Native LatAm" },
  { name: "Maya Bar", prefix: "mb", team: "Native APAC" },
  { name: "Eitan Kohen", prefix: "ek", team: "Native EMEA" },
  { name: "Roni Levi", prefix: "rl", team: "Search NAM" },
  { name: "Ben Nahum", prefix: "bn", team: "Mixed EMEA" },
  { name: "Gal Vered", prefix: "gv", team: "Native EMEA" },
  { name: "Shira Hadad", prefix: "sh", team: "Native EMEA" },
] as const;

export const BUYERS = BUYERS_DETAIL.map((b) => b.name);

// ---------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------

/**
 * Domain prefix → full domain. The campaign name carries the prefix; the
 * uploader and the article URLs reference the full domain. Pulled from the
 * team's domain mapping tab.
 */
export const DOMAINS_DETAIL = [
  { prefix: "mts", domain: "Mytips.com" },
  { prefix: "ift", domain: "Infotos.com" },
  { prefix: "ncr", domain: "notioncrest.com" },
  { prefix: "toe", domain: "trapoftense.com" },
  { prefix: "lon", domain: "loopofnow.com" },
  { prefix: "mpp", domain: "mapinpocket.com" },
  { prefix: "vsn", domain: "Visionaryeco.com" },
  { prefix: "lcp", domain: "LocalPlan.co" },
  { prefix: "ffz", domain: "Findingfrenzy.com" },
  { prefix: "trd", domain: "travelerdreams.com" },
  { prefix: "tpd", domain: "toppoptoday.com" },
  { prefix: "yss", domain: "yoursportspot.com" },
  { prefix: "mob", domain: "mobispirit.com" },
  { prefix: "plw", domain: "plainwindow.com" },
  { prefix: "fnw", domain: "funniesnow.com" },
  { prefix: "csd", domain: "curiositydive.com" },
  { prefix: "tdm", domain: "todaymdrn.com" },
  { prefix: "fih", domain: "foodisinthehouse.com" },
  { prefix: "lis", domain: "litemass.com" },
  { prefix: "ars", domain: "answersgalore.net" },
] as const;

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------

/**
 * Country → bid table. CPC and MAXCV bids the team uses for Tonic Rsoc and
 * Inuvo feeds. Mirrors the country bid sheet.
 */
export const COUNTRIES_BIDS = [
  { country: "US", cpc: 0.08, maxcv: 0.2, fixedCpc: 0.04 },
  { country: "DE", cpc: 0.06, maxcv: 0.2, fixedCpc: 0.04 },
  { country: "UK", cpc: 0.05, maxcv: 0.19, fixedCpc: 0.035 },
  { country: "IT", cpc: 0.03, maxcv: 0.12, fixedCpc: 0.015 },
  { country: "FR", cpc: 0.03, maxcv: 0.12, fixedCpc: 0.02 },
  { country: "ES", cpc: 0.025, maxcv: 0.15, fixedCpc: null },
  { country: "CA", cpc: 0.045, maxcv: 0.2, fixedCpc: 0.025 },
  { country: "AU", cpc: 0.06, maxcv: 0.16, fixedCpc: 0.05 },
  { country: "AT", cpc: 0.06, maxcv: 0.2, fixedCpc: 0.05 },
  { country: "NL", cpc: 0.04, maxcv: 0.2, fixedCpc: 0.04 },
  { country: "PL", cpc: 0.022, maxcv: 0.09, fixedCpc: 0.019 },
  { country: "PT", cpc: 0.02, maxcv: 0.11, fixedCpc: 0.01 },
  { country: "MX", cpc: 0.018, maxcv: 0.06, fixedCpc: 0.01 },
  { country: "BR", cpc: 0.12, maxcv: 0.05, fixedCpc: 0.1 },
  { country: "HU", cpc: 0.025, maxcv: 0.08, fixedCpc: 0.024 },
  { country: "SE", cpc: 0.05, maxcv: 0.14, fixedCpc: 0.03 },
  { country: "NO", cpc: 0.05, maxcv: 0.24, fixedCpc: 0.042 },
  { country: "DK", cpc: 0.05, maxcv: 0.12, fixedCpc: 0.036 },
  { country: "BE", cpc: 0.05, maxcv: 0.2, fixedCpc: 0.05 },
  { country: "CZ", cpc: 0.4, maxcv: 0.11, fixedCpc: 0.03 },
  { country: "CH", cpc: 0.07, maxcv: 0.25, fixedCpc: 0.07 },
  { country: "NZ", cpc: 0.04, maxcv: 0.11, fixedCpc: 0.02 },
  { country: "IE", cpc: 0.036, maxcv: 0.1, fixedCpc: 0.02 },
] as const;

// ---------------------------------------------------------------------------
// Naming suffixes (campaign categorization tags)
// ---------------------------------------------------------------------------

/**
 * Internal tags appended to campaigns for tracking purpose. The "mb-" stem is
 * a team convention; the trailing letters classify the campaign's strategic
 * intent (Sub Niches, Fast, Research, Scale Me, etc.).
 */
export const NAMING_SUFFIXES = [
  { tag: "mbsn", meaning: "Sub Niches" },
  { tag: "mbdaf", meaning: "Fast" },
  { tag: "mbdar", meaning: "Research" },
  { tag: "mbsm", meaning: "Scale Me" },
  { tag: "mbcm", meaning: "Competitors" },
  { tag: "mbsr", meaning: "Sisters" },
  { tag: "mbex", meaning: "Exp" },
  { tag: "mbot", meaning: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Campaign types (the segment in the campaign name like "permax", "rsoc")
// ---------------------------------------------------------------------------

export const CAMPAIGN_TYPES = [
  { code: "permax", name: "Performance Max", platform: "Google" },
  { code: "rsoc", name: "Tonic RSOC", platform: "Multi" },
  { code: "s1d", name: "S1-D", platform: "Multi" },
  { code: "tc", name: "Traffic Club", platform: "Multi" },
] as const;

// ---------------------------------------------------------------------------
// CAMPAIGNS: the flagship dataset. 12 campaigns across early May 2026.
// Column shape preserved from the v1 dataset so all existing lesson grading
// rules and assignment specs continue to work without rewiring:
//   A: Date | B: Buyer | C: Vertical | D: Platform | E: Spend | F: Revenue
// SUM(E2:E13) = 3933.68 (the lesson 3 SUM target).
// ---------------------------------------------------------------------------

export const CAMPAIGNS: SheetData = [
  ["Date", "Buyer", "Vertical", "Platform", "Spend", "Revenue"],
  ["2026-05-01", "Yoav Cohen", "Car Deals PR", "Google", 342.18, 487.3],
  ["2026-05-01", "Dina Dayan", "Bathroom Remodeling PR", "Taboola", 215.5, 198.4],
  ["2026-05-02", "Maya Bar", "Cruises PR", "Outbrain", 512.0, 1124.6],
  ["2026-05-03", "Eitan Kohen", "Hearing Aids PR", "Taboola", 187.25, 245.8],
  ["2026-05-03", "Roni Levi", "Online MBA PR", "Facebook", 432.7, 380.2],
  ["2026-05-04", "Ben Nahum", "Dental Implants PR", "Google", 605.1, 588.4],
  ["2026-05-05", "Yoav Cohen", "Solar Systems & Panels PR", "Outbrain", 318.45, 401.9],
  ["2026-05-06", "Dina Dayan", "Senior Living PR", "Google", 296.4, 412.15],
  ["2026-05-07", "Maya Bar", "Pet Insurance PR", "MediaGo", 224.6, 461.2],
  ["2026-05-08", "Gal Vered", "Cleaning Services PR", "TikTok", 178.9, 322.05],
  ["2026-05-09", "Shira Hadad", "Roofing Services PR", "Poppin", 142.3, 89.5],
  ["2026-05-10", "Ben Nahum", "Reverse Mortgage PR", "Google", 478.3, 982.7],
];

// ---------------------------------------------------------------------------
// CAMPAIGNS_FULL: same 12 rows, enriched with Country, Campaign Name, and
// Domain prefix. Used by lessons that teach campaign-name parsing (text
// manipulation, SPLIT/JOIN, REGEX) and country-aware lookups. Schema:
//   A: Date | B: Buyer | C: Vertical | D: Platform | E: Spend | F: Revenue
//   G: Country | H: Campaign Name | I: Domain
// ---------------------------------------------------------------------------

export const CAMPAIGNS_FULL: SheetData = [
  ["Date", "Buyer", "Vertical", "Platform", "Spend", "Revenue", "Country", "Campaign Name", "Domain"],
  ["2026-05-01", "Yoav Cohen", "Car Deals PR", "Google", 342.18, 487.3, "MX", "yc-mx-a-card9999es-mts-4378857-010526-permax-1-newarticle-bid", "mts"],
  ["2026-05-01", "Dina Dayan", "Bathroom Remodeling PR", "Taboola", 215.5, 198.4, "DE", "dd-de-d-bath1234de-mts-4378512-010526-rsoc-2-existing-tcpa", "mts"],
  ["2026-05-02", "Maya Bar", "Cruises PR", "Outbrain", 512.0, 1124.6, "UK", "mb-uk-d-crui5512en-trd-4380012-020526-rsoc-1-newarticle-cpc", "trd"],
  ["2026-05-03", "Eitan Kohen", "Hearing Aids PR", "Taboola", 187.25, 245.8, "ES", "ek-es-m-hear7281es-mts-4380155-030526-rsoc-1-newarticle-cpc", "mts"],
  ["2026-05-03", "Roni Levi", "Online MBA PR", "Facebook", 432.7, 380.2, "US", "rl-us-d-onmb6500en-trd-4381044-030526-rsoc-1-existing-cpa", "trd"],
  ["2026-05-04", "Ben Nahum", "Dental Implants PR", "Google", 605.1, 588.4, "AT", "bn-at-a-deim8800de-mts-4381901-040526-permax-2-newarticle-bid", "mts"],
  ["2026-05-05", "Yoav Cohen", "Solar Systems & Panels PR", "Outbrain", 318.45, 401.9, "DE", "yc-de-d-sola4502de-mts-4382688-050526-rsoc-1-existing-tcpa", "mts"],
  ["2026-05-06", "Dina Dayan", "Senior Living PR", "Google", 296.4, 412.15, "MX", "dd-mx-a-seli2210es-mts-4380891-060526-permax-1-newarticle-bid", "mts"],
  ["2026-05-07", "Maya Bar", "Pet Insurance PR", "MediaGo", 224.6, 461.2, "IT", "mb-it-d-peti1199it-mpp-4382150-070526-rsoc-1-newarticle-cpc", "mpp"],
  ["2026-05-08", "Gal Vered", "Cleaning Services PR", "TikTok", 178.9, 322.05, "FR", "gv-fr-m-clea3144fr-lon-4382502-080526-rsoc-1-newarticle-cpc", "lon"],
  ["2026-05-09", "Shira Hadad", "Roofing Services PR", "Poppin", 142.3, 89.5, "PL", "sh-pl-a-roof9921pl-trd-4382920-090526-rsoc-1-newarticle-cpc", "trd"],
  ["2026-05-10", "Ben Nahum", "Reverse Mortgage PR", "Google", 478.3, 982.7, "UK", "bn-uk-d-reve6700en-mts-4383300-100526-permax-1-existing-cpa", "mts"],
];

// ---------------------------------------------------------------------------
// CAMPAIGNS_LARGE: 60 rows across April–May 2026. Used by Track 2 lessons
// that need enough data for meaningful pivot tables, group-by aggregations,
// and rolled-up dashboards (12 rows isn't enough). Same column shape as
// CAMPAIGNS so existing helpers and grading patterns work unchanged.
// Distribution mirrors a real two-month team log:
//   - All 8 buyers, varying activity
//   - All 7 platforms
//   - 14 verticals (subset of VERTICALS)
//   - 14 countries
//   - ~70% profitable rows, ~30% losing rows
//   - Spend ~$80-$1400, Revenue ~$0-$2800
// ---------------------------------------------------------------------------

export const CAMPAIGNS_LARGE: SheetData = [
  ["Date", "Buyer", "Vertical", "Platform", "Country", "Spend", "Revenue"],
  // Week 1 (2026-04-06 to 2026-04-12)
  ["2026-04-06", "Yoav Cohen", "Car Deals PR", "Google", "MX", 412.5, 587.4],
  ["2026-04-06", "Dina Dayan", "Bathroom Remodeling PR", "Taboola", "DE", 285.3, 198.0],
  ["2026-04-07", "Maya Bar", "Cruises PR", "Outbrain", "UK", 612.0, 1284.6],
  ["2026-04-07", "Eitan Kohen", "Hearing Aids PR", "Taboola", "ES", 187.25, 245.8],
  ["2026-04-08", "Roni Levi", "Online MBA PR", "Facebook", "US", 532.7, 480.2],
  ["2026-04-09", "Ben Nahum", "Dental Implants PR", "Google", "AT", 705.1, 1188.4],
  ["2026-04-10", "Yoav Cohen", "Solar Systems & Panels PR", "Outbrain", "DE", 318.45, 401.9],
  ["2026-04-11", "Gal Vered", "Cleaning Services PR", "TikTok", "FR", 198.9, 322.05],
  ["2026-04-12", "Shira Hadad", "Roofing Services PR", "Poppin", "PL", 152.3, 89.5],
  // Week 2 (2026-04-13 to 2026-04-19)
  ["2026-04-13", "Dina Dayan", "Senior Living PR", "Google", "MX", 296.4, 412.15],
  ["2026-04-13", "Maya Bar", "Pet Insurance PR", "MediaGo", "IT", 224.6, 461.2],
  ["2026-04-14", "Yoav Cohen", "Tires PR", "Google", "DE", 388.0, 542.3],
  ["2026-04-14", "Ben Nahum", "Reverse Mortgage PR", "Google", "UK", 478.3, 982.7],
  ["2026-04-15", "Eitan Kohen", "SUV Deals PR", "Taboola", "ES", 312.5, 450.8],
  ["2026-04-15", "Roni Levi", "Credit Cards PR", "Facebook", "US", 612.4, 1102.5],
  ["2026-04-16", "Dina Dayan", "Stair Lift PR", "Outbrain", "DE", 245.0, 198.5],
  ["2026-04-17", "Maya Bar", "Cruises PR", "Outbrain", "UK", 588.0, 1240.0],
  ["2026-04-18", "Gal Vered", "Apartments For Rent PR", "TikTok", "FR", 211.5, 388.4],
  ["2026-04-19", "Shira Hadad", "Roofing Services PR", "Poppin", "PL", 142.0, 95.2],
  // Week 3 (2026-04-20 to 2026-04-26)
  ["2026-04-20", "Yoav Cohen", "Car Deals PR", "Google", "MX", 425.0, 612.8],
  ["2026-04-20", "Dina Dayan", "Bathroom Remodeling PR", "Taboola", "DE", 282.5, 215.3],
  ["2026-04-21", "Eitan Kohen", "Hearing Aids PR", "Taboola", "IT", 195.8, 268.4],
  ["2026-04-21", "Ben Nahum", "Dental Implants PR", "Google", "AT", 712.0, 1245.6],
  ["2026-04-22", "Maya Bar", "Pet Insurance PR", "MediaGo", "AU", 232.4, 488.5],
  ["2026-04-23", "Roni Levi", "Online MBA PR", "Facebook", "CA", 545.0, 488.2],
  ["2026-04-24", "Yoav Cohen", "Solar Systems & Panels PR", "Outbrain", "DE", 322.5, 415.8],
  ["2026-04-25", "Gal Vered", "Cleaning Services PR", "TikTok", "FR", 205.4, 342.0],
  ["2026-04-26", "Shira Hadad", "Locksmith PR", "Poppin", "NL", 138.5, 215.8],
  // Week 4 (2026-04-27 to 2026-05-03)
  ["2026-04-27", "Dina Dayan", "Senior Living PR", "Google", "ES", 305.5, 425.0],
  ["2026-04-27", "Maya Bar", "Cataract Surgery PR", "MediaGo", "UK", 442.0, 612.5],
  ["2026-04-28", "Eitan Kohen", "SUV Deals PR", "Taboola", "DE", 318.0, 378.4],
  ["2026-04-29", "Ben Nahum", "Reverse Mortgage PR", "Google", "UK", 482.5, 945.0],
  ["2026-04-30", "Roni Levi", "Credit Cards PR", "Facebook", "US", 625.0, 1188.0],
  ["2026-05-01", "Yoav Cohen", "Car Deals PR", "Google", "MX", 342.18, 487.3],
  ["2026-05-01", "Dina Dayan", "Bathroom Remodeling PR", "Taboola", "DE", 215.5, 198.4],
  ["2026-05-02", "Maya Bar", "Cruises PR", "Outbrain", "UK", 512.0, 1124.6],
  ["2026-05-03", "Eitan Kohen", "Hearing Aids PR", "Taboola", "ES", 187.25, 245.8],
  // Week 5 (2026-05-04 to 2026-05-10)
  ["2026-05-03", "Roni Levi", "Online MBA PR", "Facebook", "US", 432.7, 380.2],
  ["2026-05-04", "Ben Nahum", "Dental Implants PR", "Google", "AT", 605.1, 588.4],
  ["2026-05-05", "Yoav Cohen", "Solar Systems & Panels PR", "Outbrain", "DE", 318.45, 401.9],
  ["2026-05-06", "Dina Dayan", "Senior Living PR", "Google", "MX", 296.4, 412.15],
  ["2026-05-07", "Maya Bar", "Pet Insurance PR", "MediaGo", "IT", 224.6, 461.2],
  ["2026-05-08", "Gal Vered", "Cleaning Services PR", "TikTok", "FR", 178.9, 322.05],
  ["2026-05-09", "Shira Hadad", "Roofing Services PR", "Poppin", "PL", 142.3, 89.5],
  ["2026-05-10", "Ben Nahum", "Reverse Mortgage PR", "Google", "UK", 478.3, 982.7],
  // Week 6 (2026-05-11 to 2026-05-17)
  ["2026-05-11", "Eitan Kohen", "SUV Deals PR", "Taboola", "ES", 295.0, 348.2],
  ["2026-05-12", "Roni Levi", "Credit Cards PR", "Facebook", "CA", 588.5, 1052.0],
  ["2026-05-13", "Yoav Cohen", "Tires PR", "Google", "MX", 365.2, 522.8],
  ["2026-05-14", "Dina Dayan", "Apartments For Rent PR", "Taboola", "BR", 248.0, 215.5],
  ["2026-05-15", "Maya Bar", "Cataract Surgery PR", "MediaGo", "AU", 412.0, 685.0],
  ["2026-05-15", "Ben Nahum", "Dental Implants PR", "Google", "DE", 642.5, 1085.4],
  ["2026-05-16", "Gal Vered", "Cleaning Services PR", "TikTok", "FR", 195.4, 358.0],
  ["2026-05-17", "Shira Hadad", "Locksmith PR", "Poppin", "PL", 145.0, 188.2],
  // Week 7 (2026-05-18 to 2026-05-24)
  ["2026-05-18", "Yoav Cohen", "Car Deals PR", "Google", "ES", 405.5, 612.0],
  ["2026-05-19", "Dina Dayan", "Bathroom Remodeling PR", "Taboola", "MX", 268.0, 305.4],
  ["2026-05-20", "Eitan Kohen", "Hearing Aids PR", "Taboola", "DE", 205.0, 318.5],
  ["2026-05-21", "Ben Nahum", "Reverse Mortgage PR", "Google", "UK", 495.0, 988.0],
  ["2026-05-22", "Roni Levi", "Online MBA PR", "Facebook", "US", 568.5, 612.4],
  ["2026-05-23", "Maya Bar", "Cruises PR", "Outbrain", "UK", 605.0, 1320.0],
  ["2026-05-24", "Yoav Cohen", "Solar Systems & Panels PR", "Outbrain", "DE", 332.5, 425.0],
];

// ---------------------------------------------------------------------------
// CAMPAIGNS_TIMESERIES: 30 consecutive days of team-wide daily totals.
// Used by chart lessons (line, area, sparkline, secondary-axis). The shape
// tells a story: gradual rise mid-month from a winning campaign launch on
// 2026-04-15, weekly seasonality (weekends slightly down), and one outlier
// day on 2026-04-22 (low spend due to a pixel issue). Schema:
//   A: Date | B: Spend | C: Revenue | D: Clicks | E: Impressions | F: Conversions
// ---------------------------------------------------------------------------

export const CAMPAIGNS_TIMESERIES: SheetData = [
  ["Date", "Spend", "Revenue", "Clicks", "Impressions", "Conversions"],
  ["2026-04-01", 1845.2, 2102.5, 12450, 845200, 312],
  ["2026-04-02", 1912.4, 2245.8, 12880, 862100, 328],
  ["2026-04-03", 2018.0, 2402.0, 13420, 884500, 345],
  ["2026-04-04", 1652.5, 1985.4, 11250, 745800, 285],
  ["2026-04-05", 1488.0, 1820.5, 10120, 692400, 258],
  ["2026-04-06", 1925.4, 2348.0, 13050, 870500, 332],
  ["2026-04-07", 2045.8, 2502.4, 13780, 902800, 358],
  ["2026-04-08", 2118.5, 2622.0, 14250, 928400, 372],
  ["2026-04-09", 2202.0, 2718.5, 14820, 952100, 388],
  ["2026-04-10", 2295.4, 2848.0, 15420, 985200, 408],
  ["2026-04-11", 1812.5, 2298.4, 12680, 815400, 318],
  ["2026-04-12", 1645.0, 2055.0, 11280, 728500, 285],
  ["2026-04-13", 2188.5, 2752.0, 14580, 945800, 392],
  ["2026-04-14", 2305.0, 2912.5, 15280, 982400, 412],
  ["2026-04-15", 2812.5, 3654.0, 18450, 1105800, 502], // launch day spike
  ["2026-04-16", 2945.4, 3845.5, 19200, 1148200, 525],
  ["2026-04-17", 3018.0, 3958.4, 19620, 1172500, 545],
  ["2026-04-18", 2545.0, 3402.5, 16850, 1018400, 462],
  ["2026-04-19", 2305.4, 3088.0, 15280, 925800, 418],
  ["2026-04-20", 2918.5, 3902.5, 19120, 1148000, 538],
  ["2026-04-21", 3045.0, 4088.4, 19880, 1180500, 558],
  ["2026-04-22", 1185.0, 1542.0, 7820, 462000, 218], // pixel issue day
  ["2026-04-23", 2885.4, 3845.5, 18820, 1132400, 528],
  ["2026-04-24", 3105.0, 4188.0, 20280, 1212500, 575],
  ["2026-04-25", 2645.0, 3552.5, 17280, 1042800, 488],
  ["2026-04-26", 2402.5, 3245.4, 15820, 952400, 442],
  ["2026-04-27", 3045.0, 4128.0, 19880, 1188500, 565],
  ["2026-04-28", 3168.5, 4302.5, 20620, 1228400, 588],
  ["2026-04-29", 3245.0, 4412.0, 21080, 1252500, 605],
  ["2026-04-30", 3322.4, 4525.5, 21520, 1278800, 622],
];

// ---------------------------------------------------------------------------
// FORM_RESPONSES: sample output of a Google Form connected to a Sheet.
// Used by the Forms → Sheets pipeline lesson. The shape is what learners
// see in the wild: a Timestamp column Sheets stamps automatically, an
// Email Address from authenticated submitters, plus the question fields.
// Includes a few realistic edge cases: mixed-case emails, an empty optional
// field, and one duplicate-looking row.
// Schema:
//   A: Timestamp | B: Email Address | C: Name | D: Team | E: Primary platform
//   F: Years in adtech | G: Newsletter | H: Comments
// ---------------------------------------------------------------------------

export const FORM_RESPONSES: SheetData = [
  ["Timestamp", "Email Address", "Name", "Team", "Primary platform", "Years in adtech", "Newsletter", "Comments"],
  ["2026-05-01 09:14:22", "yoav.cohen@flexelent.com", "Yoav Cohen", "Native EMEA", "Google", 6, "Yes", "Looking forward to the workshop."],
  ["2026-05-01 09:18:05", "DINA.DAYAN@flexelent.com", "Dina Dayan", "Native LatAm", "Taboola", 4, "Yes", ""],
  ["2026-05-01 09:22:48", "maya.bar@flexelent.com", "Maya Bar", "Native APAC", "Outbrain", 3, "No", "Will join remotely from Tokyo."],
  ["2026-05-01 09:31:12", "eitan.kohen@flexelent.com", "Eitan Kohen", "Native EMEA", "Taboola", 1, "Yes", "First conference, looking forward to it"],
  ["2026-05-01 09:45:33", "roni.levi@flexelent.com", "Roni Levi", "Search NAM", "Facebook", 8, "Yes", "Can we add a session on attribution?"],
  ["2026-05-01 10:02:14", "ben.nahum@flexelent.com", "Ben Nahum", "Mixed EMEA", "Google", 5, "No", ""],
  ["2026-05-01 10:18:55", "gal.vered@flexelent.com", "Gal Vered", "Native EMEA", "TikTok", 2, "Yes", "TikTok session please."],
  ["2026-05-01 10:25:08", "shira.hadad@flexelent.com", "Shira Hadad", "Native EMEA", "Poppin", 3, "Yes", "Vegetarian meals if possible"],
  ["2026-05-01 11:08:42", "yoav.cohen@flexelent.com", "Yoav Cohen", "Native EMEA", "Google", 6, "Yes", "Re-submitting, forgot one answer"], // duplicate-ish
  ["2026-05-02 08:32:18", "dina.dayan@flexelent.com", "Dina Dayan", "Native LatAm", "Outbrain", 4, "Yes", "Will need a parking spot."],
  ["2026-05-02 09:12:55", "eitan.kohen@flexelent.com", "Eitan Kohen", "Native EMEA", "MediaGo", 1, "No", ""],
  ["2026-05-02 09:48:30", "roni.levi@flexelent.com", "Roni Levi", "Search NAM", "Google", 8, "Yes", "Can I bring a colleague?"],
  ["2026-05-02 10:22:14", "ben.nahum@flexelent.com", "Ben Nahum", "Mixed EMEA", "Facebook", 5, "Yes", "Nut allergy"],
  ["2026-05-02 11:05:42", "maya.bar@flexelent.com", "Maya Bar", "Native APAC", "TikTok", 3, "No", ""],
  ["2026-05-02 13:18:08", "gal.vered@flexelent.com", "Gal Vered", "Native EMEA", "Outbrain", 2, "Yes", "Looking forward to networking"],
  ["2026-05-02 14:32:55", "shira.hadad@flexelent.com", "Shira Hadad", "Native EMEA", "Taboola", 3, "Yes", ""],
  ["2026-05-03 08:15:22", "yoav.cohen@flexelent.com", "Yoav Cohen", "Native EMEA", "Outbrain", 6, "No", "Plus one for spouse?"],
  ["2026-05-03 09:42:18", "dina.dayan@flexelent.com", "Dina Dayan", "Native LatAm", "Google", 4, "Yes", "Sessions in Spanish?"],
  ["2026-05-03 10:55:33", "ben.nahum@flexelent.com", "Ben Nahum", "Mixed EMEA", "Outbrain", 5, "Yes", ""],
  ["2026-05-03 13:08:42", "eitan.kohen@flexelent.com", "Eitan Kohen", "Native EMEA", "Google", 1, "Yes", "Will arrive Sunday evening"],
];

// ---------------------------------------------------------------------------
// MESSY_CAMPAIGNS: intentionally dirty version of CAMPAIGNS for the data
// cleanup recipes lesson. Each row exhibits at least one realistic problem:
//   - Leading/trailing whitespace in text columns
//   - Inconsistent casing on buyer/vertical names
//   - Mixed date formats (ISO, US, long-form)
//   - Numbers stored as text (with leading $ or trailing space)
//   - Duplicate rows
//   - A vertical typo missing the "s" in PR
//   - Empty cells in required columns
// The grader checks that the learner produced a CLEAN version that matches
// the canonical CAMPAIGNS values for the same row dates and buyer names.
// ---------------------------------------------------------------------------

export const MESSY_CAMPAIGNS: SheetData = [
  ["Date", "Buyer", "Vertical", "Platform", "Spend", "Revenue"],
  ["2026-05-01", "Yoav Cohen", "Car Deals PR", "Google", 342.18, 487.3],
  ["5/1/2026", "  Dina Dayan", "Bathroom Remodeling PR", "Taboola ", 215.5, 198.4], // whitespace
  ["2026-05-02", "maya bar", "Cruises PR", "Outbrain", 512.0, 1124.6], // lowercase buyer
  ["May 3, 2026", "Eitan Kohen", "Hearing Aids PR", "Taboola", "187.25", 245.8], // long date + numeric-as-text
  ["2026-05-03", "Roni Levi", "Online MBA PR", "Facebook", 432.7, "$380.20"], // currency-as-text
  ["2026-05-04", "Ben Nahum", "Dental Implants PR", "Google", 605.1, 588.4],
  ["2026-05-04", "Ben Nahum", "Dental Implants PR", "Google", 605.1, 588.4], // duplicate
  ["2026-05-05", "YOAV COHEN", "Solar Systems & Panels PR", "Outbrain", 318.45, 401.9], // uppercase buyer
  ["2026-05-06", "Dina Dayan", "Senior Living P", "Google", 296.4, 412.15], // typo: "P" instead of "PR"
  ["2026-05-07", "Maya Bar", "Pet Insurance PR", "MediaGo", 224.6, 461.2],
  ["", "Gal Vered", "Cleaning Services PR", "TikTok", 178.9, 322.05], // missing date
  ["2026-05-09", "Shira Hadad", "Roofing Services PR", "Poppin", 142.3, 89.5],
  ["5/10/2026", "Ben Nahum", " Reverse Mortgage PR ", "Google", 478.3, 982.7], // mixed date + whitespace
];

// ---------------------------------------------------------------------------
// Lookup tables (the kind the team builds with IMPORTRANGE in real life)
// ---------------------------------------------------------------------------

// Covers every vertical that appears in CAMPAIGNS and CAMPAIGNS_LARGE so a
// learner doing VLOOKUP / XLOOKUP / INDEX-MATCH against this table sees the
// happy path. Lessons that teach the not-found case use MESSY_CAMPAIGNS
// (which intentionally contains a typo'd "Senior Living P") rather than
// holes in this table. CPCs are plausible adtech ranges, not real bids.
export const VERTICALS_LOOKUP: SheetData = [
  ["Vertical", "Category", "Avg CPC"],
  ["Car Deals PR", "Autos & Vehicles", 0.38],
  ["Bathroom Remodeling PR", "Home & Garden", 0.51],
  ["Cruises PR", "Travel & Transportation", 0.62],
  ["Hearing Aids PR", "Health", 1.18],
  ["Online MBA PR", "Jobs & Education", 2.15],
  ["Dental Implants PR", "Health", 1.95],
  ["Solar Systems & Panels PR", "Business & Industrial", 1.05],
  ["Senior Living PR", "People & Society", 1.42],
  ["Pet Insurance PR", "Finance", 0.94],
  ["Cleaning Services PR", "Home & Garden", 0.42],
  ["Roofing Services PR", "Home & Garden", 0.78],
  ["Reverse Mortgage PR", "Finance", 2.4],
  ["Tires PR", "Autos & Vehicles", 0.32],
  ["SUV Deals PR", "Autos & Vehicles", 0.55],
  ["Stair Lift PR", "Computers & Electronics", 1.65],
  ["Credit Cards PR", "Finance", 1.85],
  ["Apartments For Rent PR", "Real Estate", 0.88],
  ["Cataract Surgery PR", "Health", 2.1],
  ["Locksmith PR", "Home & Garden", 0.65],
];

export const BUYERS_LOOKUP: SheetData = [
  ["Buyer", "Prefix", "Team", "Start date"],
  ["Yoav Cohen", "yc", "Native EMEA", "2024-09-15"],
  ["Dina Dayan", "dd", "Native LatAm", "2024-03-12"],
  ["Maya Bar", "mb", "Native APAC", "2025-07-01"],
  ["Eitan Kohen", "ek", "Native EMEA", "2025-11-20"],
  ["Roni Levi", "rl", "Search NAM", "2023-04-08"],
  ["Ben Nahum", "bn", "Mixed EMEA", "2026-01-15"],
  ["Gal Vered", "gv", "Native EMEA", "2025-04-08"],
  ["Shira Hadad", "sh", "Native EMEA", "2024-12-01"],
];

export const PLATFORMS_LOOKUP: SheetData = [
  ["Platform", "Category", "Currency"],
  ["Taboola", "Native", "USD"],
  ["Outbrain", "Native", "USD"],
  ["MediaGo", "Native", "USD"],
  ["Poppin", "Native", "USD"],
  ["Facebook", "Social", "USD"],
  ["TikTok", "Social", "USD"],
  ["Google", "Search", "USD"],
];

export const DOMAINS_LOOKUP: SheetData = [
  ["Domain prefix", "Domain"],
  ...DOMAINS_DETAIL.map((d) => [d.prefix, d.domain] as CellPrimitive[]),
];

export const COUNTRIES_LOOKUP: SheetData = [
  ["Country", "CPC bid", "MAXCV bid", "Fixed CPC"],
  ...COUNTRIES_BIDS.map((c) => [
    c.country,
    c.cpc,
    c.maxcv,
    c.fixedCpc,
  ] as CellPrimitive[]),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * 2D-array translation of a SheetData into AssignmentSpec.seed cells.
 * Each non-undefined cell becomes a {a1, value} entry placed at startCol/startRow.
 */
export function dataToCells(
  data: SheetData,
  startCol = 1,
  startRow = 1,
): Array<{ a1: string; value: CellPrimitive }> {
  const cells: Array<{ a1: string; value: CellPrimitive }> = [];
  for (let r = 0; r < data.length; r++) {
    const row = data[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const value = row[c];
      if (value === undefined) continue;
      const colLetter = numToColLetter(startCol + c);
      const rowNum = startRow + r;
      cells.push({ a1: `${colLetter}${rowNum}`, value });
    }
  }
  return cells;
}

function numToColLetter(n: number): string {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
