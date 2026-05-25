import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// =============================================================
// Seed data — 8 lawyers, 5 clients, posts, conversations, msgs
// =============================================================

const PASSWORD = "Test1234!";

function diceBearAvatar(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=d1e8ff&textColor=1a8cd8`;
}
function diceBearBanner(name: string) {
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(name)}&backgroundColor=1a8cd8,0d6ebd,2ba3f7`;
}

const LAWYERS = [
  {
    email: "adaeze.okoro@legalconnect.ng",
    full_name: "Adaeze Okoro",
    handle: "adaezeokoro",
    phone: "+2348012345001",
    avatar_url: "https://i.pravatar.cc/150?u=adaeze-okoro",
    is_premium: true,
    bio: "Senior corporate law practitioner with over 12 years of experience advising Fortune 500 companies and Nigerian conglomerates on mergers, acquisitions, and regulatory compliance. I have handled transactions worth over ₦50 billion and specialize in cross-border commercial deals.",
    years_of_experience: 12,
    scn: "SCN/2012/45678",
    nba_branch: "Lagos",
    location_state: "Lagos",
    location_city: "Victoria Island",
    specialization_ids: ["corporate-law", "banking-finance"],
    fee_range_min: 75000,
    fee_range_max: 350000,
    verification_status: "verified",
    rating_avg: 4.9,
    rating_count: 24,
    subscription_tier: "elite",
    languages: ["English", "Igbo"],
    education: [
      { institution: "University of Lagos", degree: "LLB", year: 2010 },
      { institution: "Nigerian Law School", degree: "BL", year: 2011 },
      { institution: "Harvard Law School", degree: "LLM", year: 2014 },
    ],
  },
  {
    email: "emeka.nwankwo@legalconnect.ng",
    full_name: "Emeka Nwankwo",
    handle: "emekanwankwo",
    phone: "+2348012345002",
    avatar_url: "https://i.pravatar.cc/150?u=emeka-nwankwo",
    is_premium: false,
    bio: "Compassionate family law attorney dedicated to protecting the rights of families across Nigeria. I handle divorce proceedings, child custody disputes, adoption cases, and domestic violence matters with sensitivity and professionalism. Every family deserves fair representation.",
    years_of_experience: 8,
    scn: "SCN/2016/23456",
    nba_branch: "Abuja",
    location_state: "FCT",
    location_city: "Abuja",
    specialization_ids: ["family-law", "human-rights"],
    fee_range_min: 50000,
    fee_range_max: 200000,
    verification_status: "verified",
    rating_avg: 4.8,
    rating_count: 18,
    subscription_tier: "professional",
    languages: ["English", "Igbo"],
    education: [
      { institution: "Nnamdi Azikiwe University", degree: "LLB", year: 2014 },
      { institution: "Nigerian Law School", degree: "BL", year: 2015 },
    ],
  },
  {
    email: "fatima.ibrahim@legalconnect.ng",
    full_name: "Fatima Ibrahim",
    handle: "fatimaibrahim",
    phone: "+2348012345003",
    avatar_url: "https://i.pravatar.cc/150?u=fatima-ibrahim",
    is_premium: true,
    bio: "Award-winning human rights lawyer and advocate. I have successfully litigated landmark cases before the ECOWAS Court and African Commission on Human and Peoples' Rights. Currently leading multiple public interest cases challenging unconstitutional government policies.",
    years_of_experience: 15,
    scn: "SCN/2009/12345",
    nba_branch: "Kano",
    location_state: "Kano",
    location_city: "Kano",
    specialization_ids: ["human-rights", "constitutional-law"],
    fee_range_min: 100000,
    fee_range_max: 500000,
    verification_status: "verified",
    rating_avg: 5.0,
    rating_count: 31,
    subscription_tier: "elite",
    languages: ["English", "Hausa", "Arabic"],
    education: [
      { institution: "Bayero University Kano", degree: "LLB", year: 2007 },
      { institution: "Nigerian Law School", degree: "BL", year: 2008 },
      { institution: "University of Oxford", degree: "BCL", year: 2012 },
    ],
  },
  {
    email: "seun.adeyemi@legalconnect.ng",
    full_name: "Oluwaseun Adeyemi",
    handle: "seunadeyemi",
    phone: "+2348012345004",
    avatar_url: "https://i.pravatar.cc/150?u=seun-adeyemi",
    is_premium: false,
    bio: "Experienced criminal defense attorney with a track record of successful acquittals. I represent clients facing charges ranging from financial crimes to serious felonies. Firm believer that everyone deserves a strong defense and a fair trial under Nigerian law.",
    years_of_experience: 10,
    scn: "SCN/2014/34567",
    nba_branch: "Lagos",
    location_state: "Lagos",
    location_city: "Ikeja",
    specialization_ids: ["criminal-law", "litigation"],
    fee_range_min: 60000,
    fee_range_max: 250000,
    verification_status: "verified",
    rating_avg: 4.7,
    rating_count: 15,
    subscription_tier: "professional",
    languages: ["English", "Yoruba"],
    education: [
      { institution: "Obafemi Awolowo University", degree: "LLB", year: 2012 },
      { institution: "Nigerian Law School", degree: "BL", year: 2013 },
    ],
  },
  {
    email: "chidinma.okafor@legalconnect.ng",
    full_name: "Chidinma Okafor",
    handle: "chidinmaokafor",
    phone: "+2348012345005",
    avatar_url: "https://i.pravatar.cc/150?u=chidinma-okafor",
    is_premium: false,
    bio: "Property and real estate law specialist helping clients navigate land acquisition, title verification, and property disputes across Southeast Nigeria. I also handle construction contracts and landlord-tenant matters with thorough attention to detail.",
    years_of_experience: 7,
    scn: "SCN/2017/45678",
    nba_branch: "Enugu",
    location_state: "Enugu",
    location_city: "Enugu",
    specialization_ids: ["property-law", "real-estate"],
    fee_range_min: 40000,
    fee_range_max: 180000,
    verification_status: "verified",
    rating_avg: 4.6,
    rating_count: 12,
    subscription_tier: "free",
    languages: ["English", "Igbo"],
    education: [
      { institution: "University of Nigeria, Nsukka", degree: "LLB", year: 2015 },
      { institution: "Nigerian Law School", degree: "BL", year: 2016 },
    ],
  },
  {
    email: "babajide.ogunleye@legalconnect.ng",
    full_name: "Babajide Ogunleye",
    handle: "babajideogunleye",
    phone: "+2348012345006",
    avatar_url: "https://i.pravatar.cc/150?u=babajide-ogunleye",
    is_premium: true,
    bio: "Veteran tax law consultant with two decades of experience. I advise multinational corporations and high-net-worth individuals on tax planning, FIRS compliance, transfer pricing, and international tax treaties. Former member of the CITN Technical Committee.",
    years_of_experience: 20,
    scn: "SCN/2004/67890",
    nba_branch: "Lagos",
    location_state: "Lagos",
    location_city: "Ikoyi",
    specialization_ids: ["tax-law", "corporate-law"],
    fee_range_min: 150000,
    fee_range_max: 750000,
    verification_status: "verified",
    rating_avg: 4.9,
    rating_count: 28,
    subscription_tier: "elite",
    languages: ["English", "Yoruba", "French"],
    education: [
      { institution: "University of Ibadan", degree: "LLB", year: 2002 },
      { institution: "Nigerian Law School", degree: "BL", year: 2003 },
      { institution: "Georgetown University", degree: "LLM Tax", year: 2006 },
    ],
  },
  {
    email: "ngozi.eze@legalconnect.ng",
    full_name: "Ngozi Eze",
    handle: "ngozieze",
    phone: "+2348012345007",
    avatar_url: "https://i.pravatar.cc/150?u=ngozi-eze",
    is_premium: false,
    bio: "Employment and labor law practitioner passionate about protecting workers' rights. I handle wrongful termination claims, workplace discrimination cases, and negotiate employment contracts. Also advise startups on compliant HR policies and remote work agreements.",
    years_of_experience: 5,
    scn: "SCN/2019/78901",
    nba_branch: "Port Harcourt",
    location_state: "Rivers",
    location_city: "Port Harcourt",
    specialization_ids: ["employment-law", "litigation"],
    fee_range_min: 35000,
    fee_range_max: 150000,
    verification_status: "pending",
    rating_avg: 4.5,
    rating_count: 8,
    subscription_tier: "free",
    languages: ["English", "Igbo"],
    education: [
      { institution: "Rivers State University", degree: "LLB", year: 2017 },
      { institution: "Nigerian Law School", degree: "BL", year: 2018 },
    ],
  },
  {
    email: "abubakar.suleiman@legalconnect.ng",
    full_name: "Abubakar Suleiman",
    handle: "abubakarsuleiman",
    phone: "+2348012345008",
    avatar_url: "https://i.pravatar.cc/150?u=abubakar-suleiman",
    is_premium: true,
    bio: "Leading oil & gas and energy law practitioner with 18 years of experience in Nigeria's petroleum sector. I advise IOCs, indigenous E&P companies, and government agencies on JV agreements, PSCs, licensing, and environmental compliance under the PIA 2021.",
    years_of_experience: 18,
    scn: "SCN/2006/89012",
    nba_branch: "Abuja",
    location_state: "FCT",
    location_city: "Abuja",
    specialization_ids: ["oil-gas-law", "environmental-law"],
    fee_range_min: 200000,
    fee_range_max: 1000000,
    verification_status: "verified",
    rating_avg: 4.8,
    rating_count: 22,
    subscription_tier: "elite",
    languages: ["English", "Hausa"],
    education: [
      { institution: "Ahmadu Bello University", degree: "LLB", year: 2004 },
      { institution: "Nigerian Law School", degree: "BL", year: 2005 },
      { institution: "University of Dundee", degree: "LLM Energy Law", year: 2008 },
    ],
  },
];

