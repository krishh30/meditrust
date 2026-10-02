
import { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icons';
import { HospitalSkyline } from '../components/HospitalSkyline';
import { TrustBadge } from '../components/TrustBadge';
import { patientTestimonials } from '../data/healthcareData';
import { hospitalService } from '../services/hospitalService';
import { doctorService } from '../services/doctorService';
import { apiError } from '../services/api';
import { TRUST_WEIGHTS, TRUST_FACTOR_LABELS } from '../utils/trustEngine';

const POPULAR_SEARCHES = [
  'Cardiology',
  'Cancer Care',
  'Diabetes',
  'Pediatrics',
  'Orthopedics',
  'Emergency',
];

const HERO_STATS = [
  { icon: 'activity', value: '24/7', label: 'Emergency hospital finder' },
  { icon: 'shield', value: '6-factor', label: 'Explainable Trust Score' },
  { icon: 'map-pin', value: 'Live', label: 'Maps-powered search' },
  { icon: 'lock', value: '₹0', label: 'Pay-to-rank fees' },
];

const HOW_IT_WORKS = [
  {
    icon: 'search',
    title: 'Search your need',
    text: 'Type a hospital, specialty or disease — or tap Near Me to see what is around you.',
  },
  {
    icon: 'shield',
    title: 'Compare with trust',
    text: 'See distance, ratings and a transparent Trust Score before you decide.',
  },
  {
    icon: 'navigation',
    title: 'Go with confidence',
    text: 'Get directions, book a visit and find an affordable stay near the hospital.',
  },
];

const TRANSLATION_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'mr', label: 'Marathi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'pa', label: 'Punjabi' },
];

