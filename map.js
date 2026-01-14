// Helper function to calculate engineering salary if not provided
function getEngineeringSalary(uni) {
    if (uni.engSalary) return uni.engSalary;
    
    // Engineering schools typically have similar salaries to CS
    const engineeringSchools = [
        'Massachusetts Institute of Technology', 'Rose-Hulman Institute of Technology',
        'Worcester Polytechnic Institute', 'Rensselaer Polytechnic Institute',
        'Stevens Institute of Technology', 'Colorado School of Mines',
        'Illinois Institute of Technology', 'Kettering University',
        'Michigan Technological University', 'Wentworth Institute of Technology',
        'Clarkson University', 'Lawrence Technological University', 'Purdue'
    ];
    
    const isEngineeringSchool = engineeringSchools.some(school => 
        uni.name.toLowerCase().includes(school.toLowerCase().split(' ')[0])
    );
    
    if (isEngineeringSchool) {
        return Math.round(uni.salary * 0.98); // Very similar for top engineering schools
    }
    
    // For top tier schools (salary > 100k), engineering is typically 90-95% of CS
    if (uni.salary > 100000) {
        // Use a hash of the name to get consistent value between 0.90 and 0.95
        let hash = 0;
        for (let i = 0; i < uni.name.length; i++) {
            hash = ((hash << 5) - hash) + uni.name.charCodeAt(i);
            hash = hash & hash;
        }
        const factor = 0.90 + (Math.abs(hash) % 6) * 0.01; // 0.90 to 0.95
        return Math.round(uni.salary * factor);
    }
    
    // For mid-tier schools (salary 70k-100k), engineering is typically 88-93% of CS
    if (uni.salary > 70000) {
        let hash = 0;
        for (let i = 0; i < uni.name.length; i++) {
            hash = ((hash << 5) - hash) + uni.name.charCodeAt(i);
            hash = hash & hash;
        }
        const factor = 0.88 + (Math.abs(hash) % 6) * 0.01; // 0.88 to 0.93
        return Math.round(uni.salary * factor);
    }
    
    // For lower tier schools, engineering is typically 85-90% of CS
    let hash = 0;
    for (let i = 0; i < uni.name.length; i++) {
        hash = ((hash << 5) - hash) + uni.name.charCodeAt(i);
        hash = hash & hash;
    }
    const factor = 0.85 + (Math.abs(hash) % 6) * 0.01; // 0.85 to 0.90
    return Math.round(uni.salary * factor);
}

// Initialize comparison data
let comparisonList = [];
let currentSelectedUni = null;

// Initialize single map
const map = L.map('map', {
    zoomControl: false
}).setView([45.0, -95.0], 4);

// Dark mode tile layer
const darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

darkTileLayer.addTo(map);

// Add zoom controls
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Function to get color based on salary (green = better, red = worse)
function getSalaryColor(salary) {
    if (salary >= 150000) return '#4caf50'; // Green - highest
    if (salary >= 120000) return '#66bb6a'; // Light green
    if (salary >= 100000) return '#81c784'; // Lighter green
    if (salary >= 80000) return '#a5d6a7'; // Very light green
    if (salary >= 70000) return '#c8e6c9'; // Pale green
    if (salary >= 60000) return '#fff9c4'; // Light yellow
    if (salary >= 50000) return '#ffe082'; // Yellow
    if (salary >= 40000) return '#ffb74d'; // Orange
    return '#ef5350'; // Red - lowest
}

// Function to format salary (all in USD)
function formatSalary(salary, isCanadian = false) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(salary);
}

