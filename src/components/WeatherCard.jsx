import { useEffect, useRef, useState } from 'react';
import { CloudSun, MapPin, Search, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const weatherCityKey = 'ecolife.weatherCity';

// Open-Meteo separates place-name lookup from the weather query, so resolve a
// typed city to coordinates first and use those coordinates for the forecast.
async function fetchCityWeather(city) {
  const geocodingUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
  geocodingUrl.search = new URLSearchParams({
    name: city,
    count: '1',
    language: 'en',
    format: 'json',
  });
  const geocodingResponse = await fetch(geocodingUrl);
  if (!geocodingResponse.ok) throw new Error('The city lookup service is unavailable. Please try again.');
  const geocodingData = await geocodingResponse.json();
  const location = geocodingData.results?.[0];
  if (!location) throw new Error(`We couldn't find "${city}". Check the spelling or try a nearby city.`);

  const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
  // Ask the API for the units used by the interface instead of converting them locally.
  forecastUrl.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,weather_code,wind_speed_10m',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'auto',
  });
  const forecastResponse = await fetch(forecastUrl);
  if (!forecastResponse.ok) throw new Error('The weather service is unavailable. Please try again.');
  const forecast = await forecastResponse.json();
  const current = forecast.current;
  if (!current || !Number.isFinite(current.temperature_2m) || !Number.isFinite(current.wind_speed_10m)) {
    throw new Error('Current weather data is unavailable for this city.');
  }

  return {
    city: location.name,
    region: [location.admin1, location.country].filter(Boolean).join(', '),
    temperature: Math.round(current.temperature_2m),
    wind: Math.round(current.wind_speed_10m),
  };
}

// Let visitors request live local conditions by city; remember successful
// searches in this browser and display API errors instead of invented readings.
export default function WeatherCard() {
  const { user } = useAuth();
  // Remember the visitor's last successful city in this browser, without storing it on the server.
  const [city, setCity] = useState(() => localStorage.getItem(weatherCityKey) || '');
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const autoLoaded = useRef(false);

  const loadWeather = async (cityName) => {
    const normalizedCity = cityName.trim();
    if (!normalizedCity) {
      setError('Enter a city to see its current weather.');
      setWeather(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Save the city only after both geocoding and forecast requests succeed.
      const result = await fetchCityWeather(normalizedCity);
      setWeather(result);
      setCity(normalizedCity);
      localStorage.setItem(weatherCityKey, normalizedCity);
    } catch (requestError) {
      setWeather(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use a previously chosen city first; otherwise signed-in users can start
    // with the city in their profile. Do not repeatedly auto-fetch on rerenders.
    if (autoLoaded.current) return;
    const savedCity = localStorage.getItem(weatherCityKey);
    const initialCity = savedCity || user?.location;
    if (!initialCity) return;
    autoLoaded.current = true;
    if (!savedCity) setCity(initialCity);
    loadWeather(initialCity);
  }, [user?.location]);

  const submitCity = (event) => {
    // Prevent the browser from navigating away when the search form is submitted.
    event.preventDefault();
    loadWeather(city);
  };

  return <section className="weather-band" aria-label="Current weather">
    <div className="weather-location">
      <span className="weather-icon">{weather ? <CloudSun size={22} /> : <Sun size={22} />}</span>
      <span>
        <strong>{weather ? `Current weather in ${weather.city}` : 'Weather for your city'}</strong>
        <small>{weather ? weather.region || 'Local conditions' : 'Enter a city to get a local forecast'}</small>
      </span>
    </div>
    <form className="weather-search" onSubmit={submitCity}>
      <label className="sr-only" htmlFor="weather-city">City for local weather</label>
      <MapPin size={15} aria-hidden="true" />
      <input
        id="weather-city"
        value={city}
        onChange={(event) => setCity(event.target.value)}
        placeholder="Enter a city"
        maxLength="100"
        autoComplete="address-level2"
      />
      <button className="weather-search-button" type="submit" disabled={loading || !city.trim()} aria-label="Get weather for city">
        <Search size={15} />
        <span>{loading ? 'Loading…' : 'Get weather'}</span>
      </button>
    </form>
    {weather && <div className="weather-reading"><strong>{weather.temperature}°F</strong><span> · Wind {weather.wind} mph</span></div>}
    <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="weather-credit">Weather by Open-Meteo</a>
    {error && <p className="weather-message" role="alert">{error}</p>}
    {!weather && !error && loading && <p className="weather-message" role="status">Finding local weather…</p>}
  </section>;
}
