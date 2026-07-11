import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, 
  Wind, Droplets, Thermometer, Eye, Sunrise, Sunset, Gauge, Umbrella, 
  Activity, X, Maximize2, Minimize2, RefreshCw, Calendar, Clock,
  Droplet, Navigation, CloudDrizzle, MapPin, Zap, Star
} from 'lucide-react';

interface WeatherWidgetProps {
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const getWeatherInfo = (code: number, isDay: number) => {
  const codes: Record<number, { desc: string, icon: React.ElementType, bg: string, iconColor: string, type: string }> = {
    0: { desc: "Clear sky", icon: isDay ? Sun : Moon, bg: isDay ? "from-sky-400 to-blue-600" : "from-slate-800 to-slate-950", iconColor: isDay ? "text-yellow-400" : "text-blue-200", type: isDay ? "sunny" : "night" },
    1: { desc: "Mainly clear", icon: isDay ? Sun : Moon, bg: isDay ? "from-sky-400 to-blue-600" : "from-slate-800 to-slate-950", iconColor: isDay ? "text-yellow-400" : "text-blue-200", type: isDay ? "sunny" : "night" },
    2: { desc: "Partly cloudy", icon: Cloud, bg: isDay ? "from-blue-300 to-gray-500" : "from-slate-700 to-slate-900", iconColor: "text-gray-300", type: "cloudy" },
    3: { desc: "Overcast", icon: Cloud, bg: "from-gray-500 to-gray-700", iconColor: "text-gray-400", type: "cloudy" },
    45: { desc: "Fog", icon: CloudFog, bg: "from-gray-400 to-gray-600", iconColor: "text-gray-300", type: "fog" },
    48: { desc: "Depositing rime fog", icon: CloudFog, bg: "from-gray-400 to-gray-600", iconColor: "text-gray-300", type: "fog" },
    51: { desc: "Light drizzle", icon: CloudRain, bg: "from-slate-500 to-slate-700", iconColor: "text-blue-300", type: "rain" },
    53: { desc: "Moderate drizzle", icon: CloudRain, bg: "from-slate-500 to-slate-700", iconColor: "text-blue-300", type: "rain" },
    55: { desc: "Dense drizzle", icon: CloudRain, bg: "from-slate-500 to-slate-700", iconColor: "text-blue-300", type: "rain" },
    61: { desc: "Slight rain", icon: CloudRain, bg: "from-slate-600 to-slate-800", iconColor: "text-blue-400", type: "rain" },
    63: { desc: "Moderate rain", icon: CloudRain, bg: "from-slate-600 to-slate-800", iconColor: "text-blue-400", type: "rain" },
    65: { desc: "Heavy rain", icon: CloudRain, bg: "from-slate-600 to-slate-800", iconColor: "text-blue-400", type: "rain" },
    71: { desc: "Slight snow", icon: CloudSnow, bg: "from-indigo-300 to-slate-500", iconColor: "text-white", type: "snow" },
    73: { desc: "Moderate snow", icon: CloudSnow, bg: "from-indigo-300 to-slate-500", iconColor: "text-white", type: "snow" },
    75: { desc: "Heavy snow", icon: CloudSnow, bg: "from-indigo-300 to-slate-500", iconColor: "text-white", type: "snow" },
    77: { desc: "Snow grains", icon: CloudSnow, bg: "from-indigo-300 to-slate-500", iconColor: "text-white", type: "snow" },
    80: { desc: "Slight rain showers", icon: CloudRain, bg: "from-slate-600 to-slate-800", iconColor: "text-blue-400", type: "rain" },
    81: { desc: "Moderate rain showers", icon: CloudRain, bg: "from-slate-600 to-slate-800", iconColor: "text-blue-400", type: "rain" },
    82: { desc: "Violent rain showers", icon: CloudRain, bg: "from-slate-600 to-slate-800", iconColor: "text-blue-400", type: "rain" },
    85: { desc: "Slight snow showers", icon: CloudSnow, bg: "from-indigo-300 to-slate-500", iconColor: "text-white", type: "snow" },
    86: { desc: "Heavy snow showers", icon: CloudSnow, bg: "from-indigo-300 to-slate-500", iconColor: "text-white", type: "snow" },
    95: { desc: "Thunderstorm", icon: CloudLightning, bg: "from-purple-800 to-slate-900", iconColor: "text-yellow-400", type: "storm" },
    96: { desc: "Thunderstorm with hail", icon: CloudLightning, bg: "from-purple-800 to-slate-900", iconColor: "text-yellow-400", type: "storm" },
    99: { desc: "Heavy thunderstorm", icon: CloudLightning, bg: "from-purple-800 to-slate-900", iconColor: "text-yellow-400", type: "storm" },
  };
  return codes[code] || { desc: "Unknown", icon: Cloud, bg: "from-slate-800 to-slate-900", iconColor: "text-gray-300", type: "cloudy" };
};

export default function WeatherWidget({ onClose, isExpanded, onToggleExpand }: WeatherWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [aqi, setAqi] = useState<any>(null);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=35.6892&longitude=51.3890&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,weather_code,pressure_msl,visibility,wind_speed_10m,wind_direction_10m,uv_index,is_day,freezing_level_height,snowfall&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&timezone=auto');
      const aqiRes = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=35.6892&longitude=51.3890&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto');
      
      const weatherData = await weatherRes.json();
      const aqiData = await aqiRes.json();
      
      setData(weatherData);
      setAqi(aqiData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  if (loading || !data) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md h-[650px] rounded-[24px] bg-slate-900/80 backdrop-blur-2xl flex items-center justify-center border border-white/10 shadow-2xl"
      >
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </motion.div>
    );
  }