// Function to show info panel
function showInfoPanel(uni) {
    currentSelectedUni = uni;
    const panel = document.getElementById('infoPanel');
    const nameEl = document.getElementById('uniName');
    const salaryEl = document.getElementById('uniSalary');
    const graduatesEl = document.getElementById('uniGraduates');
    
    const csSalary = uni.salary;
    const engSalary = getEngineeringSalary(uni);
    
    nameEl.textContent = uni.name;
    salaryEl.innerHTML = `
        <div style="margin-bottom: 10px;">
            <div style="font-size: 0.9em; color: #aaa; margin-bottom: 3px;">Computer Science</div>
            <div style="color: ${getSalaryColor(csSalary)}">${formatSalary(csSalary, uni.isCanadian)}</div>
        </div>
        <div>
            <div style="font-size: 0.9em; color: #aaa; margin-bottom: 3px;">Engineering (Estimated)</div>
            <div style="color: ${getSalaryColor(engSalary)}">${formatSalary(engSalary, uni.isCanadian)}</div>
        </div>
    `;
    graduatesEl.textContent = `${uni.graduates.toLocaleString()} graduates`;
    
    panel.classList.add('active');
}

// Function to close info panel
function closeInfoPanel() {
    document.getElementById('infoPanel').classList.remove('active');
    currentSelectedUni = null;
}

// Function to add to comparison
function addToComparison() {
    if (!currentSelectedUni) return;
    
    const comparisonItem = {
        name: currentSelectedUni.name,
        csSalary: currentSelectedUni.salary,
        engSalary: getEngineeringSalary(currentSelectedUni),
        graduates: currentSelectedUni.graduates,
        isCanadian: currentSelectedUni.isCanadian
    };
    
    // Check if already in comparison
    if (comparisonList.findIndex(item => item.name === comparisonItem.name) === -1) {
        comparisonList.push(comparisonItem);
        updateComparisonPanel();
        updateComparisonButton();
        updateTableComparisonButtons();
    }
}

// Function to remove from comparison
function removeFromComparison(index) {
    comparisonList.splice(index, 1);
    updateComparisonPanel();
    updateComparisonButton();
    updateTableComparisonButtons();
}

// Function to clear comparison
function clearComparison() {
    comparisonList = [];
    updateComparisonPanel();
    updateComparisonButton();
    updateTableComparisonButtons();
}

// Function to toggle comparison from table
function toggleTableComparison(uniName) {
    const uni = universityData.find(u => u.name === uniName);
    if (!uni) return;
    
    const comparisonItem = {
        name: uni.name,
        csSalary: uni.salary,
        engSalary: getEngineeringSalary(uni),
        graduates: uni.graduates,
        isCanadian: uni.isCanadian
    };
    
    const index = comparisonList.findIndex(item => item.name === comparisonItem.name);
    
    if (index === -1) {
        // Add to comparison
        comparisonList.push(comparisonItem);
    } else {
        // Remove from comparison
        comparisonList.splice(index, 1);
    }
    
    updateComparisonPanel();
    updateComparisonButton();
    updateTableComparisonButtons();
}

// Function to update comparison buttons in table
function updateTableComparisonButtons() {
    document.querySelectorAll('.compare-btn').forEach(btn => {
        const uniName = btn.dataset.uniName;
        const isInComparison = comparisonList.findIndex(item => item.name === uniName) !== -1;
        
        if (isInComparison) {
            btn.classList.add('added');
            btn.textContent = '✓ Added';
        } else {
            btn.classList.remove('added');
            btn.textContent = '+ Compare';
        }
    });
}

