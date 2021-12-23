import React, { useEffect, useState, useCallback, useMemo } from "react";
import styled from "@emotion/styled";
import { ThemeProvider } from "@emotion/react";
import { ReactComponent as AirFlowIcon } from "./images/airFlow.svg";
import { ReactComponent as RainIcon } from "./images/rain.svg";
import { ReactComponent as RefreshIcon } from "./images/refresh.svg";
import { ReactComponent as LoadingIcon } from "./images/loading.svg";

import sunriseAndSunsetData from "./sunrise-sunset.json";
import WeatherIcon from "./WeatherIcon";

const WEATHER_CURRENT_URL =
  "https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=CWB-A7DF6610-3FB6-4C69-A6E2-8F99181433FE&locationName=臺北";

const WEATHER_FORECAST_URL =
  "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=CWB-A7DF6610-3FB6-4C69-A6E2-8F99181433FE&locationName=臺北市";

const theme = {
  light: {
    backgroundColor: "#ededed",
    foregroundColor: "#f9f9f9",
    boxShadow: "0 1px 3px 0 #999999",
    titleColor: "#212121",
    temperatureColor: "#757575",
    textColor: "#828282",
  },
  dark: {
    backgroundColor: "#1F2022",
    foregroundColor: "#121416",
    boxShadow:
      "0 1px 4px 0 rgba(12, 12, 13, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.15)",
    titleColor: "#f9f9fa",
    temperatureColor: "#dddddd",
    textColor: "#cccccc",
  },
};

const Container = styled.div`
  background-color: ${({ theme }) => theme.backgroundColor};
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WeatherCard = styled.div`
  position: relative;
  min-width: 360px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  background-color: ${({ theme }) => theme.foregroundColor};
  box-sizing: border-box;
  padding: 30px 15px;
`;

const Location = styled.div`
  font-size: 28px;
  color: ${({ theme }) => theme.titleColor};
  margin-bottom: 20px;
`;

const Description = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.textColor};
  margin-bottom: 30px;
`;

const CurrentWeather = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Temperature = styled.div`
  color: ${({ theme }) => theme.temperatureColor};
  font-size: 96px;
  font-weight: 300;
  display: flex;
`;

const Celsius = styled.div`
  font-weight: normal;
  font-size: 42px;
`;

const AirFlow = styled.div`
  display: flex;
  align-items: center;
  font-size: 16x;
  font-weight: 300;
  color: ${({ theme }) => theme.textColor};
  margin-bottom: 20px;
  svg {
    width: 25px;
    height: auto;
    margin-right: 30px;
  }
`;

const Rain = styled.div`
  display: flex;
  align-items: center;
  font-size: 16x;
  font-weight: 300;
  color: ${({ theme }) => theme.textColor};
  svg {
    width: 25px;
    height: auto;
    margin-right: 30px;
  }
`;

const Refresh = styled.div`
  position: absolute;
  right: 15px;
  bottom: 15px;
  font-size: 12px;
  display: inline-flex;
  align-items: flex-end;
  color: ${({ theme }) => theme.textColor};

  svg {
    margin-left: 10px;
    width: 15px;
    height: 15px;
    cursor: pointer;
    animation: rotate infinite 1.5s linear;
    animation-duration: ${({ isLoading }) => (isLoading ? "1.5s" : "0s")};
  }
  @keyframes rotate {
    from {
      transform: rotate(360deg);
    }
    to {
      transform: rotate(0deg);
    }
  }
`;

const beautifyDate = (dateStr) => {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(dateStr));
};

const getMoment = (locationName) => {
  const location = sunriseAndSunsetData.find(
    (data) => data.locationName === locationName
  );
  if (!location) return null;
  const nowDate = Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/\//g, "-");
  const locationDate =
    location.time && location.time.find((time) => time.dataTime === nowDate);
  const sunriseTimestamp = new Date(
    `${locationDate.dataTime} ${locationDate.sunrise}`
  ).getTime();
  const sunsetTimestamp = new Date(
    `${locationDate.dataTime} ${locationDate.sunset}`
  ).getTime();
  const nowTimeStamp = new Date().getTime();
  return sunriseTimestamp <= nowTimeStamp && nowTimeStamp <= sunsetTimestamp
    ? "day"
    : "night";
};

const WeatherApp = () => {
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

  const {
    observationTime,
    locationName,
    temperature,
    windSpeed,
    description,
    weatherCode,
    rainPossibility,
    comfortability,
    isLoading,
  } = weatherElement;

  const [currentTheme, setCurrentTheme] = useState("light");

  const fetchData = useCallback(() => {
    setWeatherElement((prev) => ({ ...prev, isLoading: true }));

    (async () => {
      const [weatherCurrent, weatherForecast] = await Promise.all([
        fetchCurrentWeather(),
        fetchWeatherForecast(),
      ]);
      setWeatherElement({
        ...weatherCurrent,
        ...weatherForecast,
        isLoading: false,
      });
    })();
  }, []);

  const currentMoment = useMemo(() => {
    return getMoment(locationName);
  }, [locationName]);

  useEffect(() => {
    fetchData();
    setCurrentTheme(currentMoment === "day" ? "light" : "dark");
  }, [fetchData, currentMoment]);

  const fetchCurrentWeather = async () => {
    const response = await fetch(WEATHER_CURRENT_URL);
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

  const fetchWeatherForecast = async () => {
    const response = await fetch(WEATHER_FORECAST_URL);
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

  return (
    <ThemeProvider theme={theme[currentTheme]}>
      <Container>
        <WeatherCard>
          <Location>{locationName}</Location>
          <Description>
            {description} {comfortability}
          </Description>
          <CurrentWeather>
            <Temperature>
              {Math.round(temperature)} <Celsius>°C</Celsius>
            </Temperature>
            <WeatherIcon
              currentWeatherCode={weatherCode}
              moment={currentMoment || "day"}
            />
          </CurrentWeather>
          <AirFlow>
            <AirFlowIcon />
            {windSpeed} m/h
          </AirFlow>
          <Rain>
            <RainIcon />
            {Math.round(rainPossibility)} %
          </Rain>
          <Refresh onClick={fetchData} isLoading={isLoading}>
            最後觀測時間：{beautifyDate(observationTime)}
            {isLoading ? <LoadingIcon /> : <RefreshIcon />}
          </Refresh>
        </WeatherCard>
      </Container>
    </ThemeProvider>
  );
};

export default WeatherApp;
