# World Cup Finals Map

This is my CA3 full-stack project. It is a web map for finding places around the 2026 World Cup area in New York and New Jersey.

The website uses Google Maps to show stadiums, tourist attractions, parks, landmarks, and other useful places. Users can also plan a route between locations.

## What the project does

- Shows World Cup-related locations on a Google Map
- Displays information when a map marker is clicked
- Allows users to enter a start and end point for directions
- Allows extra stops to be added to a route
- Supports driving, public transport, cycling, and walking directions
- Filters locations by category
- Shows or hides points of interest
- Shows nearby hotels, bars, restaurants, and bus stops
- Works as a Progressive Web App using a service worker
- Has a responsive layout for smaller screens

## Technologies used

- HTML
- CSS
- JavaScript
- Google Maps JavaScript API
- Google Places API
- JSON
- Service workers and a web app manifest

## Project files

```text
Index.html              Main page
CSS/style.css           Styling for the website
JS/script.js            Map, markers, filters, and route functions
JSON/places.json        Saved location information
JSON/manifest.json      Progressive Web App settings
service-worker.js       Caching and offline support
Images/                 Icons and location images
```

## How to run it

1. Download or clone this repository.
2. Open the project folder in VS Code.
3. Start the project with a local web server.
4. Open `Index.html` through the local server in a browser.

It is better to use a local server instead of opening the HTML file directly because the project loads the places from a JSON file and uses a service worker.

For example, in VS Code I can install the **Live Server** extension, right-click `Index.html`, and select **Open with Live Server**.

## Google Maps API key

The Google Maps JavaScript API needs an API key. The key is included in the script tag near the bottom of `Index.html` for development.

For a real website, the key should be replaced with a personal key and restricted in Google Cloud Console. The following APIs/services need to be enabled:

- Maps JavaScript API
- Places API
- Directions API

## Using the website

When the page opens, the map displays the saved locations. Clicking a marker opens more information, such as the address, rating, image, and official website when available.

The **Route & Directions** button opens the route controls. Enter the start and end locations, add any stops, choose a transport type, and click **Get Directions**.

The **Map Options** button opens the filters and nearby services. From there, locations can be filtered and hotels, bars, restaurants, or bus stops can be displayed.

## My project notes

I used a JSON file so that the main location data is kept separate from the JavaScript. I also added a service worker and a manifest so the site can behave more like an app and cache some files for offline use. Google Maps features still need an internet connection when they have not already been loaded.

## Possible improvements

- Add more World Cup host cities
- Add a database instead of keeping all locations in one JSON file
- Add user accounts and saved routes
- Improve the offline map experience
- Add more accessibility testing
