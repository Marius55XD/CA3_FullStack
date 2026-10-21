  
  //global variables
  let map = null
            let directionsRenderer = null
            let directionsService = null
            let routeLocations = []
            let locationMarkers = []
            let routeMarkers = []
            let hotelMarkers = []
            let barMarkers = []
            let restaurantMarkers = []
            let busStopMarkers = []
            let locationsBounds = null
            let currentTravelMode = "DRIVING"
            let currentPOIMode = "hide"
            let currentLocationFilter = "all"
            let currentHotelsMode = "hide"
            let currentBarsMode = "hide"
            let currentRestaurantsMode = "hide"
            let currentBusStopsMode = "hide"


            //Main function to load the map 
            async function loadMap()
            {
                //reset route location 
                routeLocations = []

                // Load the locations from the JSON file
                let locations = await fetch("JSON/places.json").then(response => response.json())

                // Create the map
                let mapCentre = new google.maps.LatLng(40.7580, -73.9855)

                map = new google.maps.Map(document.getElementById("map"), {
                    mapId: "MY_MAP_ID",
					zoom: 10,
                    center: mapCentre,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                })
                
                //hide default points of interest
                hidePointsOfInterest(map)
                

                //set up directions renderer 
                directionsRenderer = new google.maps.DirectionsRenderer({
                    draggable: false, //user cannot drag route
                    suppressMarkers: true, //using customer markers
                    preserveViewport: false,
                    polylineOptions: {
                        strokeColor: "#1d4ed8",
                        strokeOpacity: 0.95,
                        strokeWeight: 6
                    }
                })
                directionsRenderer.setMap(map)
                directionsRenderer.setPanel(document.getElementById("ms_directions"))
                document.getElementById("ms_directions").style.display = "none"
                
                //input for start and end locations
                let startInput = document.getElementById("start")
                let endInput = document.getElementById("end")
                new google.maps.places.Autocomplete(startInput)
                new google.maps.places.Autocomplete(endInput)

                //default values
                startInput.value = "Times Square"
                endInput.value = "Central Park"

                //listen for route changes
                directionsRenderer.addListener("directions_changed", () =>
                {
                    let directions = directionsRenderer.getDirections()
                    console.log(directions)
                })

                let infoWindow = null
                let bounds = new google.maps.LatLngBounds()
                locationsBounds = bounds
                let placesService = new google.maps.places.PlacesService(map)

                // This function gets the full Google Place details for a place_id
                function getPlaceDetails(placeId)
                {
                    return new Promise((resolve, reject) =>
                    {
                        let request = {
                            placeId: placeId,
                            fields: ["name", "formatted_address", "rating", "user_ratings_total", "website", "business_status", "geometry", "photos"]
                        }

                        placesService.getDetails(request, (place, status) =>
                        {
                            if (status === google.maps.places.PlacesServiceStatus.OK)
                            {
                                resolve(place)
                            }
                            else
                            {
                                reject(status)
                            }
                        })
                    })
                }

                // This function creates each marker and adds the click event
                function createMarker(location, placeDetails, position)
                {
                    let latitude = typeof position.lat === "function" ? position.lat() : position.lat
                    let longitude = typeof position.lng === "function" ? position.lng() : position.lng
                    let markerIconUrl = (location.category === "Stadium" || (placeDetails.name || location.name || "").toLowerCase().includes("metlife"))
                        ? "Images/stadiumIcon.png"
                        : "Images/star.png"

                    //save location for routing
                    routeLocations.push({
                        name: placeDetails.name,
                        position: new google.maps.LatLng(latitude, longitude),
                        placeId: location.place_id || null
                    })

                    //create marker
                    let marker = new google.maps.Marker({
                        position: new google.maps.LatLng(latitude, longitude),
                        map: map,
                        title: placeDetails.name,
                        icon: {
                            url: markerIconUrl,
                            scaledSize: new google.maps.Size(38, 38),
                            anchor: new google.maps.Point(19, 19)
                        }
                    })

                    //store marker with category
                    locationMarkers.push({
                        marker: marker,
                        category: location.category || "Other"
                    })

                    //extend map bounds
                    bounds.extend(new google.maps.LatLng(latitude, longitude))

                    if (infoWindow === null)
                    {
                        infoWindow = new google.maps.InfoWindow()
                    }

                    //when marker is clicked, show info
                        google.maps.event.addListener(marker, "click", () =>
                        {
                            let ratingText = placeDetails.rating ? placeDetails.rating + " ★ (" + (placeDetails.user_ratings_total || 0) + " reviews)" : "No rating available"
                            let addressText = placeDetails.formatted_address || location.description || "Address not available"
                            let websiteText = placeDetails.website ? `<a href="${placeDetails.website}" target="_blank" rel="noopener" class="ms_infoCardButton">Official website</a>` : ""
                            let categoryText = location.category || "Tourist spot"

                            //Google Places photo if available, otherwise fall back to image URL in JSON or default icon
                            let imageUrl = location.image || "Images/worldCupIcon.png"

                            //try to use google photo if available
                            if (placeDetails.photos && placeDetails.photos.length > 0)
                            {
                                try {
                                    imageUrl = placeDetails.photos[0].getUrl({ maxWidth: 400 })
                                }
                                catch (e) {
                                    if (placeDetails.photos[0].photo_reference)
                                {
                                    imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${placeDetails.photos[0].photo_reference}&key=AIzaSyCGRlW1JBzDerS1v1rBeFPWnqnqpaQ05zE`
                                }
                                }
                            }


                            //set content for popup
                            infoWindow.setContent(
                                `<div class="ms_infoCard">
                                    <div class="ms_infoCardMedia">
                                        <img src="${imageUrl}" alt="${placeDetails.name}" onerror="this.onerror=null;this.src='Images/worldCupIcon.png';">
                                        <div class="ms_infoCardOverlay">
                                            <span class="ms_infoCardBadge">${categoryText}</span>
                                        </div>
                                    </div>
                                    <div class="ms_infoCardBody">
                                        <h3 class="ms_infoCardTitle">${placeDetails.name}</h3>
                                        <div class="ms_infoCardItem">
                                            <span class="ms_infoCardLabel">Address</span>
                                            <span class="ms_infoCardValue">${addressText}</span>
                                        </div>
                                        <div class="ms_infoCardItem">
                                            <span class="ms_infoCardLabel">Rating</span>
                                            <span class="ms_infoCardValue">${ratingText}</span>
                                        </div>
                                        ${websiteText}
                                    </div>
                                </div>`
                            )

                            infoWindow.open(map, marker)
                        })
                }

                //loop through each location from the JSON file
                for (let i = 0; i < locations.length; i++)
                {
                    let location = locations[i]

                    try
                    {
                        // If the JSON has a place_id, get the full Google Place details
                        if (location.place_id)
                        {
                            try {
                                let placeDetails = await getPlaceDetails(location.place_id)
                                let position = placeDetails.geometry.location

                                createMarker(location, placeDetails, position)
                            }
                          catch (apiError) {
                                console.log("Place API failed for " + location.name + ", using lat/lng fallback");
                                 let placeDetails = {
                                 name: location.name,
                                 formatted_address: location.description,
                                 business_status: "Tourist location",
                                 // Change these two lines to use the data from your JSON:
                                 rating: location.rating || null, 
                                 user_ratings_total: location.user_ratings_total || null,
                                  website: location.website || null
                    };

                     createMarker(location, placeDetails, {lat: location.lat, lng: location.lng});
                    }
                        }
                        //Otherwise use the latitude and longitude in the JSON file
                        else if (location.lat && location.lng)
                        {
                            let placeDetails = {
                                name: location.name,
                                formatted_address: location.description,
                                business_status: "Tourist location",
                                rating: null,
                                user_ratings_total: null,
                                website: location.website || null
                            }

                            createMarker(location, placeDetails, {lat: location.lat, lng: location.lng})
                        }
                    }
                    catch (error)
                    {
                        console.log("Could not load details for " + location.name)
                        console.log(error)
                    }
                }

                //fit map to all markers
                if (!bounds.isEmpty())
                {
                    map.fitBounds(bounds)
                }

                showSidebarPanel(null)
            }

            // add a new stop input box
            function addStopInput(value = "")
            {
                let stopContainer = document.getElementById("ms_stopsContainer")
                if (!stopContainer)
                {
                    return
                }

                let stopRows = stopContainer.querySelectorAll(".ms_stop_row")
                let stopNumber = stopRows.length + 1

                let stopRow = document.createElement("div")
                stopRow.className = "ms_controlsGroup ms_controlsRow ms_stop_row"

                //label like stop 1, stop 2 etc
                let stopLabel = document.createElement("label")
                stopLabel.className = "ms_stopLabel"
                stopLabel.textContent = "Stop " + stopNumber + ":"

                //input box
                let stopInput = document.createElement("input")
                stopInput.type = "text"
                stopInput.className = "ms_stopInput"
                stopInput.value = value

                //remove button
                let removeButton = document.createElement("button")
                removeButton.type = "button"
                removeButton.className = "ms_stop_remove_button"
                removeButton.textContent = "Remove"
                //when clicked delete stop and update route
                removeButton.addEventListener("click", () =>
                {
                    stopRow.remove()
                    renumberStopLabels() //fix numbering
                    calculateRoute() //update route
                })

                //add everything to the page
                stopRow.appendChild(stopLabel)
                stopRow.appendChild(stopInput)
                stopRow.appendChild(removeButton)
                stopContainer.appendChild(stopRow)

                //add autocomplete to new stop input
                new google.maps.places.Autocomplete(stopInput)
            }

            //fix stop numbers after deleting one
            function renumberStopLabels()
            {
                let stopRows = document.querySelectorAll("#ms_stopsContainer .ms_stop_row")
                for (let i = 0; i < stopRows.length; i++)
                {
                    let stopLabel = stopRows[i].querySelector(".ms_stopLabel")
                    if (stopLabel)
                    {
                        stopLabel.textContent = "Stop " + (i + 1) + ":"
                    }
                }
            }

            //make text easier to compare lowercase + remove symbols
            function normalizeLocationText(value)
            {
                return value.toLowerCase().replace(/[^a-z0-9]/g, "")
            }

            //try match user input to a know location 
            function findRouteLocationByText(value)
            {
                let normalizedValue = normalizeLocationText(value)

                for (let i = 0; i < routeLocations.length; i++)
                {
                    if (normalizeLocationText(routeLocations[i].name) === normalizedValue)
                    {
                        return routeLocations[i]
                    }
                }

                return null
            }

            //get correct format for routing placed_id or text
            function getRouteLocationInput(value)
            {
                let matchedLocation = findRouteLocationByText(value)
                if (matchedLocation)
                {
                    return {
                        location: matchedLocation,
                        requestValue: matchedLocation.placeId ? {placeId: matchedLocation.placeId} : matchedLocation.position
                    }
                }

                return {
                    location: null,
                    requestValue: value
                }
            }

            //remove all route markers from map
            function clearRouteMarkers()
            {
                for (let i = 0; i < routeMarkers.length; i++)
                {
                    routeMarkers[i].setMap(null)
                }

                routeMarkers = []
            }

            //show or hide all location markers
            function setLocationMarkersVisible(isVisible)
            {
                for (let i = 0; i < locationMarkers.length; i++)
                {
                    locationMarkers[i].marker.setMap(isVisible ? map : null)
                }
            }

            //filters markers by category, or shows all if filterValue is all
            function applyLocationFilter(filterValue = currentLocationFilter)
            {
                currentLocationFilter = filterValue

                for (let i = 0; i < locationMarkers.length; i++)
                {
                    let locationMarker = locationMarkers[i]
                    let shouldShow = filterValue === "all" || locationMarker.category === filterValue
                    locationMarker.marker.setMap(shouldShow ? map : null)
                }
            }

            //update filter from dropdown
            function updateLocationFilter()
            {
                let filterSelect = document.getElementById("ms_locationFilter")
                if (!filterSelect)
                {
                    return
                }

                applyLocationFilter(filterSelect.value)
            }

            //crate custom icons for route markers
            function createRouteMarkerIcon(imagePath)
            {
                return {
                    url: imagePath,
                    scaledSize: new google.maps.Size(38, 38),
                    anchor: new google.maps.Point(19, 38)
                }
            }

            //add marker for start, stop or end of route
            function addRouteMarker(position, imagePath, title)
            {
                let marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    title: title,
                    icon: createRouteMarkerIcon(imagePath),
                    zIndex: 1000
                })

                routeMarkers.push(marker)
            }

            //show markers for start, stops and end of route
            function showRouteMarkers(route, routePoints = [])
            {
                clearRouteMarkers()

                if (!route || !route.routes || route.routes.length === 0)
                {
                    return
                }

                let selectedRoute = route.routes[0]
                let legs = selectedRoute.legs || []

                if (legs.length === 0)
                {
                    return
                }

                //start marker
                let startPoint = routePoints[0] && routePoints[0].location ? routePoints[0].location.position : legs[0].start_location
                addRouteMarker(startPoint, "Images/start.png", "Start")


                //stop markers
                for (let i = 1; i < routePoints.length - 1; i++)
                {
                    let stopPoint = routePoints[i] && routePoints[i].location ? routePoints[i].location.position : legs[i - 1].end_location
                    addRouteMarker(stopPoint, "Images/stop.png", "Stop " + i)
                }

                //end marker
                let endPoint = routePoints[routePoints.length - 1] && routePoints[routePoints.length - 1].location ? routePoints[routePoints.length - 1].location.position : legs[legs.length - 1].end_location
                addRouteMarker(endPoint, "Images/finish.png", "Finish")
            }


            //calculate and display route
            function calculateRoute(travelMode = null)
            {
                let start = document.getElementById("start").value.trim()
                let end = document.getElementById("end").value.trim()
                let stops = Array.from(document.querySelectorAll(".ms_stopInput"))
                    .map((stopInput) => stopInput.value.trim())
                    .filter((stop) => stop !== "")

                if (start === "" || end === "")
                {
                    return
                }

                if (!travelMode)
                {
                    travelMode = currentTravelMode
                }

                currentTravelMode = travelMode

                let transportButtons = document.querySelectorAll(".ms_transportButton")
                for (let i = 0; i < transportButtons.length; i++)
                {
                    transportButtons[i].classList.toggle("is-active", transportButtons[i].dataset.mode === travelMode)
                }

                //clear old route ui
                let directionsPanel = document.getElementById("ms_directions")
                directionsPanel.innerHTML = ""
                directionsPanel.style.display = "none"

                clearRouteMarkers()
                setLocationMarkersVisible(false)

                //build route request 
                let routePoints = []
                let startRouteInput = getRouteLocationInput(start)
                let stopRouteInputs = stops.map((stop) => getRouteLocationInput(stop))
                let endRouteInput = getRouteLocationInput(end)

                routePoints.push(startRouteInput)
                for (let i = 0; i < stopRouteInputs.length; i++)
                {
                    routePoints.push(stopRouteInputs[i])
                }
                routePoints.push(endRouteInput)

                let request = {
                    origin: startRouteInput.requestValue,
                    destination: endRouteInput.requestValue,
                    waypoints: stopRouteInputs.map((stopRouteInput) => ({ location: stopRouteInput.requestValue, stopover: true })),
                    travelMode: google.maps.TravelMode[travelMode]
                }

                directionsService = new google.maps.DirectionsService()


                //call api
                directionsService.route(request, (route, status) =>
                {
                    if (status === google.maps.DirectionsStatus.OK)
                    {
                        directionsRenderer.setDirections(route)
                        showRouteMarkers(route, routePoints)
                        if (route.routes && route.routes.length > 0)
                        {
                            map.fitBounds(route.routes[0].bounds)
                        }
                        directionsPanel.style.display = "block"
                        showSidebarPanel("ms_routeControlsPanel")
                    }
                    else
                    {
                        directionsRenderer.setDirections({routes: []})
                        applyLocationFilter()
                    }
                })
            }

            //clear route
            function clearRoute()
            {
                if (directionsRenderer)
                {
                    directionsRenderer.setDirections({routes: []})
                }

                clearRouteMarkers()
                applyLocationFilter()

                let directionsPanel = document.getElementById("ms_directions")
                directionsPanel.innerHTML = ""
                directionsPanel.style.display = "none"

                if (map && locationsBounds && !locationsBounds.isEmpty())
                {
                    map.fitBounds(locationsBounds)
                }

                showSidebarPanel(null)
            }

            //toggle for poi visibility
            function togglePointsOfInterest()
            {
                currentPOIMode = currentPOIMode === "hide" ? "show" : "hide"

                let poiButton = document.getElementById("ms_poiToggleButton")
                poiButton.textContent = currentPOIMode === "hide" ? "Hide POI" : "Show POI"

                if (currentPOIMode === "hide")
                {
                    hidePointsOfInterest(map)
                }
                else
                {
                    map.setMapTypeId(google.maps.MapTypeId.ROADMAP)
                }
            }

            //hide pois using map styles
            function hidePointsOfInterest(map)
            {
                let styles = [
                    {
                        featureType: "poi",
                        stylers: [{visibility: "off"}]
                    }
                ]

                let styledMapType = new google.maps.StyledMapType(styles, {name: "POI Hidden"})
                map.mapTypes.set("hide_poi", styledMapType)
                map.setMapTypeId("hide_poi")
            }

            //toggle hotels visibility
            function toggleHotels()
            {
                currentHotelsMode = currentHotelsMode === "hide" ? "show" : "hide"

                let hotelButton = document.getElementById("ms_hotelToggleButton")
                hotelButton.textContent = currentHotelsMode === "hide" ? "Show Hotels" : "Hide Hotels"

                if (currentHotelsMode === "show")
                {
                    searchHotels()
                }
                else
                {
                    clearHotels()
                }
            }

            //search for nearby hotels using places API
            function searchHotels()
            {
                if (!map) return

                clearHotels()

                let mapCenter = map.getCenter()
                let placesService = new google.maps.places.PlacesService(map)

                let request = {
                    location: mapCenter,
                    radius: 5000, 
                    type: "lodging" 
                }

                //perform nearby search
                placesService.nearbySearch(request, (results, status) =>
                {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results)
                    {
                
                        function isLodgingPlace(p) {
                            if (!p || !p.types) return false
                            const t = p.types
                            return t.includes('lodging') || t.includes('hotel') || t.includes('resort') || t.includes('motel')
                        }

                        for (let i = 0; i < Math.min(results.length, 10); i++)
                        {
                            let result = results[i]

                        
                            if (!isLodgingPlace(result)) continue

                            // try to get full place details 
                            if (result.place_id)
                            {
                                let detailsRequest = {
                                    placeId: result.place_id,
                                    fields: ["name", "rating", "opening_hours", "photos", "formatted_address", "website", "geometry", "types"]
                                }

                                placesService.getDetails(detailsRequest, (placeDetails, detailsStatus) =>
                                {
                                    if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails)
                                    {
                                        
                                        if (isLodgingPlace(placeDetails))
                                        {
                                            createHotelMarker(placeDetails)
                                        }
                                    }
                                    else
                                    {
                                        createHotelMarker(result)
                                    }
                                })
                            }
                            else
                            {
                                createHotelMarker(result)
                            }
                        }
                    }
                    else if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS)
                    {
                        console.log("Hotel search error:", status)
                    }
                })
            }

            //create marker for each hotel 
            function createHotelMarker(hotel)
            {
                let hotelIcon = {
                    url: 'Images/hotel.png',
                    scaledSize: new google.maps.Size(36, 36),
                    anchor: new google.maps.Point(18, 36)
                }

                let marker = new google.maps.Marker({
                    position: hotel.geometry.location,
                    map: map,
                    title: hotel.name,
                    icon: hotelIcon,
                    optimized: true
                })

                google.maps.event.addListener(marker, "click", () =>
                {
                    let rating = hotel.rating ? hotel.rating + " ★" : "No rating"
                    let openNow = hotel.opening_hours ? (hotel.opening_hours.open_now ? "Open now" : "Closed") : "Hours unknown"

                    let imageUrl = 'Images/worldCupIcon.png'
                    try {
                        if (hotel.photos && hotel.photos.length > 0 && typeof hotel.photos[0].getUrl === 'function')
                        {
                            imageUrl = hotel.photos[0].getUrl({ maxWidth: 400 })
                        }
                    }
                    catch (e) {
                    }

                    let infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div class="ms_infoCard">
                                <div class="ms_infoCardMedia">
                                    <img src="${imageUrl}" alt="${hotel.name}" onerror="this.onerror=null;this.src='Images/worldCupIcon.png';" />
                                    <div class="ms_infoCardOverlay">
                                        <span class="ms_infoCardBadge">Hotel</span>
                                    </div>
                                </div>
                                <div class="ms_infoCardBody">
                                    <h3 class="ms_infoCardTitle">${hotel.name}</h3>
                                    <div class="ms_infoCardItem">
                                        <span class="ms_infoCardLabel">Type</span>
                                        <span class="ms_infoCardValue">Hotel / Lodging</span>
                                    </div>
                                    <div class="ms_infoCardItem">
                                        <span class="ms_infoCardLabel">Rating</span>
                                        <span class="ms_infoCardValue">${rating}</span>
                                    </div>
                                    <div class="ms_infoCardItem">
                                        <span class="ms_infoCardLabel">Status</span>
                                        <span class="ms_infoCardValue">${openNow}</span>
                                    </div>
                                </div>
                            </div>
                        `
                    })

                    infoWindow.open(map, marker)
                })

                //store marker reference
                hotelMarkers.push(marker)
            }

            //clear all hotel markers from map
            function clearHotels()
            {
                for (let i = 0; i < hotelMarkers.length; i++)
                {
                    hotelMarkers[i].setMap(null)
                }
                hotelMarkers = []
            }

            //clear bar markers
            function clearBars()
            {
                for (let i = 0; i < barMarkers.length; i++)
                {
                    barMarkers[i].setMap(null)
                }
                barMarkers = []
            }

            //toggle bars visibility
            function toggleBars()
            {
                currentBarsMode = currentBarsMode === "hide" ? "show" : "hide"

                let barButton = document.getElementById("ms_barToggleButton")
                barButton.textContent = currentBarsMode === "hide" ? "Show Bars" : "Hide Bars"

                if (currentBarsMode === "show")
                {
                    searchBars()
                }
                else
                {
                    clearBars()
                }
            }

            //search for nearby bars using places API
            function searchBars()
            {
                if (!map) return

                clearBars()

                let mapCenter = map.getCenter()

                //create places service
                let placesService = new google.maps.places.PlacesService(map)

                let request = {
                    location: mapCenter,
                    radius: 3000, 
                    type: "bar" 
                }

                placesService.nearbySearch(request, (results, status) =>
                {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results)
                    {
                        for (let i = 0; i < Math.min(results.length, 12); i++)
                        {
                            let result = results[i]

                            if (!result.types || (!result.types.includes('bar') && !result.types.includes('night_club'))) continue

                            if (result.place_id)
                            {
                                let detailsRequest = {
                                    placeId: result.place_id,
                                    fields: ["name", "rating", "opening_hours", "photos", "formatted_address", "website", "geometry", "types"]
                                }

                                placesService.getDetails(detailsRequest, (placeDetails, detailsStatus) =>
                                {
                                    if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails)
                                    {
                                        if (placeDetails.types && (placeDetails.types.includes('bar') || placeDetails.types.includes('night_club')))
                                        {
                                            createBarMarker(placeDetails)
                                        }
                                    }
                                    else
                                    {
                                        createBarMarker(result)
                                    }
                                })
                            }
                            else
                            {
                                createBarMarker(result)
                            }
                        }
                    }
                    else if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS)
                    {
                        console.log("Bar search error:", status)
                    }
                })
            }

            //create marker for each bar
            function createBarMarker(place)
            {
                let barIcon = {
                    url: 'Images/bar.png',
                    scaledSize: new google.maps.Size(36, 36),
                    anchor: new google.maps.Point(18, 36)
                }

                let marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    title: place.name || 'Bar',
                    icon: barIcon
                })

                google.maps.event.addListener(marker, "click", () =>
                {
                    let rating = place.rating ? place.rating + " ★" : "No rating"
                    let openNow = place.opening_hours ? (place.opening_hours.open_now ? "Open now" : "Closed") : "Hours unknown"

                    // try to use place photo
                    let imageUrl = 'Images/worldCupIcon.png'
                    try {
                        if (place.photos && place.photos.length > 0 && typeof place.photos[0].getUrl === 'function')
                        {
                            imageUrl = place.photos[0].getUrl({ maxWidth: 400 })
                        }
                    }
                    catch (e) {}

                    let infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div class="ms_infoCard">
                                <div class="ms_infoCardMedia">
                                    <img src="${imageUrl}" alt="${place.name}" onerror="this.onerror=null;this.src='Images/worldCupIcon.png';" />
                                    <div class="ms_infoCardOverlay">
                                        <span class="ms_infoCardBadge">Bar</span>
                                    </div>
                                </div>
                                <div class="ms_infoCardBody">
                                    <h3 class="ms_infoCardTitle">${place.name}</h3>
                                    <div class="ms_infoCardItem">
                                        <span class="ms_infoCardLabel">Rating</span>
                                        <span class="ms_infoCardValue">${rating}</span>
                                    </div>
                                    <div class="ms_infoCardItem">
                                        <span class="ms_infoCardLabel">Status</span>
                                        <span class="ms_infoCardValue">${openNow}</span>
                                    </div>
                                </div>
                            </div>
                        `
                    })

                    infoWindow.open(map, marker)
                })

                barMarkers.push(marker)
            }

            //toggle restaurants visibility
            function toggleRestaurants()
            {
                currentRestaurantsMode = currentRestaurantsMode === "hide" ? "show" : "hide"

                let restaurantButton = document.getElementById("ms_restaurantToggleButton")
                restaurantButton.textContent = currentRestaurantsMode === "hide" ? "Show Restaurants" : "Hide Restaurants"

                if (currentRestaurantsMode === "show")
                {
                    searchRestaurants()
                }
                else
                {
                    clearRestaurants()
                }
            }

            //search for nearby restaurants using places API
            function searchRestaurants()
            {
                if (!map) return

            
                clearRestaurants()

        
                let mapCenter = map.getCenter()

                //create places service
                let placesService = new google.maps.places.PlacesService(map)

    
                let request = {
                    location: mapCenter,
                    radius: 3000, 
                    type: "restaurant" 
                }

                console.log("Searching for restaurants...", request)

                //perform nearby search
                placesService.nearbySearch(request, (results, status) =>
                {
                    console.log("Restaurant search status:", status, "Results count:", results ? results.length : 0)
                    
                    if (status === google.maps.places.PlacesServiceStatus.OK && results)
                    {
                        console.log("Found", results.length, "restaurants")
                        
                        for (let i = 0; i < Math.min(results.length, 15); i++)
                        {
                            let result = results[i]
                            console.log("Processing restaurant:", result.name, "Place ID:", result.place_id)

                            if (result.place_id)
                            {
                                let detailsRequest = {
                                    placeId: result.place_id,
                                    fields: ["name", "rating", "opening_hours", "photos", "formatted_address", "website", "geometry", "types"]
                                }

                                placesService.getDetails(detailsRequest, (placeDetails, detailsStatus) =>
                                {
                                    if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails)
                                    {
                                        console.log("Got details for:", placeDetails.name)
                                        createRestaurantMarker(placeDetails)
                                    }
                                    else
                                    {
                                        console.log("Details error for", result.name, ":", detailsStatus)
                                        createRestaurantMarker(result)
                                    }
                                })
                            }
                            else
                            {
                                createRestaurantMarker(result)
                            }
                        }
                    }
                    else if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS)
                    {
                        console.log("Restaurant search error:", status)
                    }
                    else
                    {
                        console.log("No restaurants found")
                    }
                })
            }

            //create marker for each restaurant
            function createRestaurantMarker(place)
            {
                let restaurantIcon = {
                    url: 'Images/eat.png',
                    scaledSize: new google.maps.Size(36, 36),
                    anchor: new google.maps.Point(18, 36)
                }

                let marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    title: place.name || 'Restaurant',
                    icon: restaurantIcon
                })

                google.maps.event.addListener(marker, "click", () =>
                {
                    let rating = place.rating ? place.rating + " ★" : "No rating"
                    let openNow = place.opening_hours ? (place.opening_hours.open_now ? "Open now" : "Closed") : "Hours unknown"

                    let imageUrl = 'Images/worldCupIcon.png'
                    try {
                        if (place.photos && place.photos.length > 0 && typeof place.photos[0].getUrl === 'function')
                        {
                            imageUrl = place.photos[0].getUrl({ maxWidth: 400 })
                        }
                    }
                    catch (e) {}

                    let infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div class="ms_infoCard">
                                <div class="ms_infoCardMedia">
                                    <img src="${imageUrl}" alt="${place.name}" onerror="this.onerror=null;this.src='Images/worldCupIcon.png';" />
                                    <div class="ms_infoCardOverlay">
                                        <span class="ms_infoCardBadge">Restaurant</span>
                                    </div>
                                </div>
                                <div class="ms_infoCardBody">
                                    <h3 class="ms_infoCardTitle">${place.name}</h3>
                                    <div class="ms_infoCardItem">
                                        <span class="ms_infoCardLabel">Rating</span>
                                        <span class="ms_infoCardValue">${rating}</span>
                                    </div>
                                    <div class="ms_infoCardItem">
                                        <span class="ms_infoCardLabel">Status</span>
                                        <span class="ms_infoCardValue">${openNow}</span>
                                    </div>
                                </div>
                            </div>
                        `
                    })

                    infoWindow.open(map, marker)
                })

                restaurantMarkers.push(marker)
            }

            //clear all restaurant markers from map
            function clearRestaurants()
            {
                for (let i = 0; i < restaurantMarkers.length; i++)
                {
                    restaurantMarkers[i].setMap(null)
                }
                restaurantMarkers = []
            }

            //toggle bus stops visibility
            function toggleBusStops()
            {
                currentBusStopsMode = currentBusStopsMode === "hide" ? "show" : "hide"

                let busStopButton = document.getElementById("ms_busStopToggleButton")
                busStopButton.textContent = currentBusStopsMode === "hide" ? "Show Bus Stops" : "Hide Bus Stops"

                if (currentBusStopsMode === "show")
                {
                    searchBusStops()
                }
                else
                {
                    clearBusStops()
                }
            }

            //search for nearby bus stops using places API
            function searchBusStops()
            {
                if (!map) return

                clearBusStops()

                let mapCenter = map.getCenter()

                //create places service
                let placesService = new google.maps.places.PlacesService(map)

                let request = {
                    location: mapCenter,
                    radius: 2000,
                    type: "bus_station"
                }

                console.log("Searching for bus stops...", request)

                //perform nearby search
                placesService.nearbySearch(request, (results, status) =>
                {
                    console.log("Bus stop search status:", status, "Results count:", results ? results.length : 0)
                    
                    if (status === google.maps.places.PlacesServiceStatus.OK && results)
                    {
                        console.log("Found", results.length, "bus stops")
                        
                        for (let i = 0; i < Math.min(results.length, 12); i++)
                        {
                            let result = results[i]
                            console.log("Processing bus stop:", result.name, "Place ID:", result.place_id)

                            if (result.place_id)
                            {
                                let detailsRequest = {
                                    placeId: result.place_id,
                                    fields: ["name", "rating", "opening_hours", "photos", "formatted_address", "website", "geometry", "types"]
                                }

                                placesService.getDetails(detailsRequest, (placeDetails, detailsStatus) =>
                                {
                                    if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails)
                                    {
                                        console.log("Got details for:", placeDetails.name)
                                        createBusStopMarker(placeDetails)
                                    }
                                    else
                                    {
                                        console.log("Details error for", result.name, ":", detailsStatus)
                                        createBusStopMarker(result)
                                    }
                                })
                            }
                            else
                            {
                                createBusStopMarker(result)
                            }
                        }
                    }
                    else if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS)
                    {
                        console.log("Bus stop search error:", status)
                    }
                })
            }

            //create marker for each bus stop
            function createBusStopMarker(place)
            {
                let busStopIcon = {
                    url: 'Images/bus.png',
                    scaledSize: new google.maps.Size(36, 36),
                    anchor: new google.maps.Point(18, 36)
                }

                let marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    title: place.name || 'Bus Stop',
                    icon: busStopIcon
                })

                google.maps.event.addListener(marker, "click", () =>
                {
                    let infoWindow = new google.maps.InfoWindow()

                    let rating = place.rating ? place.rating + " ★" : "N/A"
                    let openNow = place.opening_hours ? (place.opening_hours.open_now ? "Open" : "Closed") : "N/A"
                    let photoUrl = place.photos && place.photos.length > 0 ? place.photos[0].getUrl({maxWidth: 250, maxHeight: 200}) : ""
                    let photoHtml = photoUrl ? `<img src="${photoUrl}" alt="${place.name}" style="width: 100%; height: auto; border-radius: 4px; margin-bottom: 8px;">` : ""

                    infoWindow.setContent(`
                        <div class="ms_infoCard">
                            ${photoHtml}
                            <div class="ms_infoCardBody">
                                <h4>${place.name}</h4>
                                <p>${place.formatted_address || 'Address not available'}</p>
                                <div class="ms_infoCardItem">
                                    <span class="ms_infoCardLabel">Rating</span>
                                    <span class="ms_infoCardValue">${rating}</span>
                                </div>
                                <div class="ms_infoCardItem">
                                    <span class="ms_infoCardLabel">Status</span>
                                    <span class="ms_infoCardValue">${openNow}</span>
                                </div>
                                ${place.website ? `<a href="${place.website}" target="_blank" class="ms_infoCardButton">Visit Website</a>` : ''}
                            </div>
                        </div>
                    `)

                    infoWindow.open(map, marker)
                })

                busStopMarkers.push(marker)
            }

            //clear all bus stop markers from map
            function clearBusStops()
            {
                for (let i = 0; i < busStopMarkers.length; i++)
                {
                    busStopMarkers[i].setMap(null)
                }
                busStopMarkers = []
            }

            //show or hide sidebar panels
            function showSidebarPanel(panelId)
            {
                let panelIds = ["ms_routeControlsPanel", "ms_mapOptionsPanel"]

                for (let i = 0; i < panelIds.length; i++)
                {
                    let panel = document.getElementById(panelIds[i])
                    if (panel)
                    {
                        panel.hidden = panelIds[i] !== panelId
                    }
                }

                let buttons = document.querySelectorAll(".ms_navButton")
                for (let i = 0; i < buttons.length; i++)
                {
                    buttons[i].classList.toggle("is-active", panelId !== null && buttons[i].dataset.panel === panelId)
                }
            }

            //toggle mobile menu
            function toggleMobileMenu(forceOpen = null)
            {
                let nav = document.getElementById("ms_mainNav")
                let toggleButton = document.getElementById("ms_menuToggle")

                if (!nav || !toggleButton)
                {
                    return
                }

                let shouldOpen = forceOpen === null ? !nav.classList.contains("is-open") : forceOpen

                nav.classList.toggle("is-open", shouldOpen)
                toggleButton.setAttribute("aria-expanded", shouldOpen ? "true" : "false")
            }

            function isCompactPhoneLandscape()
            {
                return window.matchMedia("(orientation: landscape) and (max-height: 500px) and (hover: none) and (pointer: coarse)").matches
            }

            function isMobileMenuViewport()
            {
                return window.innerWidth < 600 || isCompactPhoneLandscape()
            }

            function closeMobileMenuOnSmallScreens()
            {
                if (isMobileMenuViewport())
                {
                    toggleMobileMenu(false)
                }
            }

            //close menu on resize
            window.addEventListener("resize", () =>
            {
                if (!isMobileMenuViewport())
                {
                    toggleMobileMenu(false)
                }
            })

            //close menu with with escape key
            document.addEventListener("keydown", (event) =>
            {
                if (event.key === "Escape")
                {
                    toggleMobileMenu(false)
                }
            })  

//Register service worker for offline support PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(() => console.log('Service worker registered'))
            .catch((err) => console.error('Service worker registration failed:', err));
    });
}