const CLIENTS = [
  {
    email: "tunde.bakare@gmail.com",
    full_name: "Tunde Bakare",
    handle: "tundebakare",
    phone: "+2348023456001",
    avatar_url: "https://i.pravatar.cc/150?u=tunde-bakare",
    bio: "Fintech entrepreneur building the future of digital payments in Nigeria.",
    is_premium: true,
  },
  {
    email: "grace.obi@gmail.com",
    full_name: "Grace Obi",
    handle: "graceobi",
    phone: "+2348023456002",
    avatar_url: "https://i.pravatar.cc/150?u=grace-obi",
    bio: "Mother of two. Advocate for family rights and child welfare.",
    is_premium: false,
  },
  {
    email: "ibrahim.musa@gmail.com",
    full_name: "Ibrahim Musa",
    handle: "ibrahimmusa",
    phone: "+2348023456003",
    avatar_url: "https://i.pravatar.cc/150?u=ibrahim-musa",
    bio: "Investigative journalist covering governance and human rights in Northern Nigeria.",
    is_premium: false,
  },
  {
    email: "folake.adekunle@gmail.com",
    full_name: "Folake Adekunle",
    handle: "folakeadekunle",
    phone: "+2348023456004",
    avatar_url: "https://i.pravatar.cc/150?u=folake-adekunle",
    bio: "Real estate investor and property enthusiast. Learning the legal ropes.",
    is_premium: false,
  },
  {
    email: "david.okonkwo@gmail.com",
    full_name: "David Okonkwo",
    handle: "davidokonkwo",
    phone: "+2348023456005",
    avatar_url: "https://i.pravatar.cc/150?u=david-okonkwo",
    bio: "CEO of a mid-size logistics company. Navigating Nigerian tax and regulatory landscape.",
    is_premium: true,
  },
];

