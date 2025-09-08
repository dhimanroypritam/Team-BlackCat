import React, { useEffect, useMemo, useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { sendEmailVerification, sendPasswordResetEmail, browserLocalPersistence, setPersistence } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiMenu } from "react-icons/fi";
import { FaUsers, FaTrophy, FaCalendarAlt, FaMedal, FaDiscord, FaGithub, FaYoutube, FaFacebookF, FaExternalLinkAlt, FaUserCircle } from "react-icons/fa";


/**
 * ---- Team BlackCat Starter (Single-file) ----
 * Tech: React + React Router + TailwindCSS + (optional) DaisyUI + Firebase Auth + Firestore
 * Deploy target: Netlify
 *
 * Quick setup (outside this file):
 * 1) Create a Firebase project -> Web App -> copy config -> set the following Vite env vars:
 *    VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
 *    VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
 * 2) Ensure Tailwind (and DaisyUI if desired) is installed and configured.
 * 3) Deploy to Netlify; for Vite, set build command: `npm run build` and publish dir: `dist`.
 */

// ---- Firebase Bootstrapping (safe re-init) ----
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}
const auth = getAuth(app);
const db = getFirestore(app);

// ---- Auth Context ----
const AuthCtx = createContext({ user: null, loading: true });
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setPersistence(auth, browserLocalPersistence);
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                // Fetch profile document (may contain extra fields)
                const ref = doc(db, "users", fbUser.uid);
                const snap = await getDoc(ref).catch(() => null);
                const profile = snap?.exists() ? snap.data() : {};
                setUser({ ...fbUser, profile });
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const value = useMemo(() => ({ user, loading }), [user, loading]);
    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// ---- Layout & Header ----
function Header() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const toggle = () => setOpen((s) => !s);
    const close = () => setOpen(false);
    const location = useLocation();
    useEffect(() => close(), [location.pathname]);

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link to="/" className="font-black tracking-tight text-xl md:text-2xl">Team <span className="text-indigo-600">BlackCat</span></Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <NavLink to="/who-we-are" text="Who are we" />
                    <NavLink to="/achievements" text="Achievements" />
                    <NavLink to="/events" text="Events" />
                    <Link
                        to={user ? "/profile" : "/auth"}
                        className={`flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition ${location.pathname === "/profile" ? "text-indigo-600" : ""}`}
                        title="Your Profile"
                    >
                        Your Profile
                        {user && <FaUserCircle size={22} className="ml-1" />}
                    </Link>
                </nav>

                {/* Mobile menu toggle: hamburger (horizontal lines) -> close */}
                <button onClick={toggle} aria-label="Toggle Menu" className="md:hidden p-2 rounded-xl border border-slate-300">
                    {open ? (
                        // Close icon (X)
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    ) : (
                        // Hamburger icon (horizontal lines)
                        <FiMenu size={20} />
                    )}
                </button>
            </div>

            {/* Mobile Drawer */}
            {open && (
                <div className="md:hidden border-t border-slate-200 bg-white">
                    <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 text-base">
                        <MobileLink to="/who-we-are" text="Who are we" />
                        <MobileLink to="/achievements" text="Achievements" />
                        <MobileLink to="/events" text="Upcoming Events" />
                        <MobileLink to={user ? "/profile" : "/auth"} text="Your Profile" />
                    </div>
                </div>
            )}
        </header>
    );
}

function NavLink({ to, text }) {
    const location = useLocation();
    const active = location.pathname === to;
    return (
        <Link to={to} className={`hover:text-indigo-600 transition ${active ? "text-indigo-600" : "text-slate-700"}`}>{text}</Link>
    );
}
function MobileLink({ to, text }) {
    return (
        <Link to={to} className="py-2 px-3 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-slate-800">{text}</Link>
    );
}

