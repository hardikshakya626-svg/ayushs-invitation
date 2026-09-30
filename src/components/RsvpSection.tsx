import React, { useState, useEffect } from 'react';
import {
  Heart,
  Check,
  Calendar,
  Clock,
  Sparkles,
  Users,
  MessageSquare,
  Share2,
  CalendarPlus,
  Edit3,
  Phone,
  User,
  Download,
  PartyPopper
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FloralDivider, CornerFloral } from './FloralMotifs';

interface RsvpData {
  id?: string;
  name: string;
  phone: string;
  attendance: 'attending' | 'declined';
  guestsCount: number;
  events: string[];
  message: string;
  submittedAt?: string;
}

const WEDDING_EVENTS = [
  {
    id: 'sangeet',
    name: 'Sangeet & Ring Ceremony',
    date: 'Saturday, 24th October 2026',
    time: '7:00 PM Onwards',
    tag: 'Day 1 • Evening Gala',
    tagBg: 'bg-[#5A2430] text-[#FCECD7]'
  },
  {
    id: 'haldi',
    name: 'Haldi Function',
    date: 'Sunday, 25th October 2026',
    time: '11:00 AM Onwards',
    tag: 'Day 2 • Morning Glow',
    tagBg: 'bg-[#C5A580] text-[#3B0E16]'
  },
  {
    id: 'wedding',
    name: 'Wedding Ceremony & Pheras',
    date: 'Sunday, 25th October 2026',
    time: '6:00 PM Sehrabandi • 7:30 PM Baraat • 10:00 PM Jaimala',
    tag: 'Day 2 • Royal Pheras',
    tagBg: 'bg-[#5A2430] text-[#FCECD7]'
  }
];

export function RsvpSection() {
  const [attendance, setAttendance] = useState<'attending' | 'declined'>('attending');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['sangeet', 'haldi', 'wedding']);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRsvp, setSubmittedRsvp] = useState<RsvpData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [rsvpTotalCount, setRsvpTotalCount] = useState<number | null>(null);

  // Load existing RSVP from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ayush_somya_rsvp');
      if (stored) {
        const parsed: RsvpData = JSON.parse(stored);
        setSubmittedRsvp(parsed);
        setName(parsed.name || '');
        setPhone(parsed.phone || '');
        setAttendance(parsed.attendance || 'attending');
        setGuestsCount(parsed.guestsCount || 1);
        setSelectedEvents(parsed.events || ['sangeet', 'haldi', 'wedding']);
        setMessage(parsed.message || '');
      }
    } catch (e) {
      console.warn('Could not read existing RSVP from localStorage', e);
    }

    // Fetch total RSVP count for organizers
    fetch('/api/rsvps')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.total === 'number') {
          setRsvpTotalCount(data.total);
        }
      })
      .catch(() => {});
  }, []);

  const triggerCelebrationConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#C5A580', '#5A2430', '#FCECD7', '#E8BAC0']
      });
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#D4AF37', '#FAF7F2', '#C5A580']
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#5A2430', '#D4AF37', '#FCECD7']
        });
      }, 250);
    } catch (e) {
      console.warn('Confetti error', e);
    }
  };

  const toggleEvent = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      if (selectedEvents.length > 1) {
        setSelectedEvents(selectedEvents.filter(id => id !== eventId));
      }
    } else {
      setSelectedEvents([...selectedEvents, eventId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    if (attendance === 'attending' && selectedEvents.length === 0) {
      setErrorMessage('Please select at least one event you will be attending');
      return;
    }

    setIsSubmitting(true);

    const eventNames = selectedEvents.map(
      id => WEDDING_EVENTS.find(ev => ev.id === id)?.name || id
    );

    const payload: RsvpData = {
      name: name.trim(),
      phone: phone.trim(),
      attendance,
      guestsCount: attendance === 'declined' ? 0 : guestsCount,
      events: attendance === 'declined' ? [] : eventNames,
      message: message.trim()
    };

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.rsvp && data.rsvp.submittedAt) {
            payload.submittedAt = data.rsvp.submittedAt;
          }
        }
      }
    } catch (err) {
      console.warn('Offline or server fallback', err);
    }

    if (!payload.submittedAt) {
      payload.submittedAt = new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    try {
      localStorage.setItem('ayush_somya_rsvp', JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }

    setIsSubmitting(false);
    setSubmittedRsvp(payload);
    setIsEditing(false);

    if (attendance === 'attending') {
      triggerCelebrationConfetti();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const generateGoogleCalendarUrl = () => {
    const title = encodeURIComponent('Ayush & Somya Wedding Celebration');
    const details = encodeURIComponent(
      'Wedding celebrations of Ayush Kathuria & Somya Sharma at The Mewar Palace and Resort, Shivpuri (M.P.)'
    );
    const location = encodeURIComponent('The Mewar Palace and Resort, Shivpuri, Madhya Pradesh');
    // Dates: 24 Oct 2026 13:30 UTC to 25 Oct 2026 19:30 UTC
    const dates = '20261024T133000Z/20261025T193000Z';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
  };

  const handleDownloadIcs = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ayush & Somya Wedding//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'SUMMARY:Ayush & Somya Wedding Celebration',
      'DESCRIPTION:Wedding celebrations of Ayush Kathuria & Somya Sharma at The Mewar Palace and Resort, Shivpuri.',
      'LOCATION:The Mewar Palace and Resort, Shivpuri, Madhya Pradesh',
      'DTSTART:20261024T190000',
      'DTEND:20261025T235900',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ayush_somya_wedding.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Delighted to celebrate the wedding of Ayush & Somya on 24th & 25th October 2026 at The Mewar Palace, Shivpuri! 🎉✨`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <section
      id="rsvp"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 800px' }}
      className="relative w-full py-16 sm:py-24 px-4 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#C5A580]/30 shadow-sm"
    >
      <div className="max-w-xl mx-auto space-y-8 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-2">
          <span className="font-cinzel text-xs uppercase tracking-[0.35em] text-[#C5A580] font-semibold block">
            ॥ ॐ श्री गणेशाय नमः ॥
          </span>
          <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#5A2430] font-semibold">
            Kindly Respond
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif-title font-medium text-[#5A2430]">
            RSVP &amp; Celebrations
          </h2>
          <p className="text-xs sm:text-sm text-[#5A2430]/75 font-serif italic max-w-md mx-auto">
            &ldquo;Your gracious presence and heartfelt blessings will complete our joy.&rdquo;
          </p>
          <FloralDivider className="w-48 h-8 text-[#C5A580] mx-auto mt-2" />
        </div>

        {/* Main Card */}
        <div className="relative bg-white/95 border border-[#C5A580]/40 rounded-3xl p-6 sm:p-10 text-left shadow-[0_15px_35px_rgba(0,0,0,0.08)]">
          <CornerFloral position="top-left" className="absolute top-2 left-2 w-12 sm:w-14 h-12 sm:h-14 text-[#C5A580]" />
          <CornerFloral position="top-right" className="absolute top-2 right-2 w-12 sm:w-14 h-12 sm:h-14 text-[#C5A580]" />
          <CornerFloral position="bottom-left" className="absolute bottom-2 left-2 w-12 sm:w-14 h-12 sm:h-14 text-[#C5A580]" />
          <CornerFloral position="bottom-right" className="absolute bottom-2 right-2 w-12 sm:w-14 h-12 sm:h-14 text-[#C5A580]" />

          {/* VIEW A: Submitted Confirmation State */}
          {submittedRsvp && !isEditing ? (
            <div className="relative z-10 space-y-6 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-[#FAF6F2] border-2 border-[#D4AF37] flex items-center justify-center mx-auto text-[#5A2430] shadow-[0_4px_20px_rgba(212,175,55,0.3)] animate-[tapFloat_3s_ease-in-out_infinite]">
                {submittedRsvp.attendance === 'attending' ? (
                  <Sparkles className="w-8 h-8 text-[#D4AF37]" />
                ) : (
                  <Heart className="w-8 h-8 text-[#5A2430]" />
                )}
              </div>

              <div className="space-y-1.5">
                <span className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#C5A580] font-bold">
                  {submittedRsvp.attendance === 'attending'
                    ? '✦ Attendance Confirmed ✦'
                    : '✦ Warm Wishes Received ✦'}
                </span>
                <h3 className="font-serif-title text-2xl sm:text-3xl text-[#5A2430] font-semibold">
                  Thank You, {submittedRsvp.name}!
                </h3>
                <p className="text-xs sm:text-sm text-[#4A1E27]/80 font-sans-clean max-w-md mx-auto leading-relaxed">
                  {submittedRsvp.attendance === 'attending'
                    ? 'The Kathuria & Sharma families are thrilled and look forward to welcoming you to Shivpuri!'
                    : 'Thank you for showering Ayush & Somya with your heartfelt love and blessings from afar.'}
                </p>
              </div>

              {/* Response Summary Details */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#C5A580]/35 text-left space-y-3 text-xs sm:text-sm text-[#4A1E27]">
                <div className="flex items-center justify-between border-b border-[#C5A580]/20 pb-2.5">
                  <span className="text-[#5A2430] font-semibold font-cinzel text-xs uppercase tracking-wider">
                    Status:
                  </span>
                  <span
                    className={`font-semibold font-sans-clean px-2.5 py-0.5 rounded-full text-xs ${
                      submittedRsvp.attendance === 'attending'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-stone-100 text-stone-700 border border-stone-300'
                    }`}
                  >
                    {submittedRsvp.attendance === 'attending' ? 'Attending' : 'Sending Wishes'}
                  </span>
                </div>

                {submittedRsvp.attendance === 'attending' && (
                  <>
                    <div className="flex items-center justify-between border-b border-[#C5A580]/20 pb-2.5">
                      <span className="text-[#5A2430] font-semibold font-cinzel text-xs uppercase tracking-wider">
                        Guests Attending:
                      </span>
                      <span className="font-bold text-[#5A2430] font-sans-clean">
                        {submittedRsvp.guestsCount} {submittedRsvp.guestsCount === 1 ? 'Guest' : 'Guests'}
                      </span>
                    </div>

                    <div className="border-b border-[#C5A580]/20 pb-2.5 space-y-1">
                      <span className="text-[#5A2430] font-semibold font-cinzel text-xs uppercase tracking-wider block">
                        Events:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {submittedRsvp.events.map((ev, idx) => (
                          <span
                            key={idx}
                            className="bg-white border border-[#C5A580]/40 text-[#5A2430] text-[11px] font-sans-clean font-medium px-2 py-0.5 rounded-md shadow-xs"
                          >
                            ✓ {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {submittedRsvp.message && (
                  <div className="pt-1">
                    <span className="text-[#5A2430] font-semibold font-cinzel text-xs uppercase tracking-wider block mb-1">
                      Your Message:
                    </span>
                    <p className="italic text-[#5A2430]/90 bg-white p-2.5 rounded-xl border border-[#C5A580]/30 font-serif">
                      &ldquo;{submittedRsvp.message}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons: Add to Calendar, Share, Edit */}
              <div className="space-y-2.5 pt-2">
                {submittedRsvp.attendance === 'attending' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={generateGoogleCalendarUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-[#5A2430] hover:bg-[#4A1E27] text-white text-xs font-sans-clean font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <CalendarPlus className="w-4 h-4 text-[#FCECD7]" />
                      <span>Add to Google Calendar</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleDownloadIcs}
                      className="px-4 py-2.5 rounded-xl border border-[#C5A580]/40 hover:bg-[#FAF6F2] text-xs font-sans-clean font-semibold text-[#5A2430] flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#C5A580]" />
                      <span>Download .ics Invite</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-sans-clean font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEdit}
                    className="px-4 py-2.5 rounded-xl border border-[#C5A580]/40 hover:bg-[#FAF6F2] text-xs font-sans-clean font-semibold text-[#5A2430] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit RSVP</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW B: Active Interactive RSVP Form */
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              {/* Attendance Choice Tabs */}
              <div className="space-y-2">
                <label className="block text-xs font-cinzel uppercase tracking-[0.2em] text-[#5A2430] font-bold">
                  Will You Join Us?
                </label>
                <div className="grid grid-cols-2 gap-2.5 p-1 rounded-2xl bg-[#FAF7F2] border border-[#C5A580]/35">
                  <button
                    type="button"
                    onClick={() => setAttendance('attending')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-cinzel font-semibold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                      attendance === 'attending'
                        ? 'bg-[#5A2430] text-white shadow-md'
                        : 'text-[#4A1E27]/70 hover:text-[#5A2430] hover:bg-white/50'
                    }`}
                  >
                    <Check
                      className={`w-4 h-4 ${
                        attendance === 'attending' ? 'text-[#FCECD7]' : 'opacity-0'
                      }`}
                    />
                    <span>Joyfully Accept</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttendance('declined')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-cinzel font-semibold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                      attendance === 'declined'
                        ? 'bg-[#5A2430] text-white shadow-md'
                        : 'text-[#4A1E27]/70 hover:text-[#5A2430] hover:bg-white/50'
                    }`}
                  >
                    <Check
                      className={`w-4 h-4 ${
                        attendance === 'declined' ? 'text-[#FCECD7]' : 'opacity-0'
                      }`}
                    />
                    <span>Regretfully Decline</span>
                  </button>
                </div>
              </div>

              {/* Guest Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="rsvp-name"
                    className="block text-xs font-cinzel uppercase tracking-wider text-[#5A2430] font-semibold"
                  >
                    Full Name <span className="text-[#C5A580]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#C5A580]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="rsvp-name"
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Rahul & Neha Sharma"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#C5A580]/40 bg-[#FAF7F2]/50 text-sm font-sans-clean text-[#4A1E27] placeholder-[#4A1E27]/40 focus:outline-none focus:ring-2 focus:ring-[#C5A580] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Phone / WhatsApp */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="rsvp-phone"
                    className="block text-xs font-cinzel uppercase tracking-wider text-[#5A2430] font-semibold"
                  >
                    Phone / WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#C5A580]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="rsvp-phone"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#C5A580]/40 bg-[#FAF7F2]/50 text-sm font-sans-clean text-[#4A1E27] placeholder-[#4A1E27]/40 focus:outline-none focus:ring-2 focus:ring-[#C5A580] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Fields only visible if Attending */}
              {attendance === 'attending' && (
                <>
                  {/* Guest Count Stepper */}
                  <div className="space-y-2">
                    <label className="block text-xs font-cinzel uppercase tracking-wider text-[#5A2430] font-semibold">
                      Number of Attending Guests
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setGuestsCount(num)}
                          className={`w-10 h-10 rounded-xl font-cinzel text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                            guestsCount === num
                              ? 'bg-[#5A2430] text-[#FCECD7] border border-[#D4AF37] shadow-sm'
                              : 'bg-[#FAF7F2] text-[#5A2430] border border-[#C5A580]/30 hover:border-[#C5A580]'
                          }`}
                        >
                          {num === 5 ? '5+' : num}
                        </button>
                      ))}

                      {/* Manual Stepper */}
                      <div className="flex items-center border border-[#C5A580]/40 rounded-xl bg-[#FAF7F2] overflow-hidden ml-auto">
                        <button
                          type="button"
                          onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                          className="px-3 py-2 text-[#5A2430] hover:bg-white text-sm font-bold transition-colors cursor-pointer"
                        >
                          −
                        </button>
                        <span className="px-3 text-xs font-cinzel font-bold text-[#5A2430] min-w-8 text-center">
                          {guestsCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setGuestsCount(guestsCount + 1)}
                          className="px-3 py-2 text-[#5A2430] hover:bg-white text-sm font-bold transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Select Events */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-cinzel uppercase tracking-wider text-[#5A2430] font-semibold">
                        Select Events You Will Attend
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedEvents(
                            selectedEvents.length === WEDDING_EVENTS.length
                              ? ['wedding']
                              : WEDDING_EVENTS.map(ev => ev.id)
                          )
                        }
                        className="text-[11px] font-sans-clean font-medium text-[#C5A580] hover:text-[#5A2430] transition-colors cursor-pointer"
                      >
                        {selectedEvents.length === WEDDING_EVENTS.length
                          ? 'Deselect optional'
                          : 'Select all'}
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {WEDDING_EVENTS.map(ev => {
                        const isChecked = selectedEvents.includes(ev.id);
                        return (
                          <div
                            key={ev.id}
                            onClick={() => toggleEvent(ev.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isChecked
                                ? 'bg-gradient-to-r from-[#FAF7F2] to-white border-[#C5A580] shadow-sm'
                                : 'bg-white/60 border-stone-200 opacity-60 hover:opacity-90'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-cinzel font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs ${ev.tagBg}`}
                                >
                                  {ev.tag}
                                </span>
                              </div>
                              <h4 className="font-serif-title text-base sm:text-lg font-bold text-[#5A2430]">
                                {ev.name}
                              </h4>
                              <p className="text-xs text-[#4A1E27]/75 font-sans-clean">
                                {ev.date} • {ev.time}
                              </p>
                            </div>

                            <div
                              className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                isChecked
                                  ? 'bg-[#5A2430] border-[#D4AF37] text-[#FCECD7]'
                                  : 'border-[#C5A580]/50 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Warm Wishes & Blessings Note */}
              <div className="space-y-1.5">
                <label
                  htmlFor="rsvp-message"
                  className="block text-xs font-cinzel uppercase tracking-wider text-[#5A2430] font-semibold"
                >
                  Warm Wishes &amp; Blessings
                </label>
                <div className="relative">
                  <textarea
                    id="rsvp-message"
                    rows={3}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Write a warm note or blessing for Ayush &amp; Somya..."
                    className="w-full p-3 rounded-xl border border-[#C5A580]/40 bg-[#FAF7F2]/50 text-sm font-sans-clean text-[#4A1E27] placeholder-[#4A1E27]/40 focus:outline-none focus:ring-2 focus:ring-[#C5A580] focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-sans-clean font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#5A2430] via-[#4A1E27] to-[#5A2430] hover:from-[#4A1E27] hover:to-[#3B0E16] text-[#FCECD7] text-xs sm:text-sm font-cinzel font-bold tracking-[0.25em] uppercase shadow-[0_10px_25px_rgba(90,36,48,0.25)] hover:shadow-[0_14px_30px_rgba(90,36,48,0.35)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#FCECD7]/30 border-t-[#FCECD7] rounded-full animate-spin" />
                    <span>Recording Response...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>
                      {attendance === 'attending'
                        ? 'Confirm RSVP & Attendance'
                        : 'Send Blessings & Regrets'}
                    </span>
                  </>
                )}
              </button>

              {/* Couple's note */}
              <p className="text-[11px] text-center text-[#4A1E27]/60 font-sans-clean pt-1">
                Kindly respond on or before 15th October 2026.
              </p>
            </form>
          )}
        </div>

        {/* Organizer / Download RSVPs Bar */}
        <div className="flex items-center justify-between px-2 text-[11px] text-[#5A2430]/70 font-sans-clean">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#C5A580]" />
            <span>
              {rsvpTotalCount !== null && rsvpTotalCount > 0
                ? `${rsvpTotalCount} ${rsvpTotalCount === 1 ? 'Guest' : 'Guests'} responded so far`
                : 'Celebrations with Loved Ones'}
            </span>
          </div>

          <a
            href="/api/rsvps/export"
            download="ayush_somya_wedding_rsvps.csv"
            className="hover:text-[#5A2430] hover:underline flex items-center gap-1 font-medium transition-colors"
          >
            <Download className="w-3 h-3 text-[#C5A580]" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>
    </section>
  );
}
