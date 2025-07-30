// visuals.js - Handles all chart rendering and data fetching for analytics

// Chart instances
let statusPieChart;
let reportsOverTimeChart;
let categoryBarChart;

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
    // Load initial data for today
    loadChartData('day');
    
    // Set up time filter buttons
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
    try {
        // Show loading state
        document.querySelectorAll('.chart-container').forEach(container => {
            container.innerHTML = '<div class="text-center py-4"><div class="spinner spinner-primary"></div></div>';
        });
        
        // Fetch data from API
        const response = await fetch(`${API_BASE_URL}/analytics?period=${period}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch analytics data');
        }
        
        const data = await response.json();
        
        // Destroy existing charts if they exist
        if (statusPieChart) statusPieChart.destroy();
        if (reportsOverTimeChart) reportsOverTimeChart.destroy();
        if (categoryBarChart) categoryBarChart.destroy();
        
        // Render charts with new data
        renderStatusPieChart(data.status_distribution);
        renderReportsOverTimeChart(data.reports_over_time);
        renderCategoryBarChart(data.category_distribution);
        
    } catch (error) {
        console.error('Error loading chart data:', error);
        document.querySelectorAll('.chart-container').forEach(container => {
            container.innerHTML = '<div class="text-center text-muted py-4">Error loading chart data</div>';
        });
    }
}

// Render pie chart for status distribution
function renderStatusPieChart(data) {
    const ctx = document.getElementById('statusPieChart').getContext('2d');
    
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
        options: {
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
        }
    });
}

// Render line chart for reports over time
function renderReportsOverTimeChart(data) {
    const ctx = document.getElementById('reportsOverTimeChart').getContext('2d');
    
    // Prepare datasets for each status
    const datasets = [
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
    
    reportsOverTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.date),
            datasets: datasets
        },
        options: {
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
        }
    });
}

// Render bar chart for category distribution
function renderCategoryBarChart(data) {
    const ctx = document.getElementById('categoryBarChart').getContext('2d');
    
    // Sort categories by count (descending)
    const sortedCategories = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Limit to top 10 categories
    
    categoryBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedCategories.map(item => item[0]),
            datasets: [{
                label: 'Reports',
                data: sortedCategories.map(item => item[1]),
                backgroundColor: chartColors.primary,
                borderColor: chartColors.primary,
                borderWidth: 1
            }]
        },
        options: {
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
        }
    });
}

// Initialize charts when dashboard view is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the dashboard
    if (document.getElementById('dashboard-view') && !document.getElementById('dashboard-view').classList.contains('hidden')) {
        // Load Chart.js library dynamically
        loadScript('https://cdn.jsdelivr.net/npm/chart.js', initCharts);
    }
});

// Helper function to load scripts dynamically
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    document.head.appendChild(script);
}
