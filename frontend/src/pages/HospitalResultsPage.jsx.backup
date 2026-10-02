
import { useState, useMemo, useEffect } from 'react';
import { Icon } from '../components/Icons';
import { HospitalMap } from '../components/HospitalMap';
import { TrustBadge } from '../components/TrustBadge';
import { MatchScoreBadge } from '../components/MatchScoreBadge';
import { hospitalService } from '../services/hospitalService';
import { doctorService } from '../services/doctorService';
import { apiError } from '../services/api';
import {
  computeMatchScore,
  hasVerifiedDoctorAt,
} from '../utils/trustEngine';


// =====================================================
// DISTANCE CALCULATOR
// =====================================================

function calculateDistanceKm(
  lat1,
  lon1,
  lat2,
  lon2
) {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null
  ) {
    return null;
  }

  const toRadians = (value) =>
    (value * Math.PI) / 180;

  const R = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}


// =====================================================
// GOOGLE HOSPITAL NORMALIZER
// =====================================================

function normalizeGoogleHospital(
  hospital,
  userLocation
) {
  const latitude = hospital.latitude;
  const longitude = hospital.longitude;

  const distance = calculateDistanceKm(
    userLocation.latitude,
    userLocation.longitude,
    latitude,
    longitude
  );

  return {
    id: hospital.id,

    name: hospital.name || 'Hospital',

    address:
      hospital.address ||
      'Address unavailable',

    latitude,
    longitude,

    coordinates:
      latitude != null &&
      longitude != null
        ? {
            lat: latitude,
            lng: longitude,
          }
        : null,

    rating:
      hospital.rating != null
        ? hospital.rating
        : 0,

    reviewsCount:
      hospital.reviews_count || 0,

    distance,

    distanceText:
      distance != null
        ? `${distance.toFixed(1)} km away`
        : 'Distance unavailable',

    googleMapsUrl:
      hospital.google_maps_url || null,

    source: 'google',

    type: 'Hospital',

    tagline: 'Live result from Google Maps',

    city: null,

    phone: null,

    website: null,

    overview:
      'This hospital is shown from live Google Maps data and is not yet ' +
      'MediTrust-verified. Facility details, departments and hours are ' +
      'not fully listed here — please call ahead to confirm.',

    specialties: [],

    facilities: [],

    hospitalVerified: false,

    qualityAccreditation: null,

    is24x7Emergency: false,

    hasPediatrics: false,

    hasDiagnostics: false,

    erWaitTime: 'N/A',

    emergencyHotline: null,

    openingHours: null,

    trustBreakdown: null,
  };
}


// =====================================================
// COMPONENT
// =====================================================

