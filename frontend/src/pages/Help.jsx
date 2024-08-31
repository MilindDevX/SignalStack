import { useState } from 'react'
import {
  HelpCircle,
  Book,
  ChevronDown,
  ChevronRight,
  Search,
  Users,
  Shield,
  Bell,
  BarChart3,
  Hash,
  MessageCircle,
  Lightbulb,
  ExternalLink
} from 'lucide-react'

const faqCategories = [
  {
    name: 'Getting Started',
    icon: Lightbulb,
    color: 'amber',
    faqs: [
      {
        question: 'How do I create a new team?',
        answer: 'Any authenticated user can create a new team! Go to the Teams page from the sidebar and click "New Team". Enter your team name and description, then click Create. You will automatically become the Admin for that team.'
      },
      {
        question: 'How do I switch between teams?',
        answer: 'Click on the team selector at the top-left of the sidebar to see all your teams. Click on any team to switch to it. The sidebar will update to show channels from the selected team.'
      },
    ]
  },
  {
    name: 'Team Management',
    icon: Users,
    color: 'blue',
    faqs: [
      {
        question: 'How can I invite members to my team?',
        answer: 'As a team admin, go to Team Analytics and click the "Team Settings" tab. Share the invite code with your team members, or manage pending join requests from there.'
      },
      {
        question: 'How do I join a team using an invite code?',
        answer: 'Click "Join Team" on the Teams page and enter the invite code shared with you. You can preview the team details before joining. Once you click Join, you will be added to the team as a member.'
      },
      {
        question: 'How do I manage my team?',
        answer: 'Go to Team Analytics and click the "Team Settings" tab (visible only to admins). From there you can: view/regenerate the invite code, approve pending join requests, manage members, and access danger zone options.'
      },
    ]
  },
  {
    name: 'Roles & Permissions',
    icon: Shield,
    color: 'green',
    faqs: [
      {
        question: 'What is the difference between an Admin and a Member?',
        answer: 'Admins (Team Leads) have access to analytics dashboards, can manage the team, create channels, invite members, approve join requests, and view detailed insights. Members can participate in channels, send messages, and view their own activity. Note: Roles are team-scoped - you can be an Admin in one team and a Member in another!'
      },
      {
        question: 'How do I promote someone to Admin?',
        answer: 'Only existing Admins can promote members. Go to Team Analytics > Team Settings > Members section, and click the shield icon next to any member to promote them to Admin.'
      },
    ]
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    color: 'purple',
    faqs: [
      {
        question: 'How do I view team analytics?',
        answer: 'Team Admins can access the Analytics section from the sidebar when they have a team selected. This includes Dashboard, Team Insights, Channel Stats, User Activity, and Decisions pages showing metrics like total messages, active users, top contributors, and more.'
      },
    ]
  },
  {
    name: 'Channels & Messages',
    icon: Hash,
    color: 'indigo',
    faqs: [
      {
        question: 'How do I create channels?',
        answer: 'As an admin, expand your team on the Teams page and go to the "Channels" tab. Click "+ Add Channel" to create a new channel. Enter the channel name and optional description.'
      },
    ]
  },
  {
    name: 'Notifications',
    icon: Bell,
    color: 'rose',
    faqs: [
      {
        question: 'How do notifications work?',
        answer: 'You will receive notifications when someone invites you to a team, when your join request is approved or rejected, or when you are promoted to admin. Click the bell icon in the header to view your notifications.'
      },
    ]
  },
]

const colorClasses = {
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
}

function Help() {
  const [openFaq, setOpenFaq] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Flatten all FAQs with category info for searching
  const allFaqs = faqCategories.flatMap(cat =>
    cat.faqs.map(faq => ({ ...faq, category: cat.name, color: cat.color }))
  )

  const filteredFaqs = allFaqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const displayFaqs = selectedCategory
    ? faqCategories.find(c => c.name === selectedCategory)?.faqs.map(faq => ({
        ...faq,
        category: selectedCategory,
        color: faqCategories.find(c => c.name === selectedCategory)?.color
      })) || []
    : searchQuery ? filteredFaqs : allFaqs

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <HelpCircle size={24} />
            </div>
            <h1 className="text-3xl font-bold">Help Center</h1>
          </div>
          <p className="text-indigo-200 mt-2 max-w-lg">Find answers to common questions and learn how to get the most out of SignalStack.</p>

          {/* Search in header */}
          <div className="relative mt-6">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" />
            <input
              type="text"
              placeholder="Search for help topics..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value) setSelectedCategory(null)
              }}
              className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-white/30 focus:border-white/30 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !selectedCategory
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          All Topics
        </button>
        {faqCategories.map(cat => {
          const Icon = cat.icon
          return (
            <button
              key={cat.name}
              onClick={() => {
                setSelectedCategory(selectedCategory === cat.name ? null : cat.name)
                setSearchQuery('')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.name
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              <Icon size={16} />
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* Quick Tips Card */}
      {!searchQuery && !selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <Users size={20} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Create Your Team</h3>
            <p className="text-sm text-slate-600 mt-1">Start by creating a team and inviting your colleagues to collaborate.</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <MessageCircle size={20} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Start Conversations</h3>
            <p className="text-sm text-slate-600 mt-1">Create channels for different topics and keep discussions organized.</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
              <BarChart3 size={20} className="text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Track Progress</h3>
            <p className="text-sm text-slate-600 mt-1">Use analytics to understand team activity and communication patterns.</p>
          </div>
        </div>
      )}

      {/* FAQs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {selectedCategory || (searchQuery ? 'Search Results' : 'Frequently Asked Questions')}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {displayFaqs.length} {displayFaqs.length === 1 ? 'article' : 'articles'} found
            </p>
          </div>
          {(selectedCategory || searchQuery) && (
            <button
              onClick={() => { setSelectedCategory(null); setSearchQuery('') }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {displayFaqs.map((faq, idx) => {
            const colors = colorClasses[faq.color] || colorClasses.indigo
            return (
              <div key={idx} className="group">
                <button
                  className="flex items-center justify-between w-full p-5 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${colors.bg.replace('100', '500')}`} />
                    <span className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {faq.question}
                    </span>
                  </div>
                  <div className={`w-8 h-8 rounded-lg ${openFaq === idx ? 'bg-indigo-100' : 'bg-slate-100'} flex items-center justify-center transition-colors`}>
                    {openFaq === idx
                      ? <ChevronDown size={18} className="text-indigo-600" />
                      : <ChevronRight size={18} className="text-slate-400" />
                    }
                  </div>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-0">
                    <div className={`${colors.bg} border ${colors.border} p-4 rounded-xl`}>
                      <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {displayFaqs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <HelpCircle size={32} />
              </div>
              <p className="font-medium text-slate-600">No results found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Support CTA */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Still need help?</h3>
          <p className="text-slate-400 text-sm mt-1">Our support team is here to assist you.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-colors font-medium">
          Contact Support
          <ExternalLink size={16} />
        </button>
      </div>
    </div>
  )
}

export default Help