  const current = data.current;
  const info = getWeatherInfo(current.weather_code, current.is_day);
  const CurrentIcon = info.icon;

  // Hourly (next 24 hours)
  const currentHourIdx = data.hourly.time.findIndex((t: string) => new Date(t) > new Date());
  const hourlyData = data.hourly.time.slice(currentHourIdx, currentHourIdx + 24).map((time: string, i: number) => {
    const idx = currentHourIdx + i;
    return {
      time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(data.hourly.temperature_2m[idx]),
      code: data.hourly.weather_code[idx],
      isDay: data.hourly.is_day[idx],
      rainProb: data.hourly.precipitation_probability[idx]
    };
  });

  // Daily (next 7 days)
  const dailyData = data.daily.time.map((time: string, i: number) => ({
    date: new Date(time).toLocaleDateString([], { weekday: 'short' }),
    max: Math.round(data.daily.temperature_2m_max[i]),
    min: Math.round(data.daily.temperature_2m_min[i]),
    code: data.daily.weather_code[i],
    rainProb: data.daily.precipitation_probability_max[i]
  }));

  const formatWindDir = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className={`relative overflow-hidden rounded-[24px] shadow-2xl flex flex-col backdrop-blur-2xl border border-white/20 text-white transition-all duration-500 ease-in-out
        ${isExpanded ? 'w-[800px] h-[80vh]' : 'w-[400px] h-[650px]'}
      `}
    >
      {/* Dynamic Background with Gradients */}
      <div className={`absolute inset-0 bg-gradient-to-br ${info.bg} opacity-90 transition-colors duration-1000 z-0`} />
      
