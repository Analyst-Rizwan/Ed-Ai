// ── Question pools for Mock Interview ────────────────────
export const QUESTIONS = {
    behavioural: [
        { text: "Tell me about a time you had to lead a team under significant pressure. What did you do and what was the outcome?", cat: "Leadership" },
        { text: "Describe a situation where you had a conflict with a teammate. How did you resolve it?", cat: "Conflict Resolution" },
        { text: "Tell me about a time you failed. What did you learn from it?", cat: "Resilience" },
        { text: "Give an example of when you showed initiative on a project without being asked.", cat: "Initiative" },
        { text: "Describe a time you had to adapt quickly to a major change. How did you handle it?", cat: "Adaptability" },
        { text: "Tell me about the most challenging project you've worked on. What made it difficult and how did you overcome that?", cat: "Problem Solving" },
        { text: "Describe a time you had to persuade someone who strongly disagreed with your approach.", cat: "Communication" },
        { text: "Give an example of a goal you set for yourself and how you achieved it.", cat: "Drive" },
    ],
    technical: [
        { text: "Explain the difference between synchronous and asynchronous programming. When would you use each?", cat: "Technical" },
        { text: "How would you design a URL shortening service like bit.ly? Walk me through your architecture.", cat: "System Design" },
        { text: "What is the difference between a process and a thread? How does the OS manage them?", cat: "CS Fundamentals" },
        { text: "Explain how you would optimise a slow SQL query. What steps would you take?", cat: "Databases" },
        { text: "What is the time and space complexity of your favourite sorting algorithm and why would you choose it?", cat: "Algorithms" },
        { text: "How does React's virtual DOM work and why is it more efficient than direct DOM manipulation?", cat: "Frontend" },
    ],
    situational: [
        { text: "If you discovered a critical bug in production 30 minutes before a major release, what would you do?", cat: "Situational" },
        { text: "Your manager gives you an unrealistic deadline for a project. How do you handle it?", cat: "Situational" },
        { text: "You're halfway through a project when requirements change significantly. Walk me through your response.", cat: "Situational" },
        { text: "A client is unhappy with your work. What steps do you take to resolve the situation?", cat: "Situational" },
    ],
    hr: [
        { text: "Why do you want to work here specifically? What draws you to this company over others?", cat: "Motivation" },
        { text: "Where do you see yourself in five years?", cat: "Career Goals" },
        { text: "What is your greatest professional strength and how has it helped you succeed?", cat: "Self-Awareness" },
        { text: "Tell me about yourself — walk me through your background and what led you here.", cat: "Introduction" },
    ],
};

export const FEEDBACK_TEMPLATES = [
    { clarity: 85, relevance: 78, structure: 90, text: "Strong answer with a clear narrative arc. Your use of specific details strengthens credibility. To improve: quantify the impact more precisely — instead of 'improved performance', try 'reduced load time by 40%'. The STAR structure was evident which is excellent." },
    { clarity: 72, relevance: 65, structure: 68, text: "Decent foundation but the answer drifted slightly from the question. Focus more on YOUR specific actions rather than what the team did collectively. The situation was well set up, but the result could be stronger — what was the measurable outcome?" },
    { clarity: 91, relevance: 88, structure: 85, text: "Excellent answer. Concise, specific, and directly relevant. You demonstrated clear ownership and quantified impact. One suggestion: add a brief reflection on what you learned — interviewers love to see growth mindset in action." },
    { clarity: 60, relevance: 75, structure: 55, text: "The core story is good but the structure needs work. Try using STAR more deliberately: 30 seconds on Situation, 10 seconds on Task, 60 seconds on Action, 20 seconds on Result. Your answer was too heavily weighted on background." },
];

