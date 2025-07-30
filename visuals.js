// visuals.js - Handles all chart rendering and data fetching for analytics

// Chart instances
let statusPieChart = null;
let reportsOverTimeChart = null;
let categoryBarChart = null;

// Colors for charts
const chartColors = {
    primary: '#4361ee',
    success: '#4cc9f0',
    danger: '#f72585',
    warning: '#f8961e',
    info: '#4895ef',
    secondary: '#b5179e',
    dark: '#212529'
};

// Initialize all charts
function initCharts() {
    // Check if we're on the dashboard and canvas elements exist
    if (!isDashboardView()) return;
    
    // Load initial data for today
    loadChartData('day');
    
    // Set up time filter buttons
    setupTimeFilters();
}

// Check if we're on the dashboard view
function isDashboardView() {
    const dashboardView = document.getElementById('dashboard-view');
    return dashboardView && !dashboardView.classList.contains('hidden');
}

// Set up time filter buttons
function setupTimeFilters() {
    document.querySelectorAll('.time-filter button').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons in this group
            this.parentElement.querySelectorAll('button').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get the period and load data
            const period = this.dataset.period;
            loadChartData(period);
        });
    });
}

// Load data for all charts based on time period
async function loadChartData(period) {
    if (!isDashboardView()) return;
    
    try {
        // Show loading state
        showChartLoadingState();
        
        // Fetch data from API
        const data = await fetchChartData(period);
        
        // Destroy existing charts if they exist
        destroyCharts();
        
        // Render charts with new data
        renderCharts(data);
        
    } catch (error) {
        console.error('Error loading chart data:', error);
        showChartErrorState();
    }
}

// Show loading state for charts
function showChartLoadingState() {
    document.querySelectorAll('.chart-container').forEach(container => {
        container.innerHTML = '<div class="text-center py-4"><div class="spinner spinner-primary"></div></div>';
    });
}

// Show error state for charts
function showChartErrorState() {
    document.querySelectorAll('.chart-container').forEach(container => {
        container.innerHTML = '<div class="text-center text-muted py-4">Error loading chart data</div>';
    });
}

// Fetch chart data from API
async function fetchChartData(period) {
    const response = await fetch(`${API_BASE_URL}/analytics?period=${period}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
    }
    
    return await response.json();
}

// Destroy existing charts
function destroyCharts() {
    if (statusPieChart) {
        statusPieChart.destroy();
        statusPieChart = null;
    }
    if (reportsOverTimeChart) {
        reportsOverTimeChart.destroy();
        reportsOverTimeChart = null;
    }
    if (categoryBarChart) {
        categoryBarChart.destroy();
        categoryBarChart = null;
    }
}

// Render all charts
function renderCharts(data) {
    // Clear loading/error states
    document.querySelectorAll('.chart-container').forEach(container => {
        container.innerHTML = '<canvas></canvas>';
    });
    
    // Only try to render if canvas elements exist
    if (document.getElementById('statusPieChart')) {
        renderStatusPieChart(data.status_distribution);
    }
    if (document.getElementById('reportsOverTimeChart')) {
        renderReportsOverTimeChart(data.reports_over_time);
    }
    if (document.getElementById('categoryBarChart')) {
        renderCategoryBarChart(data.category_distribution);
    }
}

// Render pie chart for status distribution
function renderStatusPieChart(data) {
    const canvas = document.getElementById('statusPieChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    statusPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Pending', 'Rejected'],
            datasets: [{
                data: [data.approved, data.pending, data.rejected],
                backgroundColor: [
                    chartColors.success,
                    chartColors.warning,
                    chartColors.danger
                ],
                borderWidth: 1
            }]
        },
        options: getPieChartOptions()
    });
}

// Render line chart for reports over time
function renderReportsOverTimeChart(data) {
    const canvas = document.getElementById('reportsOverTimeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    reportsOverTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.date),
            datasets: getLineChartDatasets(data)
        },
        options: getLineChartOptions()
    });
}

// Render bar chart for category distribution
function renderCategoryBarChart(data) {
    const canvas = document.getElementById('categoryBarChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    categoryBarChart = new Chart(ctx, {
        type: 'bar',
        data: getBarChartData(data),
        options: getBarChartOptions()
    });
}

// Chart configuration functions
function getPieChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '70%'
    };
}

function getLineChartDatasets(data) {
    return [
        {
            label: 'Approved',
            data: data.map(item => item.approved),
            borderColor: chartColors.success,
            backgroundColor: 'rgba(76, 201, 240, 0.1)',
            tension: 0.3,
            fill: true
        },
        {
            label: 'Pending',
            data: data.map(item => item.pending),
            borderColor: chartColors.warning,
            backgroundColor: 'rgba(248, 150, 30, 0.1)',
            tension: 0.3,
            fill: true
        },
        {
            label: 'Rejected',
            data: data.map(item => item.rejected),
            borderColor: chartColors.danger,
            backgroundColor: 'rgba(247, 37, 133, 0.1)',
            tension: 0.3,
            fill: true
        }
    ];
}

function getLineChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };
}

function getBarChartData(data) {
    // Sort categories by count (descending)
    const sortedCategories = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Limit to top 10 categories
    
    return {
        labels: sortedCategories.map(item => item[0]),
        datasets: [{
            label: 'Reports',
            data: sortedCategories.map(item => item[1]),
            backgroundColor: chartColors.primary,
            borderColor: chartColors.primary,
            borderWidth: 1
        }]
    };
}

function getBarChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.parsed.y} reports`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        }
    };
}

// Initialize charts when dashboard view is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load Chart.js first if not already loaded
    if (typeof Chart === 'undefined') {
        loadScript('https://cdn.jsdelivr.net/npm/chart.js', function() {
            // Initialize charts after Chart.js is loaded
            initCharts();
        });
    } else {
        // Chart.js already loaded, initialize directly
        initCharts();
    }
});

// Listen for view changes
document.addEventListener('viewChanged', function() {
    if (isDashboardView()) {
        initCharts();
    }
});

// Helper function to load scripts dynamically
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = function() {
        console.error('Error loading Chart.js');
        showChartErrorState();
    };
    document.head.appendChild(script);
}