function useRevealOnScroll() {
  const rootRef = useRef(null);

  useEffect(() => {
    const els = rootRef.current?.querySelectorAll('.reveal') || [];

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return rootRef;
}

export function HomePage({
  onNavigate,
  onSelectHospital,
  onSearchHospitals,
}) {
  const revealRef = useRevealOnScroll();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Near me');
  const [isLocating, setIsLocating] = useState(false);

  const [hospitalsData, setHospitalsData] = useState([]);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loadError, setLoadError] = useState('');

  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  // Translation state
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState('');

  const recognitionRef = useRef(null);

  useEffect(() => {
    Promise.all([
      hospitalService.list({ limit: 6 }),
      doctorService.list({ limit: 6 }),
    ])
      .then(([h, d]) => {
        setHospitalsData(h.items);
        setFeaturedDoctors(d.items);
      })
      .catch((e) => setLoadError(apiError(e)));
  }, []);

  /*
   * VOICE TO TEXT
   * Uses the browser's Web Speech API.
   */
  const handleVoiceSearch = () => {
    setVoiceError('');

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        'Voice search is not supported in this browser. Please use Google Chrome.'
      );
      return;
    }

    // Stop current recognition
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;

    // Match selected language with speech recognition
    const speechLanguages = {
      en: 'en-IN',
      hi: 'hi-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
    };

    recognition.lang = speechLanguages[selectedLanguage] || 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }

      if (transcript.trim()) {
        setSearchQuery(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Voice search error:', event.error);

      if (event.error === 'not-allowed') {
        setVoiceError(
          'Microphone permission was denied. Please allow microphone access.'
        );
      } else if (event.error === 'no-speech') {
        setVoiceError('No speech detected. Please try again.');
      } else {
        setVoiceError('Voice search could not start. Please try again.');
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  /*
   * GOOGLE TRANSLATION
   *
   * This uses Google's translation endpoint for the search phrase.
   * For a production deployment, this can later be moved to FastAPI
   * using Google Cloud Translation API.
   */
  const translateSearchText = async (text, targetLanguage) => {
    const trimmedText = text.trim();

    if (!trimmedText || targetLanguage === 'en') {
      return trimmedText;
    }

    const url =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=gtx` +
      `&sl=auto` +
      `&tl=${encodeURIComponent(targetLanguage)}` +
      `&dt=t` +
      `&q=${encodeURIComponent(trimmedText)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Translation request failed.');
    }

    const data = await response.json();

    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      throw new Error('Invalid translation response.');
    }

    return data[0]
      .map((part) => part?.[0] || '')
      .join('')
      .trim();
  };

  /*
   * Translate the current search text.
   *
   * Example:
   * Hindi "दिल का अस्पताल"
   * -> English "heart hospital"
   */
  const handleTranslateSearch = async () => {
    const text = searchQuery.trim();

    if (!text) {
      setTranslationError('Please enter something to translate first.');
      return;
    }

    setTranslationError('');
    setIsTranslating(true);

    try {
      const translatedText = await translateSearchText(
        text,
        selectedLanguage
      );

      setSearchQuery(translatedText);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError(
        'Translation failed. Please check your internet connection and try again.'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  /*
   * Search
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      return;
    }

    if (onSearchHospitals) {
      onSearchHospitals(query, selectedLocation);
    } else {
      onNavigate('results', {
        query,
        location: selectedLocation,
      });
    }
  };

  const handleQuickSearch = (term) => {
    setSearchQuery(term);

    if (onSearchHospitals) {
      onSearchHospitals(term, selectedLocation);
    } else {
      onNavigate('results', {
        query: term,
        location: selectedLocation,
      });
    }
  };

  /*
   * GPS Location
   */
  const handleUseLocation = () => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      setSelectedLocation('Manual Location');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          await hospitalService.nearby(
            p.coords.latitude,
            p.coords.longitude,
            5
          );

          setSelectedLocation('Current GPS Location (Within 5 km)');
        } catch {
          setSelectedLocation('Current GPS Location');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setSelectedLocation('Location permission denied');
        setIsLocating(false);
      }
    );
  };

  /*
   * Cleanup voice recognition when page unmounts.
   */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore cleanup errors.
        }
      }
    };
  }, []);

  return (
    <div className="homepage-container" ref={revealRef}>
      {loadError && (
        <div
          className="auth-error-note"
          style={{ margin: '16px auto', maxWidth: '1100px' }}
        >
          {loadError}
        </div>
      )}

      {/* 1. Hero / Hospital Discovery Search Area */}
      <section className="home-hero-section">
        <HospitalSkyline
          tone="light"
          className="hero-skyline-backdrop"
        />

        <div className="container">
          <div className="home-hero-content">
            <div className="hero-pill">
              <span className="pill-dot"></span>
              <span className="pill-text">
                Hospital Discovery & Emergency Network
              </span>
            </div>

            <h1 className="home-hero-title">
              Find the <span className="highlight-text">Right Hospital</span>{' '}
              for Your Healthcare Needs.
            </h1>

            <p className="home-hero-description">
              Compare accredited hospitals, verify live emergency room wait
              times, explore certified departments, and get direct navigation
              to trusted medical centers near you.
            </p>

            {/* Main Search Box */}
            <form
              onSubmit={handleSearchSubmit}
              className="hospital-search-bar"
            >
              <div className="search-input-wrapper">
                <Icon name="search" size={20} color="#4f46e5" />

                <input
                  type="text"
                  placeholder="Search hospitals, treatments or specialties (e.g. Cardiology, MetroHealth, Emergency)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setTranslationError('');
                    setVoiceError('');
                  }}
                  aria-label="Search hospitals, treatments or locations"
                />

                {/* Voice Search */}
                <button
                  type="button"
                  className="voice-search-btn"
                  onClick={handleVoiceSearch}
                  title={
                    isListening
                      ? 'Stop listening'
                      : 'Search by voice'
                  }
                  aria-label={
                    isListening
                      ? 'Stop listening'
                      : 'Search by voice'
                  }
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    color: isListening ? '#dc2626' : '#4f46e5',
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    name="mic"
                    size={20}
                    color={isListening ? '#dc2626' : '#4f46e5'}
                  />
                </button>
              </div>

              {/* Translation Controls */}
              <div
                className="translation-search-controls"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  borderTop: '1px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb',
                  background: '#fafafa',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Translate
                </span>

                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    setTranslationError('');
                  }}
                  aria-label="Select translation language"
                  style={{
                    border: '1px solid #dbe3ef',
                    borderRadius: '6px',
                    padding: '5px 8px',
                    background: '#fff',
                    color: '#334155',
                    fontSize: '12px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {TRANSLATION_LANGUAGES.map((language) => (
                    <option
                      key={language.code}
                      value={language.code}
                    >
                      {language.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleTranslateSearch}
                  disabled={isTranslating || !searchQuery.trim()}
                  title="Translate search text"
                  style={{
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    background:
                      isTranslating || !searchQuery.trim()
                        ? '#cbd5e1'
                        : '#4f46e5',
                    color: '#fff',
                    cursor:
                      isTranslating || !searchQuery.trim()
                        ? 'not-allowed'
                        : 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isTranslating ? 'Translating…' : 'Translate'}
                </button>
              </div>

              {/* Voice / Translation messages */}
              {(voiceError || translationError) && (
                <div
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    color: '#dc2626',
                    background: '#fff7f7',
                  }}
                >
                  {voiceError || translationError}
                </div>
              )}

              {isListening && (
                <div
                  style={{
                    padding: '5px 10px',
                    fontSize: '12px',
                    color: '#dc2626',
                    background: '#fff7f7',
                  }}
                >
                  🎙️ Listening… speak your hospital, disease, or treatment.
                </div>
              )}

              <div className="location-input-wrapper">
                <Icon
                  name="map-pin"
                  size={18}
                  color="#0d9488"
                />

                <span className="location-text">
                  {selectedLocation}
                </span>

                <button
                  type="button"
                  className="location-detect-btn"
                  onClick={handleUseLocation}
                  title="Detect GPS Location"
                >
                  <Icon name="crosshair" size={16} />
                  <span>
                    {isLocating ? 'Detecting…' : 'Near Me'}
                  </span>
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-search-cta"
              >
                <Icon name="search" size={18} />
                <span>Search Hospitals</span>
              </button>
            </form>

            {/* Popular one-tap searches */}
            <div className="popular-searches">
              <span className="popular-searches-label">
                Popular:
              </span>

              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="popular-chip"
                  onClick={() => handleQuickSearch(term)}
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Quick Helper Banner */}
            <div className="quick-problem-prompt">
              <span>
                Have specific symptoms or medical condition?
              </span>

              <button
                type="button"
                className="problem-link-btn"
                onClick={() => onNavigate('health-problem')}
              >
                <span>Search by Disease or Treatment</span>
                <Icon name="arrow-right" size={15} />
              </button>
            </div>

            <div className="hero-stats">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="hero-stat">
                  <span className="hero-stat-icon">
                    <Icon name={stat.icon} size={18} />
                  </span>

                  <div>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured / Nearby Hospitals List */}
      <section className="home-hospitals-section reveal">
        <div className="container">
          <div className="section-header-split">
            <div>
              <div className="section-pill">
                <Icon name="building" size={14} />
                <span>Verified Facilities</span>
              </div>

              <h2 className="section-title">
                Top Rated Hospitals Near You
              </h2>

              <p className="section-subtitle">
                Accredited medical centers with certified specialty
                departments, 24/7 trauma care, and verified patient
                reviews.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onNavigate('results')}
            >
              <span>Explore All on Map</span>
              <Icon name="navigation" size={16} />
            </button>
          </div>

          <div className="home-hospitals-grid">
            {hospitalsData.slice(0, 4).map((hosp) => (
              <div
                key={hosp.id}
                className="home-hospital-card"
              >
                <div className="hospital-card-header">
                  <div>
                    <span className="hospital-type-badge">
                      {hosp.type}
                    </span>

                    <h3 className="hospital-name">
                      {hosp.name}
                    </h3>

                    <p className="hospital-location">
                      <Icon
                        name="map-pin"
                        size={14}
                        color="#64748b"
                      />
                      <span>{hosp.address}</span>
                    </p>
                  </div>
                </div>

                <div className="hospital-meta-strip">
                  <div className="meta-badge distance">
                    <Icon name="navigation" size={13} />
                    <span>{hosp.distanceText}</span>
                  </div>

                  <div className="meta-badge rating">
                    <Icon
                      name="star"
                      size={13}
                      color="#f59e0b"
                    />
                    <strong>{hosp.rating}</strong>
                    <span>({hosp.reviewsCount})</span>
                  </div>

                  <div
                    className={`meta-badge status ${
                      hosp.is24x7Emergency
                        ? 'open'
                        : 'hours'
                    }`}
                  >
                    <span className="status-dot"></span>

                    <span>
                      {hosp.is24x7Emergency
                        ? '24/7 ER Open'
                        : 'Open Day Care'}
                    </span>
                  </div>

                  <TrustBadge
                    hospital={hosp}
                    size="sm"
                  />
                </div>

                <div className="hospital-specialties-preview">
                  {hosp.specialties
                    .slice(0, 3)
                    .map((spec, i) => (
                      <span
                        key={i}
                        className="spec-chip"
                      >
                        {spec}
                      </span>
                    ))}

                  {hosp.specialties.length > 3 && (
                    <span className="spec-more">
                      +{hosp.specialties.length - 3} more
                    </span>
                  )}
                </div>

                <div className="hospital-card-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() =>
                      onNavigate('results', {
                        selectedId: hosp.id,
                      })
                    }
                  >
                    <Icon
                      name="navigation"
                      size={14}
                    />
                    <span>Get Directions</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      onSelectHospital(hosp.id)
                    }
                  >
                    <span>View Details</span>
                    <Icon
                      name="arrow-right"
                      size={14}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="all-hospitals-banner">
            <div className="banner-content">
              <h4>
                Need to filter by emergency trauma,
                pediatrics, or diagnostic MRI?
              </h4>

              <p>
                Filter all medical facilities with live
                interactive distance routing on our hospital
                map.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-accent"
              onClick={() => onNavigate('results')}
            >
              <span>
                Open Interactive Hospital Map
              </span>

              <Icon
                name="navigation"
                size={16}
              />
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works-section reveal">
        <div className="container">
          <div className="section-header center">
            <div className="section-pill">
              <Icon name="sparkles" size={14} />
              <span>How MediTrust Works</span>
            </div>

            <h2 className="section-title">
              From symptom to the right hospital in 3 steps
            </h2>

            <p className="section-subtitle">
              No guesswork, no paid rankings — just the
              information you need to choose care with
              confidence.
            </p>
          </div>

          <div className="how-steps">
            {HOW_IT_WORKS.map((step, idx) => (
              <div
                key={step.title}
                className="how-step"
              >
                <span className="how-step-number">
                  {idx + 1}
                </span>

                <div className="how-step-icon">
                  <Icon
                    name={step.icon}
                    size={24}
                  />
                </div>

                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MediTrust Trust Engine */}
      <section className="trust-engine-section reveal">
        <div className="container">
          <div className="trust-engine-grid">
            <div className="trust-engine-intro">
              <div className="section-pill trust-panel-pill">
                <Icon
                  name="shield"
                  size={14}
                />

                <span>
                  The MediTrust Trust Engine
                </span>
              </div>

              <h2 className="section-title">
                Not just a star rating. A trust score you
                can see through.
              </h2>

              <p className="section-subtitle">
                Every hospital on MediTrust carries a live
                Trust Score built from six verified signals —
                never from payment. Hospitals cannot buy a
                higher score or push down honest feedback.
              </p>

              <ul className="trust-engine-factor-list">
                {Object.entries(TRUST_WEIGHTS).map(
                  ([key, weight]) => (
                    <li key={key}>
                      <span className="trust-engine-factor-weight">
                        {Math.round(weight * 100)}%
                      </span>

                      <span>
                        {TRUST_FACTOR_LABELS[key]}
                      </span>
                    </li>
                  )
                )}
              </ul>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() =>
                  onNavigate('health-problem')
                }
              >
                <span>
                  See Trust Scores in Action
                </span>

                <Icon
                  name="arrow-right"
                  size={16}
                />
              </button>
            </div>

            <div className="trust-engine-showcase">
              {hospitalsData
                .slice(0, 2)
                .map((hosp) => (
                  <div
                    key={hosp.id}
                    className="trust-showcase-card"
                  >
                    <div className="trust-showcase-top">
                      <div>
                        <span className="suitable-hosp-type">
                          {hosp.type}
                        </span>

                        <h4>{hosp.name}</h4>
                      </div>

                      <TrustBadge
                        hospital={hosp}
                      />
                    </div>

                    {hosp.qualityAccreditation && (
                      <span className="quality-signal-pill sm">
                        <Icon
                          name="award"
                          size={12}
                        />

                        <span>
                          External Quality Signal:{' '}
                          {hosp.qualityAccreditation}
                        </span>
                      </span>
                    )}
                  </div>
                ))}

              <p className="trust-showcase-caption">
                <Icon
                  name="lock"
                  size={13}
                />

                <span>
                  No Pay-to-Rank: organic Trust Scores are
                  never sold.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Verified Doctors */}
      <section className="home-doctors-section reveal">
        <div className="container">
          <div className="section-header-split">
            <div>
              <div className="section-pill">
                <Icon
                  name="stethoscope"
                  size={14}
                />

                <span>
                  MediTrust Verified Doctors
                </span>
              </div>

              <h2 className="section-title">
                Meet Our Verified Doctors
              </h2>

              <p className="section-subtitle">
                Board-certified physicians available for
                secure video consultation — each one MediTrust
                Verified, with real reviews from patients who
                completed a visit.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                onNavigate('consultation')
              }
            >
              <span>View All Doctors</span>

              <Icon
                name="arrow-right"
                size={16}
              />
            </button>
          </div>

          <div className="home-doctors-grid">
            {featuredDoctors.map((doc) => (
              <button
                key={doc.id}
                type="button"
                className="home-doctor-card"
                onClick={() =>
                  onNavigate('doctor-details', {
                    doctorId: doc.id,
                  })
                }
              >
                <div
                  className="doc-avatar-large"
                  style={{
                    backgroundColor: doc.avatarBg,
                  }}
                >
                  {doc.initials}
                </div>

                <h4 className="doc-name">
                  {doc.name}
                </h4>

                <span className="doc-specialty">
                  {doc.specialty}
                </span>

                {doc.verified && (
                  <span className="doc-verified-tag">
                    <Icon
                      name="badge-check"
                      size={13}
                      color="#0d9488"
                    />

                    <span>
                      MediTrust Verified
                    </span>
                  </span>
                )}

                <div className="home-doctor-rating">
                  <Icon
                    name="star"
                    size={13}
                    color="#f59e0b"
                  />

                  <strong>{doc.rating}</strong>

                  <span>
                    ({doc.reviewsCount} reviews)
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Patient Reviews */}
      <section className="home-reviews-section reveal">
        <div className="container">
          <div className="section-header center">
            <div className="section-pill">
              <Icon
                name="star"
                size={14}
              />

              <span>
                Verified Patient Feedback
              </span>
            </div>

            <h2 className="section-title">
              What Patients Say About MediTrust
            </h2>

            <p className="section-subtitle">
              Authentic reviews from families who found
              emergency care, specialist clinics, and
              diagnostics through MediTrust.
            </p>
          </div>

          <div className="home-reviews-grid">
            {patientTestimonials.map((t, idx) => (
              <div
                key={idx}
                className="home-review-card"
              >
                <div className="review-top-row">
                  <div className="review-stars">
                    {[...Array(t.rating)].map(
                      (_, i) => (
                        <Icon
                          key={i}
                          name="star"
                          size={15}
                        />
                      )
                    )}
                  </div>

                  {t.date && (
                    <span className="review-date">
                      {t.date}
                    </span>
                  )}
                </div>

                <p className="review-body">
                  “{t.quote}”
                </p>

                <div className="review-author-row">
                  <div className="author-avatar">
                    {t.author.charAt(0)}
                  </div>

                  <div>
                    <strong className="author-name">
                      {t.author}
                    </strong>

                    <span className="author-role">
                      {t.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