// ── Question Bank data ───────────────────────────────────
export const ALL_QUESTIONS = [
    { text: "Tell me about yourself.", cat: "hr", diff: "easy", tips: "Keep it to 90 seconds. Career story → relevant skills → why here." },
    { text: "Why do you want to work here?", cat: "hr", diff: "easy", tips: "Research the company's mission, recent news and culture. Connect their values to yours." },
    { text: "What is your greatest weakness?", cat: "hr", diff: "medium", tips: "Choose a real weakness, show self-awareness, and explain what you're doing to improve it." },
    { text: "Where do you see yourself in 5 years?", cat: "hr", diff: "easy", tips: "Show ambition but keep it realistic and tied to the role." },
    { text: "Tell me about a time you failed. What did you learn?", cat: "behavioural", diff: "medium", tips: "Pick a real failure, own it fully, and focus 60% on the learning." },
    { text: "Describe a situation where you had to lead a team.", cat: "behavioural", diff: "medium", tips: "Use STAR. Emphasise how you motivated others." },
    { text: "Give an example of handling a difficult stakeholder.", cat: "behavioural", diff: "medium", tips: "Show empathy, active listening, and how you found a win-win." },
    { text: "Tell me about a time you had to learn something new quickly.", cat: "behavioural", diff: "easy", tips: "Emphasise your learning strategy and resourcefulness." },
    { text: "Describe a time you made a decision with incomplete information.", cat: "behavioural", diff: "hard", tips: "Show structured thinking: what data you had, assumptions, and risk mitigation." },
    { text: "Tell me about a time you disagreed with your manager.", cat: "behavioural", diff: "hard", tips: "Show respectful assertiveness and advocacy without burning bridges." },
    { text: "Explain the difference between TCP and UDP.", cat: "technical", diff: "easy", tips: "TCP = reliable, ordered. UDP = fast, connectionless. Give real use cases." },
    { text: "What happens when you type a URL in a browser and press Enter?", cat: "technical", diff: "medium", tips: "Cover DNS, TCP handshake, HTTP, rendering. Shows breadth." },
    { text: "Design a notification system for a social media app.", cat: "technical", diff: "hard", tips: "Think pub/sub, WebSockets, queues, fanout." },
    { text: "How does garbage collection work in your primary language?", cat: "technical", diff: "medium", tips: "Explain the algorithm and when GC pauses matter." },
    { text: "What is the difference between an index and a primary key?", cat: "technical", diff: "easy", tips: "Primary key = unique ID, always indexed. Index = perf optimisation." },
    { text: "Design Twitter's trending topics feature.", cat: "technical", diff: "hard", tips: "Time-windowed counters, distributed aggregation, cache layer." },
    { text: "If your team is consistently missing sprint targets, what would you do?", cat: "situational", diff: "medium", tips: "Diagnose first: scope creep? estimation? blockers?" },
    { text: "A key engineer just resigned mid-project. How do you handle it?", cat: "situational", diff: "hard", tips: "Short term: stabilise. Long term: knowledge transfer processes." },
    { text: "You have three urgent tasks and can only complete two today. How?", cat: "situational", diff: "medium", tips: "Impact vs effort framework. Communicate proactively." },
    { text: "Walk me through how you would onboard yourself into a new codebase.", cat: "situational", diff: "easy", tips: "README → run locally → trace a user journey → read tests." },
    { text: "Describe your approach to designing a component library.", cat: "technical", diff: "hard", tips: "Tokens → primitives → compounds. Discuss theming & a11y." },
    { text: "How would you improve an e-commerce checkout flow?", cat: "situational", diff: "medium", tips: "Start with data: drop-off rates. Then hypothesis → A/B test." },
];

// ── STAR stories ─────────────────────────────────────────
export const DEFAULT_STORIES = [
    { title: "Led a team project under deadline", theme: "Leadership", status: "Completed", s: "During my final year at university, my 4-person team was tasked with building a full-stack web app in 6 weeks for a real client. Two weeks before the deadline, our team lead dropped out unexpectedly.", t: "I needed to step up and take over as lead, redistribute the workload, and ensure we still delivered on time.", a: "I held an emergency meeting, broke remaining work into sprints using Notion, took on the backend API, and set up daily standups.", r: "We delivered on time. The client gave us 9/10 and our project received the highest mark in the cohort." },
    { title: "Resolved a production bug at 2am", theme: "Problem Solving", status: "Completed", s: "I was on-call when a critical payment service started failing at 2am, affecting thousands of users.", t: "As the only engineer awake, I had to diagnose and resolve the issue before significant revenue loss.", a: "I checked monitoring, traced the error to a third-party API timeout, implemented exponential backoff retry, and deployed a hotfix within 45 minutes.", r: "Payment success rate recovered to 99.8% within an hour. I wrote a post-mortem and proposed circuit breakers." },
    { title: "Disagreement with a team member", theme: "Conflict Resolution", status: "Draft", s: "", t: "", a: "", r: "" },
];

// ── Company Intel ────────────────────────────────────────
export interface CompanyData {
    name: string; emoji: string; type: string; color: string;
    founded: string; size: string; hq: string;
    format: string; duration: string; style: string;
    values: string[]; tips: string[]; questions: string[];
}