export function HospitalResultsPage({
  initialQuery = '',
  initialLocation = 'Near me',
  initialSelectedId = null,
  onNavigate,
  onSelectHospital,
}) {

  // =====================================================
  // SEARCH
  // =====================================================

  const [searchInput, setSearchInput] =
    useState(initialQuery);

  const [searchQuery, setSearchQuery] =
    useState(initialQuery);


  // =====================================================
  // DATA
  // =====================================================

  const [hospitalsData, setHospitalsData] =
    useState([]);

  const [featuredDoctors, setFeaturedDoctors] =
    useState([]);

  const [userLocation, setUserLocation] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [locationLoading, setLocationLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState('');

  const [locationError, setLocationError] =
    useState('');


  // =====================================================
  // FILTERS
  // =====================================================

  const [selectedSpecialty, setSelectedSpecialty] =
    useState('All');

  const [maxDistance, setMaxDistance] =
    useState(25);

  const [minRating, setMinRating] =
    useState(0);

  const [emergencyOnly, setEmergencyOnly] =
    useState(false);

  const [pediatricsOnly, setPediatricsOnly] =
    useState(false);

  const [diagnosticsOnly, setDiagnosticsOnly] =
    useState(false);


  // =====================================================
  // UI STATE
  // =====================================================

  const [selectedHospitalId, setSelectedHospitalId] =
    useState(initialSelectedId || null);

  const [mobileActiveTab, setMobileActiveTab] =
    useState('list');

  const [directionsNotice, setDirectionsNotice] =
    useState(null);


  // =====================================================
  // FEATURED DOCTORS
  // =====================================================

  useEffect(() => {
    doctorService
      .list({ limit: 100 })
      .then((response) => {
        setFeaturedDoctors(
          response.items || []
        );
      })
      .catch(() => {});
  }, []);


  // =====================================================
  // GET USER LOCATION
  // =====================================================

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(
        'Geolocation is not supported by this browser.'
      );

      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude:
            position.coords.latitude,

          longitude:
            position.coords.longitude,
        });

        setLocationLoading(false);
      },

      (error) => {
        console.log(
          'Location permission/error:',
          error
        );

        setLocationError(
          'Location permission is required to find hospitals near you.'
        );

        setLocationLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);


  // =====================================================
  // SEARCH SUBMIT
  // =====================================================

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const query =
      searchInput.trim();

    setSearchQuery(query);
  };


  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };


  // =====================================================
  // LOAD HOSPITALS
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const loadHospitals = async () => {

      // Wait for location
      if (locationLoading) {
        return;
      }

      // Location required
      if (!userLocation) {
        if (!cancelled) {
          setHospitalsData([]);
          setLoading(false);
        }

        return;
      }

      setLoading(true);
      setLoadError('');

      try {
        let hospitals = [];

        const query =
          searchQuery.trim();


        // =================================================
        // DETERMINE SEARCH / SPECIALTY
        // =================================================

        let specialty = null;

        if (
          selectedSpecialty !== 'All'
        ) {
          specialty =
            selectedSpecialty;
        }


        // =================================================
        // SEARCH MODE
        // =================================================

        if (query) {

          /*
           * Google Text Search
           *
           * Examples:
           *
           * Apollo
           * AIIMS
           * Cardiology
           * Diabetes
           * Cancer
           * Dermatology
           */

          const googleResults =
            await hospitalService.realSearch(
              query,
              userLocation.latitude,
              userLocation.longitude,
              maxDistance
            );

          hospitals =
            googleResults.map(
              (hospital) =>
                normalizeGoogleHospital(
                  hospital,
                  userLocation
                )
            );

        }

        // =================================================
        // SPECIALTY FILTER MODE
        // =================================================

        else if (specialty) {

          /*
           * Search Google for the selected specialty.
           */

          const googleResults =
            await hospitalService.realSearch(
              specialty,
              userLocation.latitude,
              userLocation.longitude,
              maxDistance
            );

          hospitals =
            googleResults.map(
              (hospital) =>
                normalizeGoogleHospital(
                  hospital,
                  userLocation
                )
            );

        }

        // =================================================
        // NEAR ME MODE
        // =================================================

        else {

          /*
           * No search.
           *
           * Get real hospitals around
           * user's current location.
           */

          const googleResults =
            await hospitalService.realNearby(
              userLocation.latitude,
              userLocation.longitude,
              maxDistance
            );

          hospitals =
            googleResults.map(
              (hospital) =>
                normalizeGoogleHospital(
                  hospital,
                  userLocation
                )
            );
        }


        // =================================================
        // HARD DISTANCE FILTER
        // =================================================

        /*
         * Google Text Search uses location bias.
         * Therefore we apply our own strict
         * distance filter here.
         */

        hospitals =
          hospitals.filter(
            (hospital) => {

              if (
                hospital.distance == null
              ) {
                return false;
              }

              return (
                hospital.distance <=
                maxDistance
              );
            }
          );


        // =================================================
        // RATING FILTER
        // =================================================

        if (minRating) {
          hospitals =
            hospitals.filter(
              (hospital) =>
                Number(
                  hospital.rating
                ) >= minRating
            );
        }


        // =================================================
        // EMERGENCY FILTER
        // =================================================

        /*
         * Google response currently does not
         * contain emergency information.
         *
         * So this filter only works for records
         * where the backend already provides it.
         */

        if (emergencyOnly) {
          hospitals =
            hospitals.filter(
              (hospital) =>
                hospital.is24x7Emergency
            );
        }


        // =================================================
        // PEDIATRICS FILTER
        // =================================================

        if (pediatricsOnly) {
          hospitals =
            hospitals.filter(
              (hospital) =>
                hospital.hasPediatrics
            );
        }


        // =================================================
        // DIAGNOSTICS FILTER
        // =================================================

        if (diagnosticsOnly) {
          hospitals =
            hospitals.filter(
              (hospital) =>
                hospital.hasDiagnostics
            );
        }


        // =================================================
        // SORT NEAREST FIRST
        // =================================================

        hospitals.sort(
          (a, b) => {

            const distanceA =
              Number(
                a.distance ??
                  Infinity
              );

            const distanceB =
              Number(
                b.distance ??
                  Infinity
              );

            return (
              distanceA -
              distanceB
            );
          }
        );


        // =================================================
        // SET RESULTS
        // =================================================

        if (!cancelled) {
          setHospitalsData(
            hospitals
          );
        }

      } catch (error) {

        console.error(
          'Hospital loading error:',
          error
        );

        if (!cancelled) {
          setHospitalsData([]);

          setLoadError(
            apiError(
              error,
              'Unable to load hospitals from Google Places.'
            )
          );
        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }
      }
    };


    loadHospitals();


    return () => {
      cancelled = true;
    };

  }, [
    userLocation,
    locationLoading,
    searchQuery,
    maxDistance,
    selectedSpecialty,
    minRating,
    emergencyOnly,
    pediatricsOnly,
    diagnosticsOnly,
  ]);


  // =====================================================
  // SELECT FIRST HOSPITAL
  // =====================================================

  useEffect(() => {

    if (
      hospitalsData.length > 0 &&
      !hospitalsData.some(
        (hospital) =>
          hospital.id ===
          selectedHospitalId
      )
    ) {
      setSelectedHospitalId(
        hospitalsData[0].id
      );
    }

  }, [
    hospitalsData,
    selectedHospitalId,
  ]);


  // =====================================================
  // DISTINCT SPECIALTIES
  // =====================================================

  const allSpecialties =
    useMemo(() => {

      /*
       * Keep the existing specialty
       * dropdown if backend hospital
       * records provide specialties.
       *
       * Google Places does not currently
       * return specialties in our field mask.
       */

      const specialties =
        new Set(['All']);

      hospitalsData.forEach(
        (hospital) => {

          if (
            Array.isArray(
              hospital.specialties
            )
          ) {
            hospital.specialties.forEach(
              (specialty) => {
                specialties.add(
                  specialty
                );
              }
            );
          }
        }
      );

      return Array.from(
        specialties
      );

    }, [hospitalsData]);


  // =====================================================
  // FINAL HOSPITAL DATA
  // =====================================================

  const filteredHospitals =
    useMemo(() => {

      return [
        ...hospitalsData,
      ].sort(
        (a, b) => {

          const distanceA =
            Number(
              a.distance ??
                Infinity
            );

          const distanceB =
            Number(
              b.distance ??
                Infinity
            );

          return (
            distanceA -
            distanceB
          );
        }
      );

    }, [hospitalsData]);


  // =====================================================
  // PATIENT STAY NEAR THIS HOSPITAL
  // =====================================================

  const handleFindStay = (hospital) => {
    // Google hospitals aren't in our DB, so hand the stay page their location.
    sessionStorage.setItem(
      `meditrust_stay_hospital_${hospital.id}`,
      JSON.stringify({
        id: hospital.id,
        name: hospital.name,
        address: hospital.address,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
      })
    );
    onNavigate('stays', { hospitalId: hospital.id });
  };


  // =====================================================
  // VIEW DETAILS
  // =====================================================

  const handleViewDetails = (hospitalOrId) => {
    const id =
      typeof hospitalOrId === 'string'
        ? hospitalOrId
        : hospitalOrId.id;

    const hospital = hospitalsData.find((h) => h.id === id);

    // Google hospitals aren't in our DB, so the details page can't look
    // them up by id — hand it the data we already have.
    if (hospital && hospital.source === 'google') {
      sessionStorage.setItem(
        `meditrust_hospital_${id}`,
        JSON.stringify(hospital)
      );
    }

    onSelectHospital(id);
  };


  // =====================================================
  // DIRECTIONS
  // =====================================================

  const handleDirections =
    (hospital) => {

      setSelectedHospitalId(
        hospital.id
      );

      /*
       * If Google provides a Maps URL,
       * open the real Google Maps location.
       */

      if (
        hospital.googleMapsUrl
      ) {
        window.open(
          hospital.googleMapsUrl,
          '_blank',
          'noopener,noreferrer'
        );
      }

      const distance =
        hospital.distance;

      let message =
        `Route opened to ${hospital.name}`;

      if (
        hospital.distanceText
      ) {
        message +=
          ` (${hospital.distanceText}`;
      }

      if (
        distance !== undefined &&
        distance !== null
      ) {
        message +=
          `, estimated driving time ~${Math.round(
            distance * 3.5
          )} mins)`;
      } else if (
        hospital.distanceText
      ) {
        message += ')';
      }

      message += '.';

      setDirectionsNotice(
        message
      );

      if (
        mobileActiveTab ===
        'list'
      ) {
        setMobileActiveTab(
          'map'
        );
      }
    };


  // =====================================================
  // LOCATION LOADING
  // =====================================================

  if (locationLoading) {
    return (
      <div className="container">

        <div className="no-results-state">

          <h3>
            Finding hospitals near you...
          </h3>

          <p>
            Please allow location access.
          </p>

        </div>

      </div>
    );
  }


  // =====================================================
  // LOCATION ERROR
  // =====================================================

  if (!userLocation) {
    return (
      <div className="container">

        <div className="no-results-state">

          <Icon
            name="map-pin"
            size={42}
            color="#94a3b8"
          />

          <h3>
            Location access required
          </h3>

          <p>
            MediTrust needs your browser
            location to show hospitals
            within your selected distance.
          </p>

          {locationError && (
            <p>
              {locationError}
            </p>
          )}

          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  // =====================================================
  // HOSPITAL LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="container">

        <div className="no-results-state">

          <h3>
            Finding real hospitals...
          </h3>

          <p>
            Searching Google Places near
            your location.
          </p>

        </div>

      </div>
    );
  }


  // =====================================================
  // API ERROR
  // =====================================================

  if (loadError) {
    return (
      <div className="container">

        <div className="no-results-state">

          <h3>
            {loadError}
          </h3>

          <button
            className="btn btn-outline"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="results-page-wrapper">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="results-header-bar">

        <div className="container">

          <div className="results-nav-meta">

            <button
              type="button"
              className="back-breadcrumb-btn"
              onClick={() =>
                onNavigate('home')
              }
            >

              <Icon
                name="arrow-right"
                size={14}
                className="rotate-180"
              />

              <span>
                Back to Home
              </span>

            </button>

            <h1 className="results-page-title">
              Find Hospitals
            </h1>

            <span className="results-count-badge">

              Showing{' '}

              <strong>
                {filteredHospitals.length}
              </strong>{' '}

              facilities within{' '}

              <strong>
                {maxDistance} km
              </strong>

            </span>

          </div>


          {/* =================================================
              SEARCH
          ================================================= */}

          <form
            className="results-search-inputs"
            onSubmit={
              handleSearchSubmit
            }
          >

            <div className="results-search-box">

              <Icon
                name="search"
                size={18}
                color="#4f46e5"
              />

              <input
                type="text"
                placeholder="Search hospital, treatment or specialty..."
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
              />

              {searchInput && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={
                    handleClearSearch
                  }
                >

                  <Icon
                    name="close"
                    size={14}
                  />

                </button>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-sm"
              >
                Search
              </button>

            </div>


            <div className="results-location-tag">

              <Icon
                name="map-pin"
                size={16}
                color="#0d9488"
              />

              <span>
                Current Location
              </span>

            </div>

          </form>


          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="compact-filter-toolbar">

            {/* Specialty */}

            <div className="filter-item specialty-select">

              <label htmlFor="specSelect">
                Specialty:
              </label>

              <select
                id="specSelect"
                value={
                  selectedSpecialty
                }
                onChange={(event) =>
                  setSelectedSpecialty(
                    event.target.value
                  )
                }
              >

                {allSpecialties.map(
                  (specialty) => (
                    <option
                      key={specialty}
                      value={specialty}
                    >
                      {specialty}
                    </option>
                  )
                )}

              </select>

            </div>


            {/* Distance */}

            <div className="filter-item distance-select">

              <label htmlFor="distSelect">
                Distance:
              </label>

              <select
                id="distSelect"
                value={maxDistance}
                onChange={(event) =>
                  setMaxDistance(
                    Number(
                      event.target.value
                    )
                  )
                }
              >

                <option value={5}>
                  Within 5 km
                </option>

                <option value={10}>
                  Within 10 km
                </option>

                <option value={25}>
                  Within 25 km
                </option>

                <option value={50}>
                  Within 50 km
                </option>

              </select>

            </div>


            {/* Rating */}

            <div className="filter-item rating-select">

              <label htmlFor="rateSelect">
                Rating:
              </label>

              <select
                id="rateSelect"
                value={minRating}
                onChange={(event) =>
                  setMinRating(
                    Number(
                      event.target.value
                    )
                  )
                }
              >

                <option value={0}>
                  All Ratings
                </option>

                <option value={4.0}>
                  4.0+ Stars
                </option>

                <option value={4.5}>
                  4.5+ Stars
                </option>

                <option value={4.8}>
                  4.8+ Stars
                </option>

              </select>

            </div>


            {/* Toggle filters */}

            <div className="filter-toggles-group">

              <button
                type="button"
                className={`filter-chip-toggle ${
                  emergencyOnly
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setEmergencyOnly(
                    !emergencyOnly
                  )
                }
              >

                <span className="dot"></span>

                <span>
                  24/7 Emergency
                </span>

              </button>


              <button
                type="button"
                className={`filter-chip-toggle ${
                  pediatricsOnly
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setPediatricsOnly(
                    !pediatricsOnly
                  )
                }
              >

                <span>
                  Pediatrics
                </span>

              </button>


              <button
                type="button"
                className={`filter-chip-toggle ${
                  diagnosticsOnly
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setDiagnosticsOnly(
                    !diagnosticsOnly
                  )
                }
              >

                <span>
                  Diagnostic MRI/CT
                </span>

              </button>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          DIRECTIONS NOTICE
      ================================================= */}

      {directionsNotice && (
        <div className="directions-notice-toast">

          <Icon
            name="navigation"
            size={18}
            color="#4f46e5"
          />

          <span>
            {directionsNotice}
          </span>

          <button
            type="button"
            className="toast-close"
            onClick={() =>
              setDirectionsNotice(
                null
              )
            }
          >

            <Icon
              name="close"
              size={14}
            />

          </button>

        </div>
      )}


      {/* =================================================
          MOBILE TABS
      ================================================= */}

      <div className="mobile-view-tabs">

        <button
          type="button"
          className={`mobile-tab-btn ${
            mobileActiveTab ===
            'list'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setMobileActiveTab(
              'list'
            )
          }
        >

          <Icon
            name="building"
            size={16}
          />

          <span>
            Hospital List (
            {filteredHospitals.length}
            )
          </span>

        </button>


        <button
          type="button"
          className={`mobile-tab-btn ${
            mobileActiveTab ===
            'map'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setMobileActiveTab(
              'map'
            )
          }
        >

          <Icon
            name="navigation"
            size={16}
          />

          <span>
            Interactive Map
          </span>

        </button>

      </div>


      {/* =================================================
          MAIN LAYOUT
      ================================================= */}

      <div className="container results-layout-container">


        {/* =================================================
            HOSPITAL LIST
        ================================================= */}

        <div
          className={`results-list-column ${
            mobileActiveTab ===
            'list'
              ? 'show-mobile'
              : 'hide-mobile'
          }`}
        >

          {filteredHospitals.length ===
          0 ? (

            <div className="no-results-state">

              <Icon
                name="building"
                size={42}
                color="#94a3b8"
              />

              <h3>
                No hospitals found
              </h3>

              <p>
                No matching hospitals
                were found within{' '}
                {maxDistance} km.
              </p>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {

                  setSearchInput('');
                  setSearchQuery('');

                  setSelectedSpecialty(
                    'All'
                  );

                  setMaxDistance(25);
                  setMinRating(0);

                  setEmergencyOnly(
                    false
                  );

                  setPediatricsOnly(
                    false
                  );

                  setDiagnosticsOnly(
                    false
                  );

                }}
              >
                Reset All Filters
              </button>

            </div>

          ) : (

            <div className="hospital-results-cards">

              {filteredHospitals.map(
                (hospital) => {

                  const isSelected =
                    hospital.id ===
                    selectedHospitalId;


                  const effectiveSpecialty =
                    selectedSpecialty !==
                    'All'
                      ? selectedSpecialty
                      : searchQuery;


                const safeHospital = {
  ...hospital,
  trustBreakdown:
    hospital.trustBreakdown || {
      verifiedExperience: 0,
      patientExperience: 0,
      qualitySignals: 0,
      transparency: 0,
    },
};

const matchScore =
  computeMatchScore(
    safeHospital,
    {
      specialty:
        effectiveSpecialty,

      hasVerifiedDoctor:
        hasVerifiedDoctorAt(
          hospital,
          featuredDoctors
        ),
    }
  );


                  return (
                    <div
                      key={
                        hospital.id
                      }
                      className={`hospital-result-card ${
                        isSelected
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        setSelectedHospitalId(
                          hospital.id
                        )
                      }
                    >

                      {/* ================================
                          CARD TOP
                      ================================= */}

                      <div className="card-top">

                        <div>

                          <span className="card-hospital-type">
                            {hospital.type ||
                              'Hospital'}
                          </span>

                          <h3 className="card-hospital-name">
                            {hospital.name}
                          </h3>

                          <p className="card-hospital-address">

                            <Icon
                              name="map-pin"
                              size={13}
                              color="#64748b"
                            />

                            <span>
                              {hospital.address}
                            </span>

                          </p>

                        </div>


                        <div className="card-rating-badge">

                          <Icon
                            name="star"
                            size={14}
                            color="#f59e0b"
                          />

                          <strong>
                            {hospital.rating ||
                              'N/A'}
                          </strong>

                          <span>
                            (
                            {hospital.reviewsCount ||
                              0}
                            )
                          </span>

                        </div>

                      </div>


                      {/* ================================
                          TRUST
                      ================================= */}

                      <div className="card-trust-row">

                        <MatchScoreBadge
                          score={
                            matchScore
                          }
                          size="sm"
                        />

                        <TrustBadge
                          hospital={
                            hospital
                          }
                          size="sm"
                        />

                        {hospital.qualityAccreditation && (
                          <span className="quality-signal-pill sm">

                            <Icon
                              name="award"
                              size={12}
                            />

                            <span>
                              {
                                hospital.qualityAccreditation
                              }
                            </span>

                          </span>
                        )}

                      </div>


                      {/* ================================
                          META
                      ================================= */}

                      <div className="card-meta-chips">

                        <div className="meta-chip distance">

                          <Icon
                            name="navigation"
                            size={13}
                          />

                          <span>
                            {hospital.distanceText ||
                              'Distance unavailable'}
                          </span>

                        </div>


                        {hospital.erWaitTime &&
                          hospital.erWaitTime !==
                            'N/A' && (
                            <div className="meta-chip wait-time">

                              <Icon
                                name="clock"
                                size={13}
                              />

                              <span>
                                ER Wait:{' '}
                                <strong>
                                  {
                                    hospital.erWaitTime
                                  }
                                </strong>
                              </span>

                            </div>
                          )}


                        {hospital.is24x7Emergency && (
                          <div className="meta-chip emergency">

                            <span className="dot"></span>

                            <span>
                              24/7 Trauma Care
                            </span>

                          </div>
                        )}

                      </div>


                      {/* ================================
                          SPECIALTIES
                      ================================= */}

                      {Array.isArray(
                        hospital.specialties
                      ) &&
                        hospital.specialties
                          .length >
                          0 && (
                          <div className="card-specialties">

                            {hospital.specialties.map(
                              (
                                specialty,
                                index
                              ) => (
                                <span
                                  key={
                                    index
                                  }
                                  className="spec-tag-sm"
                                >
                                  {
                                    specialty
                                  }
                                </span>
                              )
                            )}

                          </div>
                        )}


                      {/* ================================
                          GOOGLE SOURCE
                      ================================= */}

                      {hospital.source ===
                        'google' && (
                        <div
                          style={{
                            fontSize:
                              '11px',
                            color:
                              '#64748b',
                            marginTop:
                              '6px',
                          }}
                        >
                          Real-time place data
                          from Google
                        </div>
                      )}


                      {/* ================================
                          ACTIONS
                      ================================= */}

                      <div className="card-action-buttons">

                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={(
                            event
                          ) => {

                            event.stopPropagation();

                            handleDirections(
                              hospital
                            );

                          }}
                        >

                          <Icon
                            name="navigation"
                            size={14}
                          />

                          <span>
                            Get Directions
                          </span>

                        </button>


                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleFindStay(hospital);
                          }}
                        >
                          <Icon name="home" size={14} />
                          <span>Stay Nearby</span>
                        </button>


                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={(
                            event
                          ) => {

                            event.stopPropagation();

                            handleViewDetails(
                              hospital
                            );

                          }}
                        >

                          <span>
                            View Details
                          </span>

                          <Icon
                            name="arrow-right"
                            size={14}
                          />

                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>


        {/* =================================================
            MAP
        ================================================= */}

        <div
          className={`results-map-column ${
            mobileActiveTab ===
            'map'
              ? 'show-mobile'
              : 'hide-mobile'
          }`}
        >

          <div className="sticky-map-wrapper">

            <HospitalMap
              hospitals={
                filteredHospitals
              }

              selectedHospitalId={
                selectedHospitalId
              }

              onSelectHospital={(id) =>
                setSelectedHospitalId(
                  id
                )
              }

              onViewDetails={(id) =>
                handleViewDetails(
                  id
                )
              }

              onGetDirections={(
                hospital
              ) =>
                handleDirections(
                  hospital
                )
              }
            />

          </div>

        </div>

      </div>

    </div>
  );
}