// Posts by lawyers
const POSTS = [
  {
    lawyerIndex: 0,
    content:
      "Just concluded a ₦15 billion cross-border M&A transaction for a leading Nigerian bank. The deal involved regulatory approvals from CBN, SEC, and foreign counterpart regulators. Key takeaway: early engagement with regulators saves months of delays. #CorporateLaw #MergersAndAcquisitions",
    category: "corporate-law",
    hashtags: ["corporatelaw", "mergersandacquisitions"],
  },
  {
    lawyerIndex: 0,
    content:
      "Many entrepreneurs ask me about the best structure for their startup. In Nigeria, an LLC (Limited Liability Company) under CAMA 2020 is usually the best choice. It provides personal asset protection and is now easier to register with the CAC online portal. Let me know if you have questions!",
    category: "corporate-law",
    hashtags: ["startups", "cama2020", "corporatelaw"],
  },
  {
    lawyerIndex: 1,
    content:
      "A reminder to all parents: Under the Child Rights Act, every child has the right to maintenance from both parents, regardless of custody arrangements. If you're going through a separation, prioritize your children's welfare. The court always considers the best interest of the child.",
    category: "family-law",
    hashtags: ["familylaw", "childrightsact", "custody"],
  },
  {
    lawyerIndex: 1,
    content:
      "Successfully obtained an adoption order for a wonderful family today. The process in Nigeria involves the Family Court and takes about 6-12 months. Key documents needed: birth certificate, medical reports, social welfare reports, and consent where applicable. Reach out if you need guidance.",
    category: "family-law",
    hashtags: ["familylaw", "adoption"],
  },
  {
    lawyerIndex: 2,
    content:
      "The Nigerian Constitution guarantees fundamental rights under Chapter IV. However, many citizens don't know they can directly approach the Federal High Court for enforcement under Section 46. Know your rights, exercise your rights. #HumanRights #NigerianConstitution",
    category: "human-rights",
    hashtags: ["humanrights", "nigerianconstitution", "knowyourrights"],
  },
  {
    lawyerIndex: 2,
    content:
      "Proud to announce that our team won a landmark case at the ECOWAS Court on the right to peaceful assembly. This ruling sets an important precedent for all West African nations. Democracy thrives when citizens can freely express their views. #HumanRights",
    category: "human-rights",
    hashtags: ["humanrights", "ecowas", "democracy"],
  },
  {
    lawyerIndex: 3,
    content:
      "If you are arrested, remember your rights: 1) You have the right to remain silent. 2) You must be informed of the reason for arrest. 3) You have the right to a lawyer. 4) You must be brought before a court within 24-48 hours. Don't let anyone violate these rights. #KnowYourRights",
    category: "criminal-law",
    hashtags: ["knowyourrights", "criminallaw", "arrest"],
  },
  {
    lawyerIndex: 4,
    content:
      "Before buying any property in Nigeria, ALWAYS conduct a proper search at the Land Registry. Check for: Certificate of Occupancy (C of O), Governor's Consent, Survey Plan, and Building Approval. So many people have lost millions to fraudulent land transactions. Be smart, verify! #PropertyLaw",
    category: "property-law",
    hashtags: ["propertylaw", "landuseact", "realestate"],
  },
  {
    lawyerIndex: 4,
    content:
      "The Land Use Act of 1978 vests all land in each state in the Governor. This means you technically hold a right of occupancy, not absolute ownership. Understanding this is crucial for any property transaction in Nigeria. Always get Governor's Consent for assignments!",
    category: "property-law",
    hashtags: ["propertylaw", "landuseact"],
  },
  {
    lawyerIndex: 5,
    content:
      "Tax season reminder: Companies in Nigeria must file their annual returns with FIRS by June 30th (for December year-end). Late filing attracts penalties of ₦25,000 for the first month and ₦5,000 for each subsequent month. Plan ahead! #TaxLaw #FIRS",
    category: "tax-law",
    hashtags: ["taxlaw", "firs", "taxseason"],
  },
  {
    lawyerIndex: 5,
    content:
      "Nigeria's Finance Act 2023 introduced significant changes to VAT registration thresholds and digital economy taxation. If you run an online business generating over ₦25 million annually, you're now required to register for VAT. Consult a tax professional to ensure compliance.",
    category: "tax-law",
    hashtags: ["taxlaw", "vat", "financeact", "digitaleconomy"],
  },
  {
    lawyerIndex: 6,
    content:
      "Employers: Your employees are entitled to at least 6 working days of paid annual leave after 12 months of continuous service under the Labour Act. Many companies offer more than this. Respect your workers' right to rest! #EmploymentLaw #WorkersRights",
    category: "employment-law",
    hashtags: ["employmentlaw", "workersrights", "labouract"],
  },
  {
    lawyerIndex: 7,
    content:
      "The Petroleum Industry Act 2021 fundamentally changed Nigeria's oil & gas landscape. Key changes include: new regulatory bodies (NUPRC & NMDPRA), host community development trusts (3% of OPEX), and revised fiscal terms. If you're in the sector, you need to understand these changes.",
    category: "oil-gas-law",
    hashtags: ["oilandgas", "pia2021", "petroleumindustry"],
  },
  {
    lawyerIndex: 7,
    content:
      "Environmental compliance is no longer optional in Nigeria's oil & gas sector. The NOSDRA Act and EIA Act impose strict obligations. Companies face fines up to ₦500 million for oil spills and environmental degradation. Prevention is always cheaper than remediation. #OilAndGas",
    category: "environmental-law",
    hashtags: ["oilandgas", "environment", "nosdra"],
  },
  {
    lawyerIndex: 3,
    content:
      "Bail is a constitutional right, not a privilege. Under Section 35(4) of the 1999 Constitution, every person charged with an offence is entitled to bail, except in capital offences. If your bail is being delayed, speak to a lawyer immediately. #CriminalLaw #BailRights",
    category: "criminal-law",
    hashtags: ["criminallaw", "bailrights", "constitution"],
  },
];

