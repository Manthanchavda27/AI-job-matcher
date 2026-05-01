import { useState } from "react";
import Navbar from "../components/Navbar";

const faqs = [
  {
    q: "What is AI Job Matcher?",
    a: "AI Job Matcher is an intelligent job recommendation platform that uses Natural Language Processing (NLP) and machine learning to analyze your resume and match you with the most relevant job opportunities based on your skills, experience, and preferences.",
  },
  {
    q: "How does the AI matching work?",
    a: "Our AI engine extracts key information from your uploaded resume — including skills, education, experience, and projects — and compares it against job listings in our database using semantic similarity scoring. The higher the match score, the better the fit.",
  },
  {
    q: "Is my resume data secure?",
    a: "Absolutely. Your resume and personal data are stored securely and are never shared with third parties. We use encrypted storage and JWT-based authentication to protect your account at all times.",
  },
  {
    q: "Can I update my profile and skills manually?",
    a: "Yes! You can visit your Profile page to manually add or update your name, bio, and skills list at any time. This helps the AI give you even better recommendations.",
  },
  {
    q: "What file formats are supported for resume upload?",
    a: "Currently we support PDF format for resume uploads. Make sure your PDF is text-readable (not a scanned image) for the best AI analysis results.",
  },
  {
    q: "How do I apply for a job?",
    a: "Browse the Jobs page and click 'Apply Now' on any listing you're interested in. Your application will be recorded and you can track its status from your Dashboard.",
  },
  {
    q: "Is the platform free to use?",
    a: "Yes, AI Job Matcher is completely free for students and job seekers. Create an account, upload your resume, and start getting personalized job matches instantly.",
  },
  {
    q: "Can I log in with Google?",
    a: "Yes! We support Google OAuth for quick and secure sign-in. Just click 'Continue with Google' on the Login page and you'll be authenticated instantly without needing a separate password.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach our support team using the contact form on this page or by emailing us at support@aijobmatcher.com. We typically respond within 24 hours.",
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-6 py-4 flex justify-between items-center bg-white hover:bg-gray-50 transition"
      >
        <span className="font-medium text-gray-800 text-sm">{q}</span>
        <span className={`text-blue-600 text-xl transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-6 pb-4 bg-gray-50 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
          {a}
        </div>
      )}
    </div>
  );
}

export default function AboutContact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate submission
    setSubmitted(true);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HERO */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-900 text-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-5xl mb-4">💼</div>
          <h1 className="text-4xl font-extrabold mb-4">About AI Job Matcher</h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            We're on a mission to bridge the gap between talented candidates and the right opportunities using the power of Artificial Intelligence.
          </p>
        </div>
      </section>

      {/* ABOUT US */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Who We Are</h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "🎯",
              title: "Our Mission",
              text: "To empower students and job seekers with AI-driven insights that make job hunting smarter, faster, and more personalized than ever before.",
            },
            {
              icon: "🤖",
              title: "Our Technology",
              text: "We use NLP, machine learning, and semantic analysis to parse resumes, understand skills, and match candidates to the most relevant jobs in real time.",
            },
            {
              icon: "🌏",
              title: "Our Vision",
              text: "A world where every candidate — regardless of connections or background — has equal access to the opportunities that truly match their potential.",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow p-8 text-center hover:shadow-md transition"
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{card.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="bg-white py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Meet the Team</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { name: "Yashvi Bhadani", role: "Project Lead & AI Engineer", initial: "YB" },
              { name: "Astha", role: "Database & Authentication", initial: "AS" },
              { name: "Manthan chavda", role: "Full Backend & Security", initial: "MC" },
              { name: "Shivansh Dalvadi", role: "Frontend Developer", initial: "SD" },
            ].map((member, i) => (
              <div key={i} className="flex items-center gap-4 bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {member.initial}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-blue-600 py-12 px-6 text-white text-center">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "500+", label: "Job Listings" },
            { value: "1,200+", label: "Students Registered" },
            { value: "85%", label: "Match Accuracy" },
            { value: "24h", label: "Support Response" },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-extrabold">{stat.value}</div>
              <div className="text-blue-200 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Frequently Asked Questions</h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
          <p className="text-gray-500 mt-4 text-sm">Everything you need to know about AI Job Matcher.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Contact Us</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
            <p className="text-gray-500 mt-4 text-sm">Have a question or feedback? We'd love to hear from you.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* INFO */}
            <div className="space-y-6">
              {[
                { icon: "📧", label: "Email", value: "support@aijobmatcher.com" },
                { icon: "📍", label: "Location", value: "Ahmedabad, Gujarat, India" },
                { icon: "🕐", label: "Support Hours", value: "Mon–Fri, 9am – 6pm IST" },
                { icon: "🎓", label: "Project Type", value: "Student Graduate Project (SGP)" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-gray-700 font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* FORM */}
            <div>
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="font-bold text-green-700 text-lg mb-2">Message Sent!</h3>
                  <p className="text-green-600 text-sm">
                    Thanks for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-sm text-blue-600 underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Your Name</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us how we can help..."
                      className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
                  >
                    📨 Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
        <p>© 2025 AI Job Matcher · Built with ❤️ as a Student Graduate Project</p>
      </footer>
    </div>
  );
}
