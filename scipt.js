document.addEventListener('DOMContentLoaded', () => {
    // --- Existing SVG setup ---
    const bildfahrplanSvg = document.getElementById('bildfahrplan');
    const svgNS = "http://www.w3.org/2000/svg";

    // --- NEW: Track Map SVG Setup ---
    const trackMapSvg = document.getElementById('trackMap');
    const TRACK_MAP_WIDTH = trackMapSvg.getAttribute('width');
    const TRACK_MAP_HEIGHT = trackMapSvg.getAttribute('height');
    const TRACK_MAP_PADDING = { top: 40, right: 40, bottom: 40, left: 40 }; // Space around track
    const TRACK_WIDTH = TRACK_MAP_WIDTH - TRACK_MAP_PADDING.left - TRACK_MAP_PADDING.right;
    const TRACK_Y_POSITION = TRACK_MAP_HEIGHT / 2; // Center track vertically

    // --- Configuration (Mostly Existing) ---
    const BF_PADDING = { top: 50, right: 50, bottom: 50, left: 100 };
    const BF_SVG_WIDTH = bildfahrplanSvg.getAttribute('width');
    const BF_SVG_HEIGHT = bildfahrplanSvg.getAttribute('height');
    const BF_CHART_WIDTH = BF_SVG_WIDTH - BF_PADDING.left - BF_PADDING.right;
    const BF_CHART_HEIGHT = BF_SVG_HEIGHT - BF_PADDING.top - BF_PADDING.bottom;

    const START_TIME_MINUTES = 6 * 60; // 06:00
    const END_TIME_MINUTES = 10 * 60; // 10:00 (4 hours duration)
    const TOTAL_MINUTES = END_TIME_MINUTES - START_TIME_MINUTES;

    // --- Data (Existing) ---
    const stations = [
        { name: "Station A", distance: 0 },
        { name: "Station B", distance: 30 },
        { name: "Junction X", distance: 55 },
        { name: "Station C", distance: 80 },
        { name: "Station D", distance: 100 }
    ];
    const MAX_DISTANCE = Math.max(...stations.map(s => s.distance));

    const trains = [ /* ... Existing train data ... */
        {
            id: "T1",
            color: "blue",
            schedule: [
                { stationName: "Station A", arrival: null, departure: 10 }, // 06:10
                { stationName: "Station B", arrival: 40, departure: 45 },   // 06:40 - 06:45
                { stationName: "Station C", arrival: 80, departure: 85 },   // 07:20 - 07:25
                { stationName: "Station D", arrival: 110, departure: null }  // 07:50
            ]
        },
        {
            id: "T2",
            color: "green",
            schedule: [
                { stationName: "Station D", arrival: null, departure: 20 }, // 06:20
                { stationName: "Station C", arrival: 45, departure: 50 },   // 06:45 - 06:50
                { stationName: "Station B", arrival: 85, departure: 90 },   // 07:25 - 07:30
                { stationName: "Station A", arrival: 125, departure: null }  // 08:05
            ]
        },
        {
            id: "T3",
            color: "purple",
            schedule: [
                { stationName: "Station A", arrival: null, departure: 60 }, // 07:00
                { stationName: "Station C", arrival: 115, departure: 120 }, // 07:55 - 08:00
                { stationName: "Station D", arrival: 140, departure: null }  // 08:20
            ]
        }
    ];

    // Store references to train icon elements
    const trainIconElements = {}; // { T1: { circle: <circle>, text: <text> }, T2: ... }

    // --- Helper Functions ---
    const getBfTimeX = (minutesSinceStart) => { // Renamed for clarity
        if (minutesSinceStart < 0 || minutesSinceStart > TOTAL_MINUTES) return null;
        return BF_PADDING.left + (minutesSinceStart / TOTAL_MINUTES) * BF_CHART_WIDTH;
    };

    const getBfStationY = (distance) => { // Renamed for clarity
        return BF_PADDING.top + (distance / MAX_DISTANCE) * BF_CHART_HEIGHT;
    };

    // NEW: Helper for Track Map X coordinate from distance
    const getTrackX = (distance) => {
        return TRACK_MAP_PADDING.left + (distance / MAX_DISTANCE) * TRACK_WIDTH;
    };

    const formatTime = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const getStationByName = (name) => {
        return stations.find(s => s.name === name);
    };

    // --- Drawing Functions ---

    // Bildfahrplan Drawing (Existing - Minor Rename)
    const drawBildfahrplanGrid = () => {
        const group = document.createElementNS(svgNS, 'g');
        group.id = 'bf-grid';
        bildfahrplanSvg.appendChild(group); // Add group first

        // Time Grid Lines (Vertical)
        for (let min = 0; min <= TOTAL_MINUTES; min += 30) {
            const x = getBfTimeX(min);
            if (x === null) continue;
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', x); line.setAttribute('y1', BF_PADDING.top);
            line.setAttribute('x2', x); line.setAttribute('y2', BF_PADDING.top + BF_CHART_HEIGHT);
            line.setAttribute('class', 'grid-line');
            group.appendChild(line);

            const timeLabel = document.createElementNS(svgNS, 'text');
            timeLabel.setAttribute('x', x); timeLabel.setAttribute('y', BF_PADDING.top - 10);
            timeLabel.setAttribute('class', 'axis-label');
            timeLabel.textContent = formatTime(START_TIME_MINUTES + min);
            group.appendChild(timeLabel);
        }
        // Station Grid Lines (Horizontal) & Labels
        stations.forEach(station => {
            const y = getBfStationY(station.distance);
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', BF_PADDING.left); line.setAttribute('y1', y);
            line.setAttribute('x2', BF_PADDING.left + BF_CHART_WIDTH); line.setAttribute('y2', y);
            line.setAttribute('class', 'station-line');
            group.appendChild(line);

            const stationLabel = document.createElementNS(svgNS, 'text');
            stationLabel.setAttribute('x', BF_PADDING.left - 10); stationLabel.setAttribute('y', y);
            stationLabel.setAttribute('dy', '0.3em'); stationLabel.setAttribute('class', 'station-label');
            stationLabel.textContent = station.name;
            group.appendChild(stationLabel);
        });
    };

const drawBildfahrplanTrainPaths = () => { // Renamed
        const group = document.createElementNS(svgNS, 'g');
        group.id = 'bf-trainPaths';
        bildfahrplanSvg.appendChild(group); // Add group first

        trains.forEach(train => {
            let prevPoint = null;
            for (let i = 0; i < train.schedule.length; i++) {
                const currentStop = train.schedule[i];
                const currentStation = getStationByName(currentStop.stationName);
                if (!currentStation) continue;

                const currentY = getBfStationY(currentStation.distance);
                const arrivalX = getBfTimeX(currentStop.arrival);
                const departureX = getBfTimeX(currentStop.departure);

                // 1. Draw the travel segment (line from previous departure to current arrival)
                if (prevPoint && arrivalX !== null) {
                    const line = document.createElementNS(svgNS, 'line');
                    line.setAttribute('x1', prevPoint.departureX); line.setAttribute('y1', prevPoint.y);
                    line.setAttribute('x2', arrivalX); line.setAttribute('y2', currentY);
                    line.setAttribute('stroke', train.color); line.setAttribute('class', 'train-path');
                    group.appendChild(line);
                }

                // 2. Draw the stop segment (horizontal line at station if arrival/departure defined)
                if (arrivalX !== null && departureX !== null && arrivalX !== departureX) {
                    const stopLine = document.createElementNS(svgNS, 'line'); // Variable is 'stopLine'
                    stopLine.setAttribute('x1', arrivalX);
                    stopLine.setAttribute('y1', currentY);
                    stopLine.setAttribute('x2', departureX);
                    stopLine.setAttribute('y2', currentY);
                    stopLine.setAttribute('stroke', train.color);
                    // CORRECTED LINE: Use 'stopLine' here
                    stopLine.setAttribute('class', 'train-path');
                    group.appendChild(stopLine);
                }

                // Update previous point *only if* there's a departure time for the next leg
                if (departureX !== null) {
                    prevPoint = { departureX: departureX, y: currentY };
                } else {
                    // If it's the last stop with no departure, reset prevPoint
                    prevPoint = null;
                }
            }
        });
        // No need to explicitly append group again if it was added at the start
    };

    const drawBildfahrplanTimeIndicator = () => { // Renamed
        const line = document.createElementNS(svgNS, 'line');
        line.id = 'timeIndicator';
        line.setAttribute('x1', BF_PADDING.left); line.setAttribute('y1', BF_PADDING.top);
        line.setAttribute('x2', BF_PADDING.left); line.setAttribute('y2', BF_PADDING.top + BF_CHART_HEIGHT);
        bildfahrplanSvg.appendChild(line); // Add to correct SVG
    };

    // --- NEW: Track Map Drawing Functions ---
    const drawTrackMapStatic = () => {
        const group = document.createElementNS(svgNS, 'g');
        group.id = 'track-map-static';
        trackMapSvg.appendChild(group); // Add to correct SVG

        // Draw main track line
        const trackLine = document.createElementNS(svgNS, 'line');
        trackLine.setAttribute('x1', TRACK_MAP_PADDING.left);
        trackLine.setAttribute('y1', TRACK_Y_POSITION);
        trackLine.setAttribute('x2', TRACK_MAP_PADDING.left + TRACK_WIDTH);
        trackLine.setAttribute('y2', TRACK_Y_POSITION);
        trackLine.setAttribute('class', 'track-line');
        group.appendChild(trackLine);

        // Draw station markers and labels
        stations.forEach(station => {
            const x = getTrackX(station.distance);

            // Marker (small rectangle)
            const marker = document.createElementNS(svgNS, 'rect');
            marker.setAttribute('x', x - 3); // Center the rect
            marker.setAttribute('y', TRACK_Y_POSITION - 8);
            marker.setAttribute('width', 6);
            marker.setAttribute('height', 16);
            marker.setAttribute('class', 'track-station-marker');
            group.appendChild(marker);

            // Label
            const label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', TRACK_Y_POSITION + 25); // Position below marker
            label.setAttribute('class', 'track-station-label');
            label.textContent = station.name;
            group.appendChild(label);
        });
    };

    const createTrainIcons = () => {
        const group = document.createElementNS(svgNS, 'g');
        group.id = 'track-map-trains';
        trackMapSvg.appendChild(group); // Add to correct SVG

        trains.forEach(train => {
            // Create a group for circle + text
            const trainGroup = document.createElementNS(svgNS, 'g');
            trainGroup.id = `train-icon-${train.id}`;
            trainGroup.setAttribute('visibility', 'hidden'); // Initially hidden

             // Circle icon
            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cy', TRACK_Y_POSITION);
            circle.setAttribute('r', 8); // Radius of train icon
            circle.setAttribute('fill', train.color);
            circle.setAttribute('class', 'train-icon');

            // Text label inside circle
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('y', TRACK_Y_POSITION); // Centered vertically
            text.setAttribute('class', 'train-icon-label');
            text.textContent = train.id; // Display train ID

            trainGroup.appendChild(circle);
            trainGroup.appendChild(text);
            group.appendChild(trainGroup);

            // Store references
            trainIconElements[train.id] = { group: trainGroup, circle: circle, text: text };
        });
    };


    // --- Simulation Logic ---
    let simulationInterval = null;
    let currentSimMinutes = 0;
    let simulationSpeed = 1;

    // Get references AFTER elements are created
    let timeIndicatorLine = null;
    const currentTimeDisplay = document.getElementById('currentTimeDisplay');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedSlider = document.getElementById('speedSlider');

    const updateSimulation = () => {
        currentSimMinutes += simulationSpeed;

        if (currentSimMinutes > TOTAL_MINUTES) {
            stopSimulation();
            currentSimMinutes = TOTAL_MINUTES;
        }
        if (currentSimMinutes < 0) { // Ensure it doesn't go negative on reset edge case
            currentSimMinutes = 0;
        }

        // --- Update Bildfahrplan Time Indicator ---
        const currentBfX = getBfTimeX(currentSimMinutes);
        if (timeIndicatorLine && currentBfX !== null) { // Check if line exists
            timeIndicatorLine.setAttribute('x1', currentBfX);
            timeIndicatorLine.setAttribute('x2', currentBfX);
        }

        // --- Update Time Display ---
        const displayMinutes = START_TIME_MINUTES + Math.floor(currentSimMinutes);
        currentTimeDisplay.textContent = formatTime(displayMinutes);

        // --- NEW: Update Train Icon Positions on Track Map ---
        trains.forEach(train => {
            const icon = trainIconElements[train.id];
            if (!icon) return; // Skip if icon wasn't created

            let currentX = null;
            let visible = false;

            // Find current segment or stop
            for (let i = 0; i < train.schedule.length; i++) {
                const stop = train.schedule[i];
                const nextStop = train.schedule[i + 1];
                const station = getStationByName(stop.stationName);

                if (!station) continue;

                const departureTime = stop.departure;
                const arrivalTime = stop.arrival;

                // Case 1: Train is stopped at this station
                if (arrivalTime !== null && departureTime !== null &&
                    currentSimMinutes >= arrivalTime && currentSimMinutes < departureTime) {
                    currentX = getTrackX(station.distance);
                    visible = true;
                    break; // Found state
                }

                // Case 2: Train is moving *towards* this station (from previous)
                if (i > 0) {
                    const prevStop = train.schedule[i-1];
                    const prevStation = getStationByName(prevStop.stationName);
                    const prevDepartureTime = prevStop.departure;
                    const currentArrivalTime = stop.arrival; // Arrival at current station

                    if (prevStation && prevDepartureTime !== null && currentArrivalTime !== null &&
                        currentSimMinutes >= prevDepartureTime && currentSimMinutes < currentArrivalTime)
                    {
                        const segmentDuration = currentArrivalTime - prevDepartureTime;
                        const timeIntoSegment = currentSimMinutes - prevDepartureTime;
                        const progress = (segmentDuration > 0) ? (timeIntoSegment / segmentDuration) : 0; // Avoid division by zero

                        const startDist = prevStation.distance;
                        const endDist = station.distance;
                        const segmentDistance = endDist - startDist;

                        const currentDistance = startDist + (segmentDistance * progress);
                        currentX = getTrackX(currentDistance);
                        visible = true;
                        break; // Found state
                    }
                }

                // Case 3: Handle first departure (before first arrival)
                 if (i === 0 && departureTime !== null && currentSimMinutes < departureTime && currentSimMinutes >= 0) {
                     // If it has a departure time but hasn't departed yet, show at start station
                     if (currentSimMinutes < departureTime) {
                        currentX = getTrackX(station.distance);
                        visible = true;
                     }
                      // We don't break here, let Case 2 handle the movement *after* departureTime
                 }

                 // Case 4: Handle last arrival
                 if (i === train.schedule.length - 1 && arrivalTime !== null && departureTime === null && currentSimMinutes >= arrivalTime) {
                     currentX = getTrackX(station.distance);
                     visible = true;
                     break; // Stay at final station
                 }
            }

             // Update SVG element
             if (visible && currentX !== null) {
                 icon.group.setAttribute('visibility', 'visible');
                 icon.circle.setAttribute('cx', currentX);
                 icon.text.setAttribute('x', currentX); // Keep text centered on circle
             } else {
                 icon.group.setAttribute('visibility', 'hidden');
             }

        });
    };

    const startSimulation = () => {
        if (simulationInterval) return;
        // Ensure time indicator line exists (if reset removed it conceptually)
        if (!timeIndicatorLine && document.getElementById('timeIndicator')) {
             timeIndicatorLine = document.getElementById('timeIndicator');
        } else if (!document.getElementById('timeIndicator')) {
            // This case shouldn't happen with current logic, but defensively:
            drawBildfahrplanTimeIndicator();
            timeIndicatorLine = document.getElementById('timeIndicator');
        }

        simulationInterval = setInterval(updateSimulation, 100);
        startBtn.disabled = true;
        stopBtn.disabled = false;
        resetBtn.disabled = true;
    };

    const stopSimulation = () => {
        clearInterval(simulationInterval);
        simulationInterval = null;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        resetBtn.disabled = false;
    };

    const resetSimulation = () => {
        stopSimulation();
        currentSimMinutes = 0;
        // Force update simulation to reset positions before enabling buttons
        updateSimulation();
        startBtn.disabled = false;
        stopBtn.disabled = true;
        resetBtn.disabled = false; // Should always be enabled when stopped
    };

    // --- Initialization and Event Listeners ---
    // Clear SVGs in case of script reload issues during testing
    while (bildfahrplanSvg.firstChild) { bildfahrplanSvg.removeChild(bildfahrplanSvg.firstChild); }
    while (trackMapSvg.firstChild) { trackMapSvg.removeChild(trackMapSvg.firstChild); }


    // Draw Bildfahrplan
    drawBildfahrplanGrid();
    drawBildfahrplanTrainPaths();
    drawBildfahrplanTimeIndicator();
    timeIndicatorLine = document.getElementById('timeIndicator'); // Get ref after creation

    // Draw Track Map
    drawTrackMapStatic();
    createTrainIcons(); // Creates icons but they are hidden initially

    // Set initial state
    resetSimulation(); // Sets time to 0 and updates positions/display

    startBtn.addEventListener('click', startSimulation);
    stopBtn.addEventListener('click', stopSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    speedSlider.addEventListener('input', (e) => {
        simulationSpeed = parseInt(e.target.value, 10);
    });

});