// Distinct conversations between specific lawyer-client pairs
const CONVERSATIONS = [
  {
    lawyerIndex: 0,
    clientIndex: 0,
    messages: [
      { fromLawyer: false, text: "Good morning Adaeze. I need help incorporating a new fintech company in Lagos. What's your fee for company registration?" },
      { fromLawyer: true, text: "Good morning Tunde! I'd be happy to help. For a standard company registration with CAC including all documentation, my fee is ₦150,000. This covers name reservation, preparation of MEMART, and filing. When would you like to get started?" },
      { fromLawyer: false, text: "That sounds reasonable. I also need advice on CBN licensing requirements for a payment service. Can we schedule a consultation?" },
      { fromLawyer: true, text: "Absolutely. CBN licensing is a critical step for fintech companies. I'll send you a consultation booking link. We can discuss the Payment Service Provider (PSP) license requirements in detail. Do you prefer a video call or in-person meeting?" },
      { fromLawyer: false, text: "Video call would be perfect. I'm currently in Abuja but plan to set up the company in Lagos. Let me book a session for later this week." },
      { fromLawyer: true, text: "Sounds good! I've worked with several fintech startups on CBN compliance. Looking forward to our session. In the meantime, you can start gathering your business plan and projected transaction volumes — CBN will require those." },
    ],
  },
  {
    lawyerIndex: 1,
    clientIndex: 1,
    messages: [
      { fromLawyer: false, text: "Hello Emeka, I'm going through a difficult divorce and I'm worried about losing custody of my children. Can you help?" },
      { fromLawyer: true, text: "Hello Grace, I'm sorry to hear about your situation. I want to assure you that I've handled many custody cases and the court always prioritizes the best interest of the child. Can you tell me more about your circumstances? How many children are involved and their ages?" },
      { fromLawyer: false, text: "I have two children, ages 4 and 7. My husband wants full custody but I've been their primary caregiver. He's also not been paying for their school fees." },
      { fromLawyer: true, text: "Based on what you've described, you have a strong case. In Nigeria, there's a general presumption that children under 7 should remain with their mother unless there are compelling reasons otherwise. The fact that you're their primary caregiver strengthens your position significantly. I'd recommend we file for custody and child maintenance simultaneously." },
      { fromLawyer: false, text: "That gives me hope. How long does the custody process usually take?" },
      { fromLawyer: true, text: "Typically 6-12 months, though we can apply for interim custody within 2-3 weeks so your children's welfare isn't disrupted during the proceedings. Let's schedule a full consultation to review all the documents and plan our strategy." },
    ],
  },
  {
    lawyerIndex: 2,
    clientIndex: 2,
    messages: [
      { fromLawyer: false, text: "Fatima, I work as a journalist and I was detained by security forces for 48 hours without being charged. They confiscated my camera equipment. What can I do?" },
      { fromLawyer: true, text: "Ibrahim, what happened to you is a clear violation of your fundamental rights under the Nigerian Constitution. Section 35 guarantees liberty, and Section 35(5) says you must be brought before a court within 24 hours (or 48 hours if no court is nearby). We can file a fundamental rights enforcement action." },
      { fromLawyer: false, text: "Will I be able to get compensation for my confiscated equipment and the trauma?" },
      { fromLawyer: true, text: "Yes, absolutely. The court can award damages for the unlawful detention and order the return of your equipment or compensation for its value. We'll file under the Fundamental Rights Enforcement Procedure Rules 2009. I've won several similar cases. Let me take this on for you." },
      { fromLawyer: false, text: "Thank you Fatima. Your track record gives me confidence. When can we start?" },
      { fromLawyer: true, text: "We should act quickly. I'll prepare the application this week and file at the Federal High Court. Please send me any documentation you have — arrest records, receipts for the equipment, and medical reports if you sought treatment. Also, any witness contacts would be helpful." },
    ],
  },
  {
    lawyerIndex: 4,
    clientIndex: 3,
    messages: [
      { fromLawyer: false, text: "Good afternoon Chidinma. I recently discovered that the land I purchased in Enugu may have been sold to someone else before me. I have a deed of assignment. What should I do?" },
      { fromLawyer: true, text: "Good afternoon Folake. This is unfortunately a common issue in Nigerian property transactions. First, we need to verify the title at the Land Registry. Do you have a Survey Plan and was Governor's Consent obtained for your transaction?" },
      { fromLawyer: false, text: "I have the survey plan but the Governor's Consent hasn't been processed yet. I paid ₦5 million for the land last year." },
      { fromLawyer: true, text: "The lack of Governor's Consent is critical — without it, the assignment isn't technically valid under the Land Use Act. However, you still have equitable interest and legal remedies. I'd recommend we: 1) Conduct a search at the Land Registry 2) If there's a conflicting title, file a Lis Pendens 3) Pursue legal action to protect your interest. Time is of the essence here." },
      { fromLawyer: false, text: "I'm scared. ₦5 million is a lot of money for me. Please help me protect my investment." },
      { fromLawyer: true, text: "Don't worry Folake, I'll handle this. We'll start with the registry search first thing Monday. In my experience, many of these cases can be resolved through negotiation or mediation before going to court. But if litigation is necessary, we're prepared. Bring all your documents to my office this week." },
    ],
  },
  {
    lawyerIndex: 5,
    clientIndex: 4,
    messages: [
      { fromLawyer: false, text: "Mr. Ogunleye, I received a tax audit notice from FIRS and I'm very concerned. My company hasn't filed returns for the past 2 years." },
      { fromLawyer: true, text: "David, let's address this promptly. Two years of non-filing does attract penalties, but the situation is manageable. First, do not ignore the audit notice — that would make things worse. We need to prepare back-filings immediately and engage with the FIRS audit team cooperatively." },
      { fromLawyer: false, text: "What kind of penalties am I looking at? The company revenue is about ₦200 million per year." },
      { fromLawyer: true, text: "For a company of your size, late filing penalties would be around ₦25,000 for the first month plus ₦5,000 per month thereafter for each year. The bigger concern is potential tax liability with interest at the CBN minimum rediscount rate plus a spread. I'd estimate total exposure at ₦3-5 million including penalties and interest. However, I can often negotiate penalty waivers through the Voluntary Assets and Income Declaration Scheme." },
      { fromLawyer: false, text: "That's less than I feared. Can you represent us during the audit and handle the back-filings?" },
      { fromLawyer: true, text: "Absolutely. I'll prepare the outstanding CIT and VAT returns, represent your company during the audit, and negotiate any settlements. My team will need access to your financial statements and bank records for the relevant periods. Let's schedule a meeting with your accountant this week." },
    ],
  },
];