      {/* Weather Animations */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-50">
        {info.type === 'snow' && (
          <div className="absolute inset-0 flex items-start justify-between px-10 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce duration-1000"></div>
            <div className="w-1 h-1 bg-white rounded-full animate-bounce duration-700 mt-20"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce duration-1000 mt-10"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce duration-500"></div>
          </div>
        )}
        {info.type === 'rain' && (
          <div className="absolute inset-0 flex items-start justify-between px-10">
            <div className="w-0.5 h-10 bg-blue-300/50 rotate-12 animate-pulse mt-4"></div>
            <div className="w-0.5 h-16 bg-blue-300/50 rotate-12 animate-pulse mt-20"></div>
            <div className="w-0.5 h-12 bg-blue-300/50 rotate-12 animate-pulse mt-10"></div>
          </div>
        )}
        {info.type === 'storm' && (
          <div className="absolute inset-0 bg-yellow-400/10 animate-ping"></div>
        )}
        {info.type === 'night' && (
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-40 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
          </div>
        )}
        {info.type === 'sunny' && (
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/30 rounded-full blur-3xl"></div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <button onClick={fetchWeather} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={onToggleExpand} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors bg-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Main Current View */}
        <div className="flex flex-col items-center pt-8 pb-4 text-center">
          <div className="flex items-center gap-2 text-2xl font-medium tracking-wide mb-2">
            <MapPin className="w-5 h-5 text-white/70" />
            تهران
          </div>
          <div className="text-xs font-medium text-white/80 uppercase tracking-widest mb-6">
            Tehran
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <CurrentIcon className={`w-28 h-28 ${info.iconColor} drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`} />
            </motion.div>
            <div className="flex flex-col items-start">
              <div className="text-[6rem] font-bold leading-none tracking-tighter drop-shadow-lg">
                {Math.round(current.temperature_2m)}°
              </div>
            </div>
          </div>
          
          <div className="text-xl font-medium mb-1 drop-shadow-md">{info.desc}</div>
          <div className="text-white/80 text-sm">Feels like {Math.round(current.apparent_temperature)}°</div>
        </div>

        {/* Essential Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-white/10 hover:bg-white/20 transition-colors">
            <Wind className="w-6 h-6 mb-2 text-white/70" />
            <div className="text-xs text-white/70 mb-1">Wind</div>
            <div className="font-semibold text-sm">{current.wind_speed_10m} km/h</div>
            <div className="text-[10px] text-white/50">{formatWindDir(current.wind_direction_10m)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-white/10 hover:bg-white/20 transition-colors">
            <Droplets className="w-6 h-6 mb-2 text-white/70" />
            <div className="text-xs text-white/70 mb-1">Humidity</div>
            <div className="font-semibold text-sm">{current.relative_humidity_2m}%</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-white/10 hover:bg-white/20 transition-colors">
            <Cloud className="w-6 h-6 mb-2 text-white/70" />
            <div className="text-xs text-white/70 mb-1">Cloud Cover</div>
            <div className="font-semibold text-sm">{current.cloud_cover}%</div>
          </div>
        </div>

        {/* Hourly Forecast */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-2 mb-4 text-white/80">
            <Clock className="w-4 h-4" />
            <span className="font-medium text-xs uppercase tracking-wider">Next 24 Hours</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar snap-x">
            {hourlyData.map((hour: any, i: number) => {
              const hInfo = getWeatherInfo(hour.code, hour.isDay);
              const HIcon = hInfo.icon;
              return (
                <div key={i} className="flex flex-col items-center justify-between min-w-[70px] bg-black/20 rounded-xl p-3 snap-center border border-white/5">
                  <div className="text-xs font-medium mb-2 opacity-80">{hour.time}</div>
                  <HIcon className={`w-8 h-8 mb-2 ${hInfo.iconColor}`} />
                  <div className="text-lg font-bold mb-1">{hour.temp}°</div>
                  <div className="flex items-center gap-1 text-[10px] text-sky-300">
                    <Droplet className="w-3 h-3" />
                    {hour.rainProb}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`grid ${isExpanded ? 'grid-cols-2 gap-6' : 'grid-cols-1 gap-6'}`}>
          {/* Daily Forecast */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 h-fit">
            <div className="flex items-center gap-2 mb-4 text-white/80">
              <Calendar className="w-4 h-4" />
              <span className="font-medium text-xs uppercase tracking-wider">7-Day Forecast</span>
            </div>
            <div className="space-y-3">
              {dailyData.map((day: any, i: number) => {
                const dInfo = getWeatherInfo(day.code, 1);
                const DIcon = dInfo.icon;
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="w-16 font-medium text-sm">{i === 0 ? 'Today' : day.date}</div>
                    <div className="flex items-center gap-3 w-20">
                      <DIcon className={`w-6 h-6 ${dInfo.iconColor}`} />
                      <div className="flex items-center gap-1 text-xs text-sky-300 w-10">
                        {day.rainProb > 0 && (
                          <>
                            <Droplet className="w-3 h-3" />
                            {day.rainProb}%
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-24 justify-end">
                      <span className="text-white/60 text-sm font-medium">{day.min}°</span>
                      <div className="w-16 h-1.5 rounded-full bg-black/40 relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-yellow-400 w-full opacity-80" />
                      </div>
                      <span className="font-medium text-sm">{day.max}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extra Info Grid */}
          <div className="grid grid-cols-2 gap-3 h-fit">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 text-white/70 text-xs uppercase tracking-wider">
                <Sun className="w-4 h-4" /> UV Index
              </div>
              <div className="text-3xl font-semibold mb-1">{data.hourly.uv_index[currentHourIdx]}</div>
              <div className="text-xs text-white/60">Max {data.daily.uv_index_max[0]} today</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 text-white/70 text-xs uppercase tracking-wider">
                <Eye className="w-4 h-4" /> Visibility
              </div>
              <div className="text-3xl font-semibold mb-1">{(data.hourly.visibility[currentHourIdx] / 1000).toFixed(1)} <span className="text-sm">km</span></div>
              <div className="text-xs text-white/60">Clear view</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 text-white/70 text-xs uppercase tracking-wider">
                <Gauge className="w-4 h-4" /> Pressure
              </div>
              <div className="text-3xl font-semibold mb-1">{Math.round(current.pressure_msl)}</div>
              <div className="text-xs text-white/60">hPa</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 text-white/70 text-xs uppercase tracking-wider">
                <Thermometer className="w-4 h-4" /> Dew Point
              </div>
              <div className="text-3xl font-semibold mb-1">{Math.round(data.hourly.dew_point_2m[currentHourIdx])}°</div>
              <div className="text-xs text-white/60">Humidity factor</div>
            </div>

            <div className="col-span-2 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-white/70 text-xs uppercase tracking-wider">
                  <Sunrise className="w-4 h-4 text-yellow-300" /> Sunrise
                </div>
                <div className="text-xl font-medium">{new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div className="h-10 w-[1px] bg-white/20 relative z-10" />
              <div className="text-right relative z-10">
                <div className="flex items-center justify-end gap-2 mb-2 text-white/70 text-xs uppercase tracking-wider">
                  Sunset <Sunset className="w-4 h-4 text-orange-300" />
                </div>
                <div className="text-xl font-medium">{new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            {aqi && (
              <div className="col-span-2 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-emerald-400" /> Air Quality
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    aqi.current.european_aqi < 50 ? 'bg-emerald-500/20 text-emerald-300' :
                    aqi.current.european_aqi < 100 ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-rose-500/20 text-rose-300'
                  }`}>
                    AQI {aqi.current.european_aqi}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="bg-black/20 rounded-lg py-2">
                    <div className="text-white/50 text-[10px] uppercase mb-1">PM2.5</div>
                    <div className="font-semibold">{aqi.current.pm2_5}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg py-2">
                    <div className="text-white/50 text-[10px] uppercase mb-1">PM10</div>
                    <div className="font-semibold">{aqi.current.pm10}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg py-2">
                    <div className="text-white/50 text-[10px] uppercase mb-1">O₃</div>
                    <div className="font-semibold">{aqi.current.ozone}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg py-2">
                    <div className="text-white/50 text-[10px] uppercase mb-1">NO₂</div>
                    <div className="font-semibold">{aqi.current.nitrogen_dioxide}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
