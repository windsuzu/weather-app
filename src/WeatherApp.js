import React, { useEffect, useState, useCallback } from "react";
import styled from "@emotion/styled";
import { ReactComponent as CloudyIcon } from "./images/day-cloudy.svg";
import { ReactComponent as AirFlowIcon } from "./images/airFlow.svg";
import { ReactComponent as RainIcon } from "./images/rain.svg";
import { ReactComponent as RedoIcon } from "./images/refresh.svg";

const WEATHER_CURRENT_URL =
  "https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=CWB-A7DF6610-3FB6-4C69-A6E2-8F99181433FE&locationName=臺北";

const WEATHER_FORECAST_URL =
  "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=CWB-A7DF6610-3FB6-4C69-A6E2-8F99181433FE&locationName=臺北市";

const Container = styled.div`
  background-color: #ededed;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WeatherCard = styled.div`
  position: relative;
  min-width: 360px;
  box-shadow: 0 1px 3px 0 #999999;
  background-color: #f9f9f9;
  box-sizing: border-box;
  padding: 30px 15px;
`;

const Location = styled.div`
  font-size: 28px;
  color: ${(props) => (props.theme === "dark" ? "#dadada" : "#212121")};
  margin-bottom: 20px;
`;

const Description = styled.div`
  font-size: 16px;
  color: #828282;
  margin-bottom: 30px;
`;

const CurrentWeather = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Temperature = styled.div`
  color: #757575;
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
  color: #828282;
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
  color: #828282;
  svg {
    width: 25px;
    height: auto;
    margin-right: 30px;
  }
`;

const Redo = styled.div`
  position: absolute;
  right: 15px;
  bottom: 15px;
  font-size: 12px;
  display: inline-flex;
  align-items: flex-end;
  color: #828282;

  svg {
    margin-left: 10px;
    width: 15px;
    height: 15px;
    cursor: pointer;
  }
`;

const Cloudy = styled(CloudyIcon)`
  flex-basis: 30%;
`;

const beautifyDate = (dateStr) => {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(dateStr));
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
  });

  const fetchData = useCallback(() => {
    (async () => {
      const [weatherCurrent, weatherForecast] = await Promise.all([
        fetchCurrentWeather(),
        fetchWeatherForecast(),
      ]);
      setWeatherElement({
        ...weatherCurrent,
        ...weatherForecast,
      });
    })();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    <Container>
      <WeatherCard>
        <Location>{weatherElement.locationName}</Location>
        <Description>
          {weatherElement.description} {weatherElement.comfortability}
        </Description>
        <CurrentWeather>
          <Temperature>
            {Math.round(weatherElement.temperature)} <Celsius>°C</Celsius>
          </Temperature>
          <Cloudy />
        </CurrentWeather>
        <AirFlow>
          <AirFlowIcon />
          {weatherElement.windSpeed} m/h
        </AirFlow>
        <Rain>
          <RainIcon />
          {Math.round(weatherElement.rainPossibility)} %
        </Rain>
        <Redo onClick={fetchData}>
          最後觀測時間：{beautifyDate(weatherElement.observationTime)}
          <RedoIcon />
        </Redo>
      </WeatherCard>
    </Container>
  );
};

export default WeatherApp;