export async function POST() {
  try {
    const createdUsers: { uid: string; email: string; role: string }[] = [];

    // ---- Create lawyers ----
    for (const lawyer of LAWYERS) {
      let uid: string;
      try {
        const userRecord = await adminAuth.createUser({
          email: lawyer.email,
          password: PASSWORD,
          displayName: lawyer.full_name,
          phoneNumber: lawyer.phone,
        });
        uid = userRecord.uid;
      } catch (error: unknown) {
        // If user already exists, fetch the uid
        const existing = await adminAuth.getUserByEmail(lawyer.email);
        uid = existing.uid;
      }

      const slug = lawyer.full_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Create user profile
      await adminDb.doc(`users/${uid}`).set(
        {
          email: lawyer.email,
          full_name: lawyer.full_name,
          handle: lawyer.handle,
          phone: lawyer.phone,
          role: "lawyer",
          account_type: "individual",
          avatar_url: lawyer.avatar_url,
          banner_url: diceBearBanner(lawyer.full_name),
          bio: lawyer.bio,
          is_active: true,
          is_premium: lawyer.is_premium,
          follower_count: Math.floor(Math.random() * 500) + 50,
          following_count: Math.floor(Math.random() * 100) + 10,
          post_count: 0,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Claim handle
      await adminDb.doc(`handles/${lawyer.handle}`).set({ user_id: uid });

      // Create lawyer profile
      await adminDb.doc(`lawyer_profiles/${uid}`).set(
        {
          user_id: uid,
          slug: `${slug}-${uid.slice(0, 6)}`,
          bio: lawyer.bio,
          cover_image_url: null,
          years_of_experience: lawyer.years_of_experience,
          scn: lawyer.scn,
          nba_branch: lawyer.nba_branch,
          location_state: lawyer.location_state,
          location_city: lawyer.location_city,
          education: lawyer.education,
          languages: lawyer.languages,
          specialization_ids: lawyer.specialization_ids,
          fee_range_min: lawyer.fee_range_min,
          fee_range_max: lawyer.fee_range_max,
          availability_status: "accepting",
          verification_status: lawyer.verification_status,
          follower_count: Math.floor(Math.random() * 500) + 50,
          post_count: 0,
          rating_avg: lawyer.rating_avg,
          rating_count: lawyer.rating_count,
          subscription_tier: lawyer.subscription_tier,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      createdUsers.push({ uid, email: lawyer.email, role: "lawyer" });
    }

    // ---- Create clients ----
    for (const client of CLIENTS) {
      let uid: string;
      try {
        const userRecord = await adminAuth.createUser({
          email: client.email,
          password: PASSWORD,
          displayName: client.full_name,
          phoneNumber: client.phone,
        });
        uid = userRecord.uid;
      } catch (error: unknown) {
        const existing = await adminAuth.getUserByEmail(client.email);
        uid = existing.uid;
      }

      await adminDb.doc(`users/${uid}`).set(
        {
          email: client.email,
          full_name: client.full_name,
          handle: client.handle,
          phone: client.phone,
          role: "client",
          account_type: "individual",
          avatar_url: client.avatar_url,
          banner_url: diceBearBanner(client.full_name),
          bio: client.bio,
          is_active: true,
          is_premium: client.is_premium,
          follower_count: Math.floor(Math.random() * 50) + 5,
          following_count: Math.floor(Math.random() * 30) + 5,
          post_count: 0,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Claim handle
      await adminDb.doc(`handles/${client.handle}`).set({ user_id: uid });

      createdUsers.push({ uid, email: client.email, role: "client" });
    }

    // ---- Create posts ----
    const lawyerUids = createdUsers
      .filter((u) => u.role === "lawyer")
      .map((u) => u.uid);
    const clientUids = createdUsers
      .filter((u) => u.role === "client")
      .map((u) => u.uid);

    for (let i = 0; i < POSTS.length; i++) {
      const post = POSTS[i];
      const authorUid = lawyerUids[post.lawyerIndex];
      const authorData = LAWYERS[post.lawyerIndex];

      // Stagger post times (most recent first)
      const postDate = new Date();
      postDate.setHours(postDate.getHours() - (POSTS.length - i) * 4);

      const likeCount = Math.floor(Math.random() * 50) + 5;
      const commentCount = Math.floor(Math.random() * 12);

      const postRef = adminDb.collection("posts").doc();
      await postRef.set({
        author_id: authorUid,
        author_name: authorData.full_name,
        author_avatar: authorData.avatar_url,
        author_verified: authorData.verification_status === "verified",
        content: post.content,
        category: post.category,
        media_urls: [],
        hashtags: post.hashtags || [],
        like_count: likeCount,
        comment_count: commentCount,
        share_count: Math.floor(Math.random() * 8),
        bookmark_count: Math.floor(Math.random() * 15),
        is_pinned: false,
        visibility: "public",
        created_at: postDate,
        updated_at: postDate,
      });

      // Update hashtag counts
      if (post.hashtags) {
        for (const tag of post.hashtags) {
          const tagRef = adminDb.doc(`hashtag_counts/${tag}`);
          const tagSnap = await tagRef.get();
          if (tagSnap.exists) {
            await tagRef.update({ count: FieldValue.increment(1), last_used_at: postDate });
          } else {
            await tagRef.set({ tag, count: 1, last_used_at: postDate });
          }
        }
      }

      // Add some likes from random clients
      for (let j = 0; j < Math.min(likeCount, clientUids.length); j++) {
        await adminDb
          .collection("posts")
          .doc(postRef.id)
          .collection("likes")
          .doc(clientUids[j])
          .set({
            user_id: clientUids[j],
            created_at: postDate,
          });
      }
    }

    // Update post counts for lawyers
    for (let i = 0; i < LAWYERS.length; i++) {
      const postCount = POSTS.filter((p) => p.lawyerIndex === i).length;
      if (postCount > 0) {
        await adminDb.doc(`lawyer_profiles/${lawyerUids[i]}`).update({
          post_count: postCount,
        });
        await adminDb.doc(`users/${lawyerUids[i]}`).update({
          post_count: postCount,
        });
      }
    }

    // ---- Create conversations and messages ----
    for (const convo of CONVERSATIONS) {
      const lawyerUid = lawyerUids[convo.lawyerIndex];
      const clientUid = clientUids[convo.clientIndex];

      const convoRef = adminDb.collection("conversations").doc();
      const now = new Date();

      await convoRef.set({
        participants: [lawyerUid, clientUid],
        participant_client_id: clientUid,
        participant_lawyer_id: lawyerUid,
        participant_names: {
          [lawyerUid]: LAWYERS[convo.lawyerIndex].full_name,
          [clientUid]: CLIENTS[convo.clientIndex].full_name,
        },
        participant_avatars: {
          [lawyerUid]: LAWYERS[convo.lawyerIndex].avatar_url,
          [clientUid]: CLIENTS[convo.clientIndex].avatar_url,
        },
        last_message: convo.messages[convo.messages.length - 1].text,
        last_message_preview: convo.messages[convo.messages.length - 1].text,
        last_message_at: now,
        last_sender_id: convo.messages[convo.messages.length - 1].fromLawyer
          ? lawyerUid
          : clientUid,
        status: "active",
        unread_count: {
          [lawyerUid]: 0,
          [clientUid]: 1,
        },
        created_at: new Date(now.getTime() - convo.messages.length * 3600000),
        updated_at: now,
      });

      // Create messages with staggered timestamps
      for (let m = 0; m < convo.messages.length; m++) {
        const msg = convo.messages[m];
        const msgTime = new Date(
          now.getTime() - (convo.messages.length - m) * 1800000
        ); // 30 min apart

        await convoRef.collection("messages").add({
          sender_id: msg.fromLawyer ? lawyerUid : clientUid,
          sender_name: msg.fromLawyer
            ? LAWYERS[convo.lawyerIndex].full_name
            : CLIENTS[convo.clientIndex].full_name,
          content: msg.text,
          read: m < convo.messages.length - 1,
          created_at: msgTime,
        });
      }
    }

    return NextResponse.json({
      status: "success",
      created: createdUsers.length,
      posts: POSTS.length,
      conversations: CONVERSATIONS.length,
      users: createdUsers.map((u) => ({
        email: u.email,
        role: u.role,
        password: PASSWORD,
      })),
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