function Layout({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <Header />
            <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">{children}</main>
            <footer className="border-t border-slate-200 bg-white/70">
                <p className="text-red-600 md:px-32 p-6 py-5">Disclaimer:<br />
                    All information presented on this website is purely fictitious and created solely for portfolio and demonstration purposes. Any resemblance to actual persons, institutions, or events is entirely coincidental. The developer bears no responsibility or liability for the accuracy, authenticity, or interpretation of the content displayed herein.</p>
                <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between gap-2">
                    <span>© {new Date().getFullYear()} Team BlackCat</span>
                    <span>Built with React • TailwindCSS  • Firebase</span>
                    <span>Developed By Dhiman Roy</span>
                </div>
            </footer>
        </div>
    );
}
// ---- Pages ----
function Home() {
    const sliderImages = [
        "https://raw.githubusercontent.com/dr12029/img/6f2b48b8496abe9d89061ee15a8e11017fa4674f/emdebbed.jpg",
        "https://raw.githubusercontent.com/dr12029/img/main/slider2.jpg",
        "https://raw.githubusercontent.com/dr12029/img/main/slider3.jpg"
    ];

    // Slide content for each image
    const sliderContent = [
        {
            heading: "We build together.",
            desc: "Team BlackCat is a student-driven tech crew passionate about embedded systems, competitive programming, PCB design, and real-world projects."
        },
        {
            heading: "We learn together.",
            desc: "Join our workshops and peer-led sessions to master new tech skills, solve problems, and grow as a community."
        },
        {
            heading: "We ship together.",
            desc: "From idea to execution, we launch real projects and help you build a portfolio that stands out."
        }
    ];

    const [current, setCurrent] = useState(0);
    const [showText, setShowText] = useState(true);

    // Auto-switch every 5 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setShowText(false); // hide text
            setTimeout(() => {
                setCurrent((prev) => (prev + 1) % sliderImages.length); // change image
                setTimeout(() => setShowText(true), 500); // show text after 0.5s
            }, 400); // match animation duration for hiding text
        }, 5000);
        return () => clearInterval(timer);
    }, [sliderImages.length]);

    // Manual dot navigation
    const goTo = (idx) => {
        setShowText(false);
        setTimeout(() => {
            setCurrent(idx);
            setTimeout(() => setShowText(true), 500);
        }, 400);
    };

    return (
        <Layout>
            {/* Slider Section */}
            <section className="relative h-72 md:h-96 rounded-3xl overflow-hidden shadow mb-10">
                <img
                    src={sliderImages[current]}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                    style={{ opacity: 1 }}
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
                    {/* Animated text */}
                    <div
                        className={`
        transition-all duration-400
        ${showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
      `}
                    >
                        <h1 className="text-lg sm:text-2xl md:text-4xl font-extrabold tracking-tight drop-shadow mb-2 max-w-2xl mx-auto">
                            {sliderContent[current].heading}
                        </h1>
                        <p className="text-sm sm:text-base md:text-lg font-medium drop-shadow mb-6 max-w-3xl mx-auto px-2 sm:px-6 md:px-12">
                            {sliderContent[current].desc}
                        </p>
                    </div>
                    {/* Buttons */}
                    <div className="mt-6 flex flex-wrap gap-3 justify-center">
                        <Link
                            to="/events"
                            className="inline-flex items-center justify-center rounded-2xl px-4 py-2 sm:px-5 sm:py-3 bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 text-sm sm:text-base"
                        >
                            Explore Events
                        </Link>
                        <Link
                            to="/who-we-are"
                            className="inline-flex items-center justify-center rounded-2xl px-4 py-2 sm:px-5 sm:py-3 border border-slate-300 font-semibold bg-white/80 text-slate-900 hover:bg-white text-sm sm:text-base"
                        >
                            Who are we
                        </Link>
                    </div>
                </div>
                {/* Dots */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                    {sliderImages.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goTo(idx)}
                            className={`w-3 h-3 rounded-full ${current === idx ? "bg-white" : "bg-white/50"
                                } border border-white`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </section>


            {/* At a glace Section */}
            <section className="mt-36">
                <h2 className="text-3xl font-black text-center mb-8 text-slate-800">At a Glance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow ">
                        <FaUsers className="text-red-500 text-4xl mb-3" />
                        <div className="text-3xl font-extrabold text-slate-900">450+</div>
                        <div className="text-slate-600 mt-1 text-center">Active Members</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow ">
                        <FaTrophy className="text-red-500 text-4xl mb-3" />
                        <div className="text-3xl font-extrabold text-slate-900">3</div>
                        <div className="text-slate-600 mt-1 text-center">Flagship Projects</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow ">
                        <FaCalendarAlt className="text-red-500 text-4xl mb-3" />
                        <div className="text-3xl font-extrabold text-slate-900">12+</div>
                        <div className="text-slate-600 mt-1 text-center">Workshops Hosted Annually</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow ">
                        <FaMedal className="text-red-500 text-4xl mb-3" />
                        <div className="text-3xl font-extrabold text-slate-900">5</div>
                        <div className="text-slate-600 mt-1 text-center">National Competitions Organized</div>
                    </div>
                </div>
            </section>

            {/* Get in touch section */}
            <section className="mt-40 mb-12">
                <div className="text-center">
                    <span className="inline-block px-4 py-1 mb-2 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-xs border border-indigo-100">
                        Connect & Collaborate
                    </span>
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-3">
                        Join Our <span className="text-indigo-600">Community</span>
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto mb-8">
                        Connect with fellow tech enthusiasts, share your projects, learn from others, and be part of our growing community across multiple platforms.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {/* Discord */}
                    <a href="https://discord.gg/your-invite" target="_blank" rel="noopener noreferrer"
                        className="bg-indigo-50 hover:bg-indigo-100 transition rounded-2xl p-6 flex flex-col shadow border border-indigo-100 relative group">
                        <FaDiscord className="text-indigo-500 text-3xl mb-3" />
                        <div className="font-bold text-lg text-slate-900 mb-1 flex items-center">
                            Discord Community
                            <FaExternalLinkAlt className="ml-2 text-xs text-slate-400 group-hover:text-indigo-500" />
                        </div>
                        <div className="text-slate-600 text-sm mb-4">Join our active discussions and collaborate on projects</div>
                    </a>
                    {/* GitHub */}
                    <a href="https://github.com/dr12029/img" target="_blank" rel="noopener noreferrer"
                        className="bg-slate-50 hover:bg-slate-100 transition rounded-2xl p-6 flex flex-col shadow border border-slate-100 relative group">
                        <FaGithub className="text-slate-700 text-3xl mb-3" />
                        <div className="font-bold text-lg text-slate-900 mb-1 flex items-center">
                            Open Source
                            <FaExternalLinkAlt className="ml-2 text-xs text-slate-400 group-hover:text-slate-700" />
                        </div>
                        <div className="text-slate-600 text-sm mb-4">Contribute to our open-source robotics and tech projects</div>
                    </a>
                    {/* YouTube */}
                    <a href="https://youtube.com/@your-channel" target="_blank" rel="noopener noreferrer"
                        className="bg-red-50 hover:bg-red-100 transition rounded-2xl p-6 flex flex-col shadow border border-red-100 relative group">
                        <FaYoutube className="text-red-500 text-3xl mb-3" />
                        <div className="font-bold text-lg text-slate-900 mb-1 flex items-center">
                            YouTube Channel
                            <FaExternalLinkAlt className="ml-2 text-xs text-slate-400 group-hover:text-red-500" />
                        </div>
                        <div className="text-slate-600 text-sm mb-4">Watch tutorials, project demos, and competition highlights</div>

                    </a>
                    {/* Facebook */}
                    <a href="https://facebook.com/your-page" target="_blank" rel="noopener noreferrer"
                        className="bg-blue-50 hover:bg-blue-100 transition rounded-2xl p-6 flex flex-col shadow border border-blue-100 relative group">
                        <FaFacebookF className="text-blue-600 text-3xl mb-3" />
                        <div className="font-bold text-lg text-slate-900 mb-1 flex items-center">
                            Facebook Page
                            <FaExternalLinkAlt className="ml-2 text-xs text-slate-400 group-hover:text-blue-600" />
                        </div>
                        <div className="text-slate-600 text-sm mb-4">Stay updated with latest news and events</div>
                    </a>
                </div>
            </section>

        </Layout>
    );
}

function WhoWeAre() {
    return (
        <Layout>
            <section className="max-w-4xl mx-auto py-10">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
                    Who Are <span className="text-indigo-600">We?</span>
                </h2>
                <p className="text-lg text-slate-700 text-center max-w-2xl mx-auto mb-8">
                    Team BlackCat was originally founded in 2014 by a small group of passionate students from BUET and RUET. What started as an informal gathering of friends with a shared dream has now evolved into a thriving community of learners, innovators, and creators from across all public and private universities in Bangladesh. Even college students are now actively connected to the team through various training and mentorship programs.
                </p>
                <div className="bg-white rounded-2xl shadow p-6 md:p-10 mb-8 border">
                    <p className="text-slate-700 text-base md:text-lg mb-4">
                        From the very beginning, our motto has been simple yet powerful: to innovate and to upgrade the skills of students so that they can confidently shape the future. Over the years, we have hosted numerous workshops, hackathons, and free training sessions that have empowered young learners to explore areas such as competitive programming, PCB design, microprocessors, and embedded systems.
                    </p>
                    <p className="text-slate-700 text-base md:text-lg mb-4">
                        Our mission extends beyond just technical training. We believe that by nurturing problem-solving skills, creativity, and leadership qualities, students can become valuable assets not only for themselves but also for the country. Many of our alumni are now excelling in top companies, leading research groups, or contributing to startups that strengthen Bangladesh’s technological backbone.
                    </p>
                    <p className="text-slate-700 text-base md:text-lg mb-4">
                        To ensure consistent growth, Team BlackCat is supervised by experienced teachers and industry experts from both Bangladesh and abroad. This blend of local knowledge and global expertise allows us to guide students in a way that is practical, forward-thinking, and future-ready.
                    </p>
                    <p className="text-slate-700 text-base md:text-lg mb-4">
                        Currently, under the leadership of Prof. Dr. David Millar, an internationally recognized academic and mentor, our team is pushing forward with new initiatives. These include:
                    </p>
                    <ul className="list-disc pl-6 text-slate-700 text-base md:text-lg mb-4">
                        <li>Offering hands-on technical training in cutting-edge fields like AI, IoT, and VLSI design.</li>
                        <li>Establishing a student-led innovation hub, where creative projects are supported and showcased.</li>
                        <li>Providing career development workshops to help students bridge the gap between education and professional life.</li>
                        <li>Creating opportunities for international collaboration with students and faculty from other countries.</li>
                    </ul>
                    <p className="text-slate-700 text-base md:text-lg">
                        With passion at our core and guidance from visionary mentors, Team BlackCat is not just a team—it’s a movement, one that continues to inspire the youth of Bangladesh to dream bigger and achieve greater.
                    </p>
                </div>

                {/* Letter/Quote Section */}
                <div className="bg-indigo-50 border-l-4 border-indigo-400 rounded-2xl p-6 md:p-8 shadow mb-8">
                    <div className="mb-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs mb-2">
                            Message from the Chief
                        </span>
                    </div>
                    <blockquote className="text-slate-800 text-base md:text-lg italic mb-4">
                        <p>
                            Dear Students,<br /><br />
                            It gives me immense pleasure to witness the remarkable journey of Team BlackCat. Since its formation in 2014, the team has grown into a strong platform that empowers students from diverse educational backgrounds to learn, innovate, and contribute to society.<br /><br />
                            In today’s rapidly changing world, knowledge and skills are the most powerful tools. Team BlackCat has consistently demonstrated how young minds, when nurtured and guided, can create a lasting impact. Through training programs, mentorship, and collaborative projects, this community has become a symbol of hope and progress for the nation’s youth.<br /><br />
                            I am particularly proud of how the team is opening doors not just for university students, but also for college learners who are eager to explore technology at an early age. By doing so, we are building a pipeline of talent that will serve Bangladesh and beyond.<br /><br />
                            My vision is simple: to see every student who joins Team BlackCat leave with greater confidence, stronger skills, and a renewed sense of purpose. With the dedication of our mentors and the enthusiasm of our members, I am confident that this vision will become a reality.<br /><br />
                            Let us continue to innovate, to learn, and to serve—together.
                        </p>
                    </blockquote>
                    <div className="flex items-center gap-4 mt-4">
                        <img
                            src="https://randomuser.me/api/portraits/men/32.jpg"
                            alt="Prof. Dr. David Millar"
                            className="w-14 h-14 rounded-full border-2 border-indigo-400"
                        />
                        <div>
                            <div className="font-bold text-slate-900">Prof. Dr. David Millar</div>
                            <div className="text-slate-700 text-sm">Chief, Team BlackCat</div>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
function Achievements() {
    return (
        <Layout>
            <section className="max-w-5xl mx-auto py-10">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-slate-900">
                    Our <span className="text-indigo-600">Achievements</span>
                </h2>
                <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-10">
                    Team BlackCat members have built innovative projects, excelled in competitions, and collaborated with industry and academia to push the boundaries of student engineering in Bangladesh.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Firefighting Robot */}
                    <div className="bg-white rounded-2xl shadow p-6 flex flex-col justify-between items-start border h-[480px]">
                        <img
                            src="https://raw.githubusercontent.com/dr12029/img/main/firefighting.webp"
                            alt="Firefighting Robot"
                            className="w-full h-56 object-cover rounded-xl border mb-5"
                        />
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 text-left">Low-Cost Firefighting Robot</h3>
                            <p className="text-slate-700 text-left mb-3">
                                Developed in collaboration with Bangladesh Fire Service, this autonomous robot can detect and extinguish small fires in hazardous environments, helping to save lives and property.
                            </p>
                        </div>
                        <div className="w-full flex justify-end mt-4">
                            <span className="inline-block bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">Collab: Bangladesh Fire Service</span>
                        </div>
                    </div>
                    {/* AI Search Drone */}
                    <div className="bg-white rounded-2xl shadow p-6 flex flex-col justify-between items-start border h-[480px]">
                        <img
                            src="https://raw.githubusercontent.com/dr12029/img/main/drone.webp"
                            alt="AI Search Drone"
                            className="w-full h-56 object-cover rounded-xl border mb-5"
                        />
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 text-left">AI-Powered Search Drone</h3>
                            <p className="text-slate-700 text-left mb-3">
                                A custom drone equipped with AI vision for search and rescue in forests and coastal areas. Built in partnership with <span className="font-semibold">SkyVision Robotics</span>.
                            </p>
                        </div>
                        <div className="w-full flex justify-end mt-4">
                            <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">Collab: SkyVision Robotics</span>
                        </div>
                    </div>
                    {/* ICPC Participation */}
                    <div className="bg-white rounded-2xl shadow p-6 flex flex-col justify-between items-start border h-[480px]">
                        <img
                            src="https://raw.githubusercontent.com/dr12029/img/main/cp.webp"
                            alt="ICPC Programming"
                            className="w-full h-56 object-contain rounded-xl border bg-white mb-5"
                        />
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 text-left">ICPC Programming Success</h3>
                            <p className="text-slate-700 text-left mb-3">
                                Our members have participated in multiple ICPC regional contests, winning prizes and representing their universities at the national level.
                            </p>
                        </div>
                        <div className="w-full flex justify-end mt-4">
                            <span className="inline-block bg-yellow-50 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">Competitive Programming</span>
                        </div>
                    </div>
                    {/* Competition Wins */}
                    <div className="bg-white rounded-2xl shadow p-6 flex flex-col justify-between items-start border h-[480px]">
                        <img
                            src="https://raw.githubusercontent.com/dr12029/img/main/robowar.webp"
                            alt="RoboWar 2024"
                            className="w-full h-56 object-cover rounded-xl border mb-5"
                        />
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 text-left">RoboWar 2024</h3>
                            <p className="text-slate-700 text-left mb-3">
                                Our team’s robot outperformed all competitors in the national RoboWar, securing the <span className="font-semibold text-green-600">Champion</span> title.
                            </p>
                        </div>
                        <div className="w-full flex justify-end mt-4">
                            <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Champion</span>
                        </div>
                    </div>
                    {/* Bangladesh Innovation Challenge */}
                    <div className="bg-white rounded-2xl shadow p-6 flex flex-col justify-between items-start border h-[480px]">
                        <img
                            src="https://raw.githubusercontent.com/dr12029/img/main/innovation.webp"
                            alt="Bangladesh Innovation Challenge"
                            className="w-full h-56 object-cover rounded-xl border mb-5"
                        />
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 text-left">Bangladesh Innovation Challenge 2023</h3>
                            <p className="text-slate-700 text-left mb-3">
                                Our innovative smart city solution earned us the <span className="font-semibold text-yellow-600">1st Runners Up</span> award in this prestigious national competition.
                            </p>
                        </div>
                        <div className="w-full flex justify-end mt-4">
                            <span className="inline-block bg-yellow-50 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">1st Runners Up</span>
                        </div>
                    </div>
                    {/* Smart City Hackathon */}
                    <div className="bg-white rounded-2xl shadow p-6 flex flex-col justify-between items-start border h-[480px]">
                        <img
                            src="https://raw.githubusercontent.com/dr12029/img/main/hackathon.webp"
                            alt="Smart City Hackathon"
                            className="w-full h-56 object-cover rounded-xl border mb-5"
                        />
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 text-left">Smart City Hackathon 2023</h3>
                            <p className="text-slate-700 text-left mb-3">
                                Our hardware project was recognized as the <span className="font-semibold text-indigo-600">Best Hardware Project</span> among 50+ teams.
                            </p>
                        </div>
                        <div className="w-full flex justify-end mt-4">
                            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">Best Hardware Project</span>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

// ---- Event Data ----
const mentors = {
    cp: { name: "Shafin Rahman", photo: "https://i.pravatar.cc/100?img=15" },
    pcb: { name: "Arpa Sultana", photo: "https://i.pravatar.cc/100?img=32" },
    uP: { name: "Fahim Ahmed", photo: "https://i.pravatar.cc/100?img=47" },
    embedded: { name: "Nusrat Noor", photo: "https://i.pravatar.cc/100?img=12" },
};

const previousEvents = [
    {
        id: "cp",
        title: "Free Online Training: Competitive Programming",
        brief: "Kickstart your problem-solving with time complexity, STL, and patterns.",
        duration: "June 10–15, 2025",
        photo: "https://raw.githubusercontent.com/dr12029/img/main/cp.webp",
        details: {
            participants: 120,
            objective: "Introduce algorithmic thinking and CP workflows.",
            taught: [
                "Time complexity basics",
                "Arrays/Strings patterns",
                "Intro to STL & templates",
                "Problem-solving drills"
            ],
            syllabus: [
                { week: "Day 1", topic: "Complexity & Input/Output" },
                { week: "Day 2", topic: "Arrays, Strings, and Patterns" },
                { week: "Day 3", topic: "STL & Templates" },
                { week: "Day 4", topic: "Problem Solving Marathon" },
            ],
            features: [
                "Live coding sessions",
                "Practice contests",
                "Peer discussion forum",
                "Certificate for top performers"
            ],
            mentorKey: "cp",
        },
    },
    {
        id: "pcb",
        title: "Free Online Training: PCB Design",
        brief: "From schematic to board: rules, footprints, and manufacturing prep.",
        duration: "July 05–09, 2025",
        photo: "https://raw.githubusercontent.com/dr12029/img/main/pcb.webp",
        details: {
            participants: 95,
            objective: "Demystify PCB tools and best practices for beginners.",
            taught: [
                "Schematic capture",
                "Footprint libraries",
                "Design rules",
                "Gerbers & fab"
            ],
            syllabus: [
                { week: "Day 1", topic: "Intro to PCB & Schematic Capture" },
                { week: "Day 2", topic: "Footprints & Libraries" },
                { week: "Day 3", topic: "Design Rules & Layout" },
                { week: "Day 4", topic: "Gerber Generation & Manufacturing" },
            ],
            features: [
                "Hands-on with PCB software",
                "Project-based learning",
                "Q&A with industry mentors",
                "Design review session"
            ],
            mentorKey: "pcb",
        },
    },
    {
        id: "uP",
        title: "Free Online: Get Familiar with a Popular Microprocessor",
        brief: "Architecture overview, I/O, interrupts, and basic toolchain.",
        duration: "August 20–22, 2025",
        photo: "https://raw.githubusercontent.com/dr12029/img/main/mpu.webp",
        details: {
            participants: 110,
            objective: "Build foundational understanding of a common microprocessor.",
            taught: [
                "Architecture blocks",
                "GPIO & peripherals",
                "Interrupt model",
                "Toolchain quickstart"
            ],
            syllabus: [
                { week: "Day 1", topic: "Microprocessor Architecture" },
                { week: "Day 2", topic: "GPIO, Peripherals & Interrupts" },
                { week: "Day 3", topic: "Toolchain & Debugging" },
            ],
            features: [
                "Virtual lab demos",
                "Sample code walkthroughs",
                "Mentor office hours",
                "Project showcase"
            ],
            mentorKey: "uP",
        },
    },
];

const upcomingEvent = {
    id: "embedded",
    title: "Training: Embedded Systems (Beginner to Practical)",
    brief: "Hands-on microcontrollers, peripherals, and real projects.",
    duration: "October 12–19, 2025 (Tentative)",
    photo: "https://raw.githubusercontent.com/dr12029/img/main/embedded2.webp",
    details: {
        participants: "TBA",
        objective: "Enable learners to build and debug embedded applications end-to-end.",
        taught: [
            "C basics on MCU",
            "GPIO, timers, PWM",
            "Sensors & drivers",
            "Debugging & deployments"
        ],
        syllabus: [
            { week: "Day 1", topic: "Intro to Embedded & C Basics" },
            { week: "Day 2", topic: "GPIO, Timers, and PWM" },
            { week: "Day 3", topic: "Sensors & Drivers" },
            { week: "Day 4", topic: "Debugging & Deployments" },
        ],
        features: [
            "Live hardware demos",
            "Project-based assignments",
            "Mentor feedback",
            "Certificate of completion"
        ],
        mentorKey: "embedded",
    },
};

function Events() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleEnroll = () => {
        if (user) {
            toast.info("Registration will open shortly.");
        } else {
            navigate("/auth", { replace: true });
        }
    };

    return (
        <Layout>
            <section className="max-w-5xl mx-auto py-10">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-2 text-slate-900">
                    <span className="text-indigo-600">Events</span> & Trainings
                </h2>
                <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-10">
                    We regularly host free and premium workshops, competitions, and hands-on training sessions for students of all backgrounds. Explore our upcoming and previous events!
                </p>

                {/* Upcoming Event */}
                <div className="mb-14">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs">
                            Upcoming Event
                        </span>
                        <span className="text-sm text-slate-500">{upcomingEvent.duration}</span>
                    </div>
                    <div className="bg-white rounded-2xl shadow border p-6 flex flex-col md:flex-row-reverse gap-4 items-center">
                        <img
                            src={upcomingEvent.photo}
                            alt="Embedded Training"
                            className="w-full md:w-xl h-auto object-cover rounded-xl border mb-4 md:mb-0"
                        />
                        <div className="flex-1 flex flex-col justify-between h-full">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">{upcomingEvent.title}</h3>
                                <p className="text-slate-700 mb-2">{upcomingEvent.brief}</p>
                                <ul className="list-disc pl-5 text-sm text-slate-700 mb-3">
                                    {upcomingEvent.details.taught.map((t, i) => <li key={i}>{t}</li>)}
                                </ul>
                                <div className="flex items-center gap-3 mt-2">
                                    <img src={mentors[upcomingEvent.details.mentorKey].photo} alt="mentor" className="w-10 h-10 rounded-full" />
                                    <span className="text-sm">Mentor: <b>{mentors[upcomingEvent.details.mentorKey].name}</b></span>
                                </div>
                            </div>
                            <div className="mt-5">
                                <button onClick={handleEnroll} className="rounded-2xl px-5 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition">Enroll</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Previous Events */}
                <h3 className="text-xl font-bold mb-4 text-slate-900">Previous Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {previousEvents.map((ev) => (
                        <article key={ev.id} className="rounded-2xl border bg-white shadow p-0 flex flex-col h-full overflow-hidden">
                            <img src={ev.photo} alt={ev.title} className="w-full h-40 rounded-2xl p-2" />
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={mentors[ev.details.mentorKey].photo} alt="mentor" className="w-10 h-10 rounded-full" />
                                    <div>
                                        <div className="font-semibold text-slate-900">{mentors[ev.details.mentorKey].name}</div>
                                        <div className="text-xs text-slate-500">Mentor</div>
                                    </div>
                                </div>
                                <h4 className="font-bold text-lg text-slate-900 mb-1">{ev.title}</h4>
                                <p className="text-slate-600 mb-2 text-sm">{ev.brief}</p>
                                <p className="text-xs text-slate-500 mb-2">Duration: {ev.duration}</p>
                                <ul className="list-disc pl-5 text-xs text-slate-700 mb-3">
                                    {ev.details.taught.map((t, i) => <li key={i}>{t}</li>)}
                                </ul>
                                <div className="mt-auto">
                                    <Link to={`/events/${ev.id}`} className="inline-flex items-center rounded-2xl px-4 py-2 border border-slate-300 hover:bg-white font-semibold text-sm text-indigo-700">
                                        View details
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </Layout>
    );
}

function EventDetail() {
    const { id } = useParams();
    const dataset = [...previousEvents, upcomingEvent];
    const ev = dataset.find((e) => e.id === id);
    if (!ev) return <Layout><p className="text-slate-600">Event not found.</p></Layout>;
    const mentor = mentors[ev.details.mentorKey];

    return (
        <Layout>
            <div className="max-w-3xl mx-auto">
                <Link to="/events" className="text-sm text-indigo-700">← Back to Events</Link>
                <img src={ev.photo} alt={ev.title} className="w-full 56h- object-cover rounded-2xl mt-4 mb-6 shadow" />
                <h2 className="mt-3 text-2xl md:text-3xl font-bold">{ev.title}</h2>
                <p className="text-slate-600 mt-2">{ev.brief}</p>
                <p className="text-sm text-slate-500 mt-2">Duration: {ev.duration}</p>
                <div className="flex items-center gap-3 mt-4 mb-6">
                    <img src={mentor.photo} alt="mentor" className="w-12 h-12 rounded-full" />
                    <div className="text-sm">Mentor: <b>{mentor.name}</b></div>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <div className="font-semibold text-slate-900 mb-2">Syllabus & Timeline</div>
                        <ul className="list-disc pl-5 text-sm text-slate-700">
                            {ev.details.syllabus?.map((s, i) => (
                                <li key={i}><span className="font-semibold">{s.week}:</span> {s.topic}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900 mb-2">Features</div>
                        <ul className="list-disc pl-5 text-sm text-slate-700">
                            {ev.details.features?.map((f, i) => (
                                <li key={i}>{f}</li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div>
                    <div className="font-semibold text-slate-900 mb-2">What was taught</div>
                    <ul className="list-disc pl-5 text-sm text-slate-700">
                        {ev.details.taught.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                </div>
            </div>
        </Layout>
    );
}

function Row({ label, value }) {
    return (
        <div className="text-sm">
            <span className="font-semibold">{label}: </span>
            <span className="text-slate-700">{value}</span>
        </div>
    );
}

// ---- Auth Pages ----
function AuthPage() {
    const [mode, setMode] = useState("login");
    return (
        <Layout>
            <div className="max-w-xl mx-auto">
                <div className="flex rounded-2xl border bg-white p-2 shadow-sm mb-6">
                    <button onClick={() => setMode("login")} className={`flex-1 rounded-xl py-2 font-semibold ${mode === "login" ? "bg-slate-900 text-white" : ""}`}>Login</button>
                    <button onClick={() => setMode("signup")} className={`flex-1 rounded-xl py-2 font-semibold ${mode === "signup" ? "bg-slate-900 text-white" : ""}`}>Sign up</button>
                </div>
                {mode === "login" ? <LoginForm /> : <SignupForm onSignedUpSwitchToLogin={() => setMode("login")} />}
            </div>
        </Layout>
    );
}

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetMsg, setResetMsg] = useState("");
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Sign in successful!");
            navigate("/profile", { replace: true });
        } catch (err) {
            let msg = "Something went wrong. Please try again.";
            if (err.code === "auth/user-not-found") msg = "No account found with this email.";
            else if (err.code === "auth/wrong-password") msg = "Incorrect password.";
            else if (err.code === "auth/invalid-email") msg = "Invalid email address.";
            else if (err.code === "auth/too-many-requests") msg = "Too many failed attempts. Please try again later.";
            toast.error(msg);
            setError(msg);
        }
    };

    // Forgot password handler
    const handleReset = async (e) => {
        e.preventDefault();
        setResetMsg("");
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetMsg("Password reset email sent! Check your inbox.");
            toast.success("Password reset email sent!");
        } catch (err) {
            let msg = "Could not send reset email.";
            if (err.code === "auth/user-not-found") msg = "No account found with this email.";
            else if (err.code === "auth/invalid-email") msg = "Invalid email address.";
            setResetMsg(msg);
            toast.error(msg);
        }
    };

    return (
        <form onSubmit={submit} className="rounded-2xl border bg-white p-6 shadow">
            <h3 className="text-xl font-bold">Log in</h3>
            <div className="mt-4 grid gap-4">
                <div>
                    <label className="text-sm">Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" className="mt-1 w-full rounded-xl border p-2" />
                </div>
                <div>
                    <label className="text-sm">Password</label>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="••••••••" className="mt-1 w-full rounded-xl border p-2" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="rounded-2xl px-4 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700">Log in</button>
                <button type="button" className="text-xs text-indigo-700 mt-2 underline" onClick={() => setShowReset((s) => !s)}>
                    Forgot password?
                </button>
                {showReset && (
                    <form onSubmit={handleReset} className="mt-2">
                        <input
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            type="email"
                            required
                            placeholder="Enter your email"
                            className="w-full rounded-xl border p-2 mb-2"
                        />
                        <button type="submit" className="rounded-xl px-3 py-1 bg-indigo-500 text-white text-xs">Send reset link</button>
                        {resetMsg && <p className="text-xs mt-1 text-green-600">{resetMsg}</p>}
                    </form>
                )}
            </div>
        </form>
    );
}

function SignupForm({ onSignedUpSwitchToLogin }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [dob, setDob] = useState("");
    const [institution, setInstitution] = useState("");
    const [error, setError] = useState("");
    const [touched, setTouched] = useState(false);
    const navigate = useNavigate();

    // Password validation
    const criteria = [
        { label: "At least 8 characters", valid: password.length >= 8 },
        { label: "At least one uppercase letter", valid: /[A-Z]/.test(password) },
        { label: "At least one lowercase letter", valid: /[a-z]/.test(password) },
        { label: "At least one number", valid: /\d/.test(password) },
        { label: "At least one symbol", valid: /[^A-Za-z0-9]/.test(password) },
    ];
    const allValid = criteria.every(c => c.valid);

    const submit = async (e) => {
        e.preventDefault();
        setTouched(true);
        setError("");
        if (!allValid) {
            setError("Please meet all password criteria.");
            toast.error("Password does not meet all criteria.");
            return;
        }
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName: name });
            const ref = doc(db, "users", cred.user.uid);
            await setDoc(ref, {
                name,
                email,
                dob,
                institution,
                createdAt: new Date().toISOString(),
            });
            // Send verification email
            await sendEmailVerification(cred.user);
            toast.success("Sign up successful! Verification email sent.");
            navigate("/profile", { replace: true });
            onSignedUpSwitchToLogin?.();
        } catch (err) {
            let msg = "Something went wrong. Please try again.";
            if (err.code === "auth/email-already-in-use") msg = "This email is already registered.";
            else if (err.code === "auth/invalid-email") msg = "Invalid email address.";
            else if (err.code === "auth/weak-password") msg = "Password is too weak.";
            toast.error(msg);
            setError(msg);
        }
    };

    return (
        <form onSubmit={submit} className="rounded-2xl border bg-white p-6 shadow">
            <h3 className="text-xl font-bold">Create your account</h3>
            <div className="mt-4 grid gap-4">
                <div>
                    <label className="text-sm">Full name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} type="text" required placeholder="Jane Doe" className="mt-1 w-full rounded-xl border p-2" />
                </div>
                <div>
                    <label className="text-sm">Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" className="mt-1 w-full rounded-xl border p-2" />
                </div>
                <div>
                    <label className="text-sm">Password</label>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setTouched(true)}
                        type="password"
                        required
                        placeholder="At least 8 characters"
                        className="mt-1 w-full rounded-xl border p-2"
                    />
                    <ul className="mt-2 ml-2 text-xs text-slate-600">
                        {criteria.map((c, i) => (
                            <li key={i} className={touched && !c.valid ? "text-red-600" : c.valid ? "text-green-600" : ""}>
                                {c.valid ? "✓" : "✗"} {c.label}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <label className="text-sm">Date of birth</label>
                    <input value={dob} onChange={(e) => setDob(e.target.value)} type="date" required className="mt-1 w-full rounded-xl border p-2" />
                </div>
                <div>
                    <label className="text-sm">Currently enrolled institution</label>
                    <input value={institution} onChange={(e) => setInstitution(e.target.value)} type="text" required placeholder="Your university / college" className="mt-1 w-full rounded-xl border p-2" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="rounded-2xl px-4 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700">Sign up</button>
            </div>
        </form>
    );
}

function Profile() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    if (loading) return <Layout><p>Loading...</p></Layout>;
    if (!user) return <Navigate to="/auth" replace />;

    // Fix: always fallback to empty object if profile is missing
    const profile = user.profile || {};

    return (
        <Layout>
            <div className="max-w-xl mx-auto rounded-2xl border bg-white p-8 shadow flex flex-col items-center relative">
                <FaUserCircle className="absolute top-6 right-6 text-indigo-500" size={36} />
                <img
                    src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email)}`}
                    alt="avatar"
                    className="w-20 h-20 rounded-full border-2 border-indigo-200 mb-4"
                />
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{user.displayName || "Unnamed"}</h3>
                <p className="text-slate-600 mb-4">{user.email}</p>
                <div className="w-full grid gap-2 text-sm mb-6">
                    <Row label="Date of birth" value={profile.dob || "—"} />
                    <Row label="Institution" value={profile.institution || "—"} />
                    <Row label="Member since" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"} />
                </div>
                <div className="flex gap-3 w-full">
                    <button
                        onClick={async () => { await signOut(auth); navigate("/", { replace: true }); }}
                        className="rounded-2xl px-4 py-2 border border-slate-300 font-semibold hover:bg-white w-1/2"
                    >
                        Log out
                    </button>
                    <Link
                        to="/events"
                        className="rounded-2xl px-4 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 w-1/2 text-center"
                    >
                        Browse Events
                    </Link>
                </div>
            </div>
        </Layout>
    );
}

// ---- Router Guard wrapper (optional) ----
function Protected({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <Layout><p>Loading...</p></Layout>;
    if (!user) return <Navigate to="/auth" replace />;
    return children;
}

// ---- App Entrypoint ----
export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/who-we-are" element={<WhoWeAre />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:id" element={<EventDetail />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/profile" element={<Protected><Profile /></Protected>} />
                    <Route path="*" element={<Layout><p className="text-slate-600">Not found.</p></Layout>} />
                </Routes>
                <ToastContainer position="top-center" autoClose={2500} />
            </AuthProvider>
        </BrowserRouter>
    );
}