export const COMPANIES: Record<string, CompanyData> = {
    google: { name: "Google", emoji: "🔵", type: "Big Tech · FAANG", color: "#4285F4", founded: "1998", size: "180,000+", hq: "Mountain View, CA", format: "4–6 rounds: Phone screen → 2x Technical → System Design → Behavioural → Hiring Committee", duration: "4–8 weeks", style: "Structured, consistent scoring rubric", values: ["Googleyness", "Data-driven decisions", "Impact at scale", "Growth mindset"], tips: ["Prepare system design even for junior roles", "Every answer scored on: Problem Solving, Technical, Communication, Googleyness", "Practise 'How would you improve Google Maps/Search'", "They value reasoning over correct answers"], questions: ["Tell me about a time you had a significant impact.", "Design a distributed key-value store.", "How would you improve Google Maps for accessibility?", "Walk me through a complex project you're proud of.", "How do you handle disagreements with your tech lead?"] },
    amazon: { name: "Amazon", emoji: "📦", type: "Big Tech · FAANG", color: "#FF9900", founded: "1994", size: "1,500,000+", hq: "Seattle, WA", format: "5–7 rounds including a 'Bar Raiser' from another team", duration: "3–5 weeks", style: "Structured around 16 Leadership Principles", values: ["Customer Obsession", "Ownership", "Invent and Simplify", "Bias for Action", "Deliver Results"], tips: ["Prepare 2 STAR stories per Leadership Principle", "Bar Raiser will push back — stay calm", "Quantify everything", "Know the 16 LPs cold"], questions: ["Tell me about deciding without all the information.", "Describe disagreeing with your manager.", "Give an example of going above and beyond for a customer.", "How do you prioritise with too much on your plate?"] },
    meta: { name: "Meta", emoji: "🔷", type: "Big Tech · FAANG", color: "#0668E1", founded: "2004", size: "70,000+", hq: "Menlo Park, CA", format: "Recruiter → Technical phone → Onsite (Coding × 2, System Design, Behavioural)", duration: "3–5 weeks", style: "Heavy focus on coding skills. Move fast culture.", values: ["Move fast", "Build social value", "Be bold", "Focus on impact"], tips: ["LeetCode hard is standard for senior", "System design is critical", "They ask 'How would you improve Instagram'", "Show comfort with scale"], questions: ["Design Instagram's feed ranking.", "How would you measure success of a new feature?", "What would you build at Meta with 6 months and 5 people?"] },
    apple: { name: "Apple", emoji: "🍎", type: "Big Tech · FAANG", color: "#555555", founded: "1976", size: "160,000+", hq: "Cupertino, CA", format: "Recruiter → Technical screen → Onsite (6–8 rounds, highly secretive)", duration: "4–8 weeks", style: "Emphasis on quality, attention to detail, craft", values: ["Simplicity", "Privacy", "Quality over speed", "Craftsmanship"], tips: ["Know your speciality inside out", "Attention to detail is paramount", "Be prepared for deep project dives", "Critique Apple products thoughtfully"], questions: ["How would you improve iPhone accessibility?", "Design an offline-first iOS app.", "What Apple product would you redesign and why?"] },
    spotify: { name: "Spotify", emoji: "🎵", type: "Tech · Scale-up", color: "#1DB954", founded: "2006", size: "9,500+", hq: "Stockholm", format: "Recruiter → Hiring manager → Technical (2 rounds) → Values", duration: "2–4 weeks", style: "Collaborative, values-driven, high autonomy", values: ["Autonomy & trust", "Innovation", "Collaboration", "Authenticity"], tips: ["Show genuine passion for music/podcasting", "Understand squads/tribes model", "Culture fit is weighted heavily", "Portfolio matters"], questions: ["Why Spotify over other music/tech companies?", "Tell me about a project with full autonomy.", "What would you change about Spotify today?"] },
    monzo: { name: "Monzo", emoji: "🏧", type: "Fintech", color: "#FF4970", founded: "2015", size: "3,000+", hq: "London", format: "Recruiter → Take-home task → Technical → Values interview", duration: "2–3 weeks", style: "Informal, mission-driven, financial inclusion focus", values: ["Make money work for everyone", "Transparency", "Diversity", "Move fast"], tips: ["Use Monzo and have product opinions", "Take-home task matters a lot", "Value directness over polish"], questions: ["What would you change about the Monzo app?", "How do you balance speed with reliability?", "Why fintech? Why Monzo?"] },
    goldman: { name: "Goldman Sachs", emoji: "💰", type: "Finance · IB", color: "#0066CC", founded: "1869", size: "45,000+", hq: "New York", format: "HireVue → Superday (6–8 back-to-back)", duration: "6–10 weeks", style: "Extremely competitive. Mix of technical finance and fit.", values: ["Excellence", "Integrity", "Client focus", "Teamwork"], tips: ["Know 'Why Goldman' cold", "Walk through CV in detail", "Know current market conditions", "Show intellectual curiosity about markets"], questions: ["Walk me through your CV.", "Pitch me a stock.", "Where do you see interest rates in 12 months?"] },
    deepmind: { name: "DeepMind", emoji: "🧠", type: "AI Research", color: "#4285F4", founded: "2010", size: "1,500+", hq: "London", format: "Research talk → 3–4 research interviews → Values alignment", duration: "6–12 weeks", style: "Extremely rigorous. Long-term research impact.", values: ["Scientific rigour", "Safety-conscious AI", "Multidisciplinary thinking"], tips: ["Deep knowledge of 2–3 ML sub-areas", "Be ready to whiteboard proofs", "Read recent DeepMind papers", "Show alignment with responsible AI"], questions: ["Walk me through a research paper you found interesting.", "Design an RL environment for a novel task.", "What are the most important open problems in ML?"] },
    bbc: { name: "BBC", emoji: "📺", type: "Media · Public", color: "#BB1919", founded: "1927", size: "22,000+", hq: "London", format: "Application → Online tests → Video → Assessment centre", duration: "8–12 weeks", style: "Public sector, values-heavy, public service mission", values: ["Impartiality", "Public service", "Creativity", "Accuracy"], tips: ["Know editorial guidelines", "Show passion for media's role", "For tech roles, know BBC scale (iPlayer, Sounds)", "Assessment centres test collaboration"], questions: ["Why BBC over a commercial broadcaster?", "How would you improve BBC iPlayer?", "How do you feel about impartiality?"] },
};
