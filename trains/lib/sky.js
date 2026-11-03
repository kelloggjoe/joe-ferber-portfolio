// Where the sun is over Chicago, so the map can follow the real sky.
// Low-precision solar position (good to about a degree), from the
// Astronomical Almanac's approximation.

const RAD = Math.PI / 180;

// Sun's height above the horizon in degrees.
export function sunElevation(date, lat, lon) {
  const d = date.getTime() / 86400000 - 10957.5; // days since J2000.0
  const g = ((357.529 + 0.98560028 * d) % 360) * RAD; // mean anomaly
  const q = 280.459 + 0.98564736 * d; // mean longitude
  const ecliptic = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const tilt = (23.439 - 0.00000036 * d) * RAD;
  const dec = Math.asin(Math.sin(tilt) * Math.sin(ecliptic));
  const ra = Math.atan2(Math.cos(tilt) * Math.sin(ecliptic), Math.cos(ecliptic));
  const siderealHours = (18.697374558 + 24.06570982441908 * d) % 24;
  const hourAngle = (siderealHours * 15 + lon) * RAD - ra;
  const latR = lat * RAD;
  return Math.asin(Math.sin(latR) * Math.sin(dec) + Math.cos(latR) * Math.cos(dec) * Math.cos(hourAngle)) / RAD;
}

// Civil twilight runs from 6° above the horizon to 6° below.
export function skyPhase(elevation) {
  if (elevation > 6) return "day";
  if (elevation >= -6) return "dusk";
  return "night";
}