// Function to update comparison panel
function updateComparisonPanel() {
    const listEl = document.getElementById('comparisonList');
    const statsEl = document.getElementById('comparisonStats');
    
    if (comparisonList.length === 0) {
        listEl.innerHTML = '<p style="color: #aaa; text-align: center;">No universities selected</p>';
        statsEl.innerHTML = '';
        return;
    }
    
    listEl.innerHTML = comparisonList.map((uni, index) => `
        <div class="comparison-item">
            <button class="remove-btn" onclick="removeFromComparison(${index})">Remove</button>
            <h4>${uni.name}</h4>
            <div style="margin-top: 8px;">
                <div><strong>CS:</strong> <span style="color: ${getSalaryColor(uni.csSalary)}">${formatSalary(uni.csSalary)}</span></div>
                <div><strong>Engineering:</strong> <span style="color: ${getSalaryColor(uni.engSalary)}">${formatSalary(uni.engSalary)}</span></div>
                <div style="font-size: 0.9em; color: #aaa; margin-top: 5px;">${uni.graduates} graduates</div>
            </div>
        </div>
    `).join('');
    
    // Calculate statistics
    if (comparisonList.length > 0) {
        const avgCS = comparisonList.reduce((sum, u) => sum + u.csSalary, 0) / comparisonList.length;
        const avgEng = comparisonList.reduce((sum, u) => sum + u.engSalary, 0) / comparisonList.length;
        const maxCS = Math.max(...comparisonList.map(u => u.csSalary));
        const maxEng = Math.max(...comparisonList.map(u => u.engSalary));
        const minCS = Math.min(...comparisonList.map(u => u.csSalary));
        const minEng = Math.min(...comparisonList.map(u => u.engSalary));
        
        statsEl.innerHTML = `
            <h4 style="margin-bottom: 10px;">Statistics</h4>
            <div style="font-size: 0.9em;">
                <div><strong>Average CS:</strong> <span style="color: ${getSalaryColor(avgCS)}">${formatSalary(avgCS)}</span></div>
                <div><strong>Average Engineering:</strong> <span style="color: ${getSalaryColor(avgEng)}">${formatSalary(avgEng)}</span></div>
                <div style="margin-top: 10px;">
                    <div><strong>Highest CS:</strong> <span style="color: ${getSalaryColor(maxCS)}">${formatSalary(maxCS)}</span></div>
                    <div><strong>Highest Engineering:</strong> <span style="color: ${getSalaryColor(maxEng)}">${formatSalary(maxEng)}</span></div>
                    <div><strong>Lowest CS:</strong> <span style="color: ${getSalaryColor(minCS)}">${formatSalary(minCS)}</span></div>
                    <div><strong>Lowest Engineering:</strong> <span style="color: ${getSalaryColor(minEng)}">${formatSalary(minEng)}</span></div>
                </div>
            </div>
        `;
    }
    
    // Update table buttons
    updateTableComparisonButtons();
}

// Function to update comparison button
function updateComparisonButton() {
    const btn = document.getElementById('toggleComparison');
    btn.textContent = `Show Comparison (${comparisonList.length})`;
    if (comparisonList.length > 0) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
}

// Function to toggle comparison panel
function toggleComparisonPanel() {
    const panel = document.getElementById('comparisonPanel');
    panel.classList.toggle('active');
}

// Create marker cluster group
const markers = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
});

universityData.forEach(uni => {
    const csSalary = uni.salary;
    const engSalary = getEngineeringSalary(uni);
    
    // Use CS salary for marker color (higher of the two)
    const markerSalary = Math.max(csSalary, engSalary);
    
    // Create custom icon with color based on salary
    const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background-color: ${getSalaryColor(markerSalary)};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            cursor: pointer;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    // Create marker
    const marker = L.marker([uni.lat, uni.lng], { icon: icon });
    
    // Create popup content showing both CS and Engineering
    const popupContent = `
        <div style="text-align: center; min-width: 220px; color: #1a1a1a;">
            <h3 style="margin: 0 0 15px 0; color: #4caf50; font-size: 16px;">${uni.name}</h3>
            <div style="margin-bottom: 12px;">
                <div style="font-size: 0.85em; color: #666; margin-bottom: 5px; font-weight: bold;">Computer Science</div>
                <div style="font-size: 22px; font-weight: bold; color: ${getSalaryColor(csSalary)};">
                    ${formatSalary(csSalary, uni.isCanadian)}
                </div>
            </div>
            <div style="margin-bottom: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                <div style="font-size: 0.85em; color: #666; margin-bottom: 5px; font-weight: bold;">Engineering (Estimated)</div>
                <div style="font-size: 22px; font-weight: bold; color: ${getSalaryColor(engSalary)};">
                    ${formatSalary(engSalary, uni.isCanadian)}
                </div>
            </div>
            <div style="color: #666; font-size: 13px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                ${uni.graduates.toLocaleString()} graduates
            </div>
            ${uni.isCanadian ? '<div style="color: #999; font-size: 11px; margin-top: 5px;">(Converted from CAD)</div>' : ''}
        </div>
    `;
    
    marker.bindPopup(popupContent);
    
    // Add click event to show info panel
    marker.on('click', function() {
        showInfoPanel(uni);
    });
    
    // Add marker to cluster group
    markers.addLayer(marker);
});

