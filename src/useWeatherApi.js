import { useState, useEffect, useCallback } from "react";

const WEATHER_CURRENT_URL = (locationName) =>
  `https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${process.env.REACT_APP_WEATHER_API_KEY}&locationName=${locationName}`;

const WEATHER_FORECAST_URL = (cityName) =>
  `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${process.env.REACT_APP_WEATHER_API_KEY}&locationName=${cityName}`;

const useWeatherApi = (currentLocation) => {
  const { locationName, cityName } = currentLocation;

  const [weatherElement, setWeatherElement] = useState({
    observationTime: new Date(),
    locationName: "",
    humid: 0,
    temperature: 0,
    windSpeed: 0,
    description: "",
    weatherCode: 0,
    rainPossibility: 0,
    comfortability: "",
    isLoading: true,
  });

  const fetchData = useCallback(() => {
    setWeatherElement((prev) => ({ ...prev, isLoading: true }));

    (async () => {
      const [weatherCurrent, weatherForecast] = await Promise.all([
        fetchCurrentWeather(locationName),
        fetchWeatherForecast(cityName),
      ]);
      setWeatherElement({
        ...weatherCurrent,
        ...weatherForecast,
        isLoading: false,
      });
    })();
  }, [locationName, cityName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [weatherElement, fetchData];
};

const fetchCurrentWeather = async (locationName) => {
  const response = await fetch(WEATHER_CURRENT_URL(locationName));
  const data = await response.json();
  const locationData = data.records.location[0];
  const weatherElements = locationData.weatherElement.reduce((dict, obj) => {
    // weatherElement: Array(21)
    //     0: {elementName: 'ELEV', elementValue: '6.2550'}
    //     1: {elementName: 'WDIR', elementValue: '100'}
    //     ...
    if (["WDSD", "TEMP", "HUMD"].includes(obj.elementName)) {
      dict[obj.elementName] = obj.elementValue;
    }
    return dict;
  });
  return {
    observationTime: locationData.time.obsTime,
    locationName: locationData.locationName,
    temperature: weatherElements.TEMP,
    windSpeed: weatherElements.WDSD,
    humid: weatherElements.HUMD,
  };
};

const fetchWeatherForecast = async (cityName) => {
  const response = await fetch(WEATHER_FORECAST_URL(cityName));
  const data = await response.json();
  const locationData = data.records.location[0];
  const weatherElements = locationData.weatherElement.reduce((dict, obj) => {
    //     weatherElement: [
    //       {
    //         elementName: 'Wx',
    //         time: [
    //           {
    //             parameter: {
    //               parameterName: '晴時多雲',
    //               parameterValue: '2',
    //             },
    //           },
    //           // ...
    if (["PoP", "CI", "Wx"].includes(obj.elementName)) {
      dict[obj.elementName] = obj.time[0].parameter;
    }
    return dict;
  }, {});
  return {
    description: weatherElements.Wx.parameterName,
    weatherCode: weatherElements.Wx.parameterValue,
    rainPossibility: weatherElements.PoP.parameterName,
    comfortability: weatherElements.CI.parameterName,
  };
};

export default useWeatherApi;
