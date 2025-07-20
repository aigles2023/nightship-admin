import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const libraries = ['places'];

const center = {
  lat: 39.9612, // Columbus
  lng: -82.9988,
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: '60px', // petit espace pour les filtres
  left: '0',
};

const wrapperStyle = {
  position: 'fixed',
  top: 0,
  left: '200px', // correspond à largeur sidebar
  right: 0,
  bottom: 0,
  backgroundColor: '#000',
};

const filterBarStyle = {
  position: 'absolute',
  top: '10px',
  left: '220px',
  zIndex: 10,
  display: 'flex',
  gap: '10px',
};

const selectStyle = {
  padding: '10px',
  fontSize: '16px',
  borderRadius: '6px',
  border: '1px solid #ccc',
};

const recenterButtonStyle = {
  position: 'absolute',
  top: '70px',
  right: '80px',
  zIndex: 10,
  backgroundColor: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '10px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const driverInfoStyle = {
  position: 'absolute',
  bottom: '30px',
  left: '220px',
  backgroundColor: '#fff',
  padding: '15px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  zIndex: 10,
  minWidth: '250px',
};

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

const usStatesCities = {
  "Alabama": ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa"],
  "Alaska": ["Anchorage", "Fairbanks", "Juneau", "Wasilla", "Sitka"],
  "Arizona": ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale"],
  "Arkansas": ["Little Rock", "Fayetteville", "Fort Smith", "Springdale", "Jonesboro"],
  "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
  "Colorado": ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Boulder"],
  "Connecticut": ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury"],
  "Delaware": ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna"],
  "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"],
  "Georgia": ["Atlanta", "Savannah", "Augusta", "Athens", "Macon"],
  "Hawaii": ["Honolulu", "Hilo", "Kailua", "Kapolei", "Waipahu"],
  "Idaho": ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello"],
  "Illinois": ["Chicago", "Aurora", "Naperville", "Springfield", "Peoria"],
  "Indiana": ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel"],
  "Iowa": ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City"],
  "Kansas": ["Wichita", "Overland Park", "Kansas City", "Topeka", "Olathe"],
  "Kentucky": ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington"],
  "Louisiana": ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"],
  "Maine": ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn"],
  "Maryland": ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Annapolis"],
  "Massachusetts": ["Boston", "Worcester", "Springfield", "Lowell", "Cambridge"],
  "Michigan": ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor"],
  "Minnesota": ["Minneapolis", "Saint Paul", "Rochester", "Duluth", "Bloomington"],
  "Mississippi": ["Jackson", "Gulfport", "Southaven", "Biloxi", "Hattiesburg"],
  "Missouri": ["Kansas City", "Saint Louis", "Springfield", "Independence", "Columbia"],
  "Montana": ["Billings", "Missoula", "Great Falls", "Bozeman", "Helena"],
  "Nebraska": ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney"],
  "Nevada": ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks"],
  "New Hampshire": ["Manchester", "Nashua", "Concord", "Dover", "Rochester"],
  "New Jersey": ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison"],
  "New Mexico": ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell"],
  "New York": ["New York City", "Buffalo", "Rochester", "Yonkers", "Albany"],
  "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem"],
  "North Dakota": ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo"],
  "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron"],
  "Oklahoma": ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton"],
  "Oregon": ["Portland", "Eugene", "Salem", "Gresham", "Hillsboro"],
  "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading"],
  "Rhode Island": ["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence"],
  "South Carolina": ["Columbia", "Charleston", "North Charleston", "Mount Pleasant", "Rock Hill"],
  "South Dakota": ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown"],
  "Tennessee": ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"],
  "Texas": ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth"],
  "Utah": ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem"],
  "Vermont": ["Burlington", "South Burlington", "Rutland", "Barre", "Montpelier"],
  "Virginia": ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News"],
  "Washington": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"],
  "West Virginia": ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling"],
  "Wisconsin": ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine"],
  "Wyoming": ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs"],
  "District of Columbia": ["Washington D.C."]
};

const LiveMap = () => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState([]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCvouyA--sBT4GI6QLMfTfClkEGmClWVyw',
    libraries,
  });

  const mapRef = useRef(null);
  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'drivers'), (snapshot) => {
      const driversData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(driver => driver.isAvailable && driver.location);

      setDrivers(driversData);
      setFilteredDrivers(driversData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedState) {
      setCities(usStatesCities[selectedState] || []);
    } else {
      setCities([]);
    }
  }, [selectedState]);

  useEffect(() => {
    let results = drivers;

    if (selectedState) {
      results = results.filter(d => d.state === selectedState);
    }
    if (selectedCity) {
      results = results.filter(d => d.city === selectedCity);
    }

    setFilteredDrivers(results);
  }, [selectedState, selectedCity, drivers]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div style={wrapperStyle}>
      <div style={filterBarStyle}>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          style={selectStyle}
        >
          <option value="">All States</option>
          {Object.keys(usStatesCities).map((s, idx) => (
            <option key={idx} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={selectStyle}
          disabled={!selectedState}
        >
          <option value="">All Cities</option>
          {cities.map((c, idx) => (
            <option key={idx} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={5}
        center={center}
        onLoad={onMapLoad}
        options={{ styles: darkMapStyle }}
      >
        {filteredDrivers.map(driver => (
          <Marker
            key={driver.id}
            position={driver.location}
            title={driver.fullName}
            icon={{
              url: driver.photoURL || 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        ))}
      </GoogleMap>

      <button
        style={recenterButtonStyle}
        onClick={() => mapRef.current?.panTo(center)}
      >
        Recenter
      </button>

      <div style={driverInfoStyle}>
        <h4>Driver Info</h4>
        <p>Click on a marker to view driver</p>
      </div>
    </div>
  );
};

export default LiveMap;