// Add marker cluster group to map
map.addLayer(markers);

// Close info panel when clicking on map
map.on('click', function() {
    closeInfoPanel();
});

// Fit map to show all markers
map.fitBounds(markers.getBounds(), {
    padding: [50, 50]
});

// Initialize comparison button
updateComparisonButton();

// Table sorting functionality
let currentSort = { column: 'cs', direction: 'desc' };

function sortTable(column, headerElement) {
    const tbody = document.getElementById('tableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Update sort direction
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'desc';
    }
    
    // Remove all sort classes
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Add sort class to current column
    headerElement.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
    
    // Sort rows
    rows.sort((a, b) => {
        let aVal, bVal;
        
        if (column === 'name') {
            aVal = a.dataset.name;
            bVal = b.dataset.name;
            return currentSort.direction === 'asc' 
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        } else if (column === 'cs') {
            aVal = parseFloat(a.dataset.csSalary);
            bVal = parseFloat(b.dataset.csSalary);
        } else if (column === 'eng') {
            aVal = parseFloat(a.dataset.engSalary);
            bVal = parseFloat(b.dataset.engSalary);
        } else if (column === 'rank') {
            aVal = parseInt(a.dataset.rank);
            bVal = parseInt(b.dataset.rank);
        }
        
        if (currentSort.direction === 'asc') {
            return aVal - bVal;
        } else {
            return bVal - aVal;
        }
    });
    
    // Re-append sorted rows
    rows.forEach((row, index) => {
        if (column === 'rank' || currentSort.column === 'rank') {
            row.querySelector('.rank').textContent = index + 1;
        }
        tbody.appendChild(row);
    });
}

// Populate table
function populateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    // Create array with both salaries
    const tableData = universityData.map(uni => ({
        name: uni.name,
        csSalary: uni.salary,
        engSalary: getEngineeringSalary(uni),
        graduates: uni.graduates,
        isCanadian: uni.isCanadian
    }));
    
    // Sort by CS salary descending by default
    tableData.sort((a, b) => b.csSalary - a.csSalary);
    
    tableData.forEach((uni, index) => {
        const row = document.createElement('tr');
        row.dataset.name = uni.name;
        row.dataset.csSalary = uni.csSalary;
        row.dataset.engSalary = uni.engSalary;
        row.dataset.rank = index + 1;
        
        const isInComparison = comparisonList.findIndex(item => item.name === uni.name) !== -1;
        
        row.innerHTML = `
            <td class="rank">${index + 1}</td>
            <td>${uni.name}${uni.isCanadian ? ' <span style="color: #aaa; font-size: 0.9em;">(CA)</span>' : ''}</td>
            <td class="salary-cell" style="color: ${getSalaryColor(uni.csSalary)}">${formatSalary(uni.csSalary, uni.isCanadian)}</td>
            <td class="salary-cell" style="color: ${getSalaryColor(uni.engSalary)}">${formatSalary(uni.engSalary, uni.isCanadian)} <span style="color: #aaa; font-size: 0.85em;">(est.)</span></td>
            <td>${uni.graduates.toLocaleString()}</td>
            <td>
                <button class="compare-btn ${isInComparison ? 'added' : ''}" 
                        onclick="event.stopPropagation(); toggleTableComparison('${uni.name.replace(/'/g, "\\'")}')"
                        data-uni-name="${uni.name}">
                    ${isInComparison ? '✓ Added' : '+ Compare'}
                </button>
            </td>
        `;
        
        // Add click handler to select university (but not on the button)
        row.style.cursor = 'pointer';
        row.addEventListener('click', (e) => {
            // Don't trigger if clicking the compare button
            if (e.target.closest('.compare-btn')) return;
            
            const uniData = universityData.find(u => u.name === uni.name);
            if (uniData) {
                showInfoPanel(uniData);
                // Scroll to map
                document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        
        tbody.appendChild(row);
    });
    
    // Set initial sort indicator
    document.querySelector('th[onclick="sortTable(\'cs\')"]').classList.add('sort-desc');
}

// Initialize table
populateTable();
