import React from "react";
import ReactDOM from "react-dom";
import WeatherApp from "./WeatherApp";
import "./styles/style.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

ReactDOM.render(
  <React.StrictMode>
    <WeatherApp />
  </React.StrictMode>,
  document.getElementById("root")
);

serviceWorkerRegistration.register();
