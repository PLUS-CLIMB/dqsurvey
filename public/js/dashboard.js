document.addEventListener('DOMContentLoaded', async function() {
    // Load initial data
    const surveys = await fetchSurveys();
    renderMetrics(surveys);
    renderScoreDistributionChart(surveys);
    renderTemporalChart(surveys);
    renderDatasetsList(surveys);

    // Setup event listeners
    document.querySelector('sl-input').addEventListener('sl-change', handleSearch);
    document.querySelector('sl-select[placeholder="Filter by score"]').addEventListener('sl-change', handleSearch);
    document.querySelector('sl-select[placeholder="Sort by"]').addEventListener('sl-change', handleSearch);
});

async function fetchSurveys(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`/api/surveys?${queryParams}`);
    return await response.json();
}

function renderMetrics(surveys) {
    const metricsContainer = document.getElementById('quality-metrics');
    metricsContainer.innerHTML = '';

    if (surveys.length === 0) {
        metricsContainer.innerHTML = '<p>No survey data available</p>';
        return;
    }

    const avgScores = calculateAverageScores(surveys);
    
    const metrics = [
        { title: 'Metadata Quality', value: avgScores.metadata, max: 4 },
        { title: 'Accessibility', value: avgScores.accessibility, max: 4 },
        { title: 'Spatial Precision', value: avgScores.spatial, max: 4 },
        { title: 'Design Quality', value: avgScores.design, max: 4 }
    ];

    metrics.forEach(metric => {
        const metricElement = document.createElement('div');
        metricElement.className = 'metric-item';
        metricElement.innerHTML = `
            <h3>${metric.title}</h3>
            <div class="metric-value">${metric.value.toFixed(1)}</div>
            <sl-progress-bar value="${metric.value}" max="${metric.max}" class="metric-bar"></sl-progress-bar>
            <div class="metric-scale">1 (Low) - ${metric.max} (High)</div>
        `;
        metricsContainer.appendChild(metricElement);
    });
}

function calculateAverageScores(surveys) {
    const totals = surveys.reduce((acc, survey) => {
        return {
            metadata: acc.metadata + survey.metadata_score,
            accessibility: acc.accessibility + survey.accessibility_score,
            spatial: acc.spatial + survey.spatial_score,
            design: acc.design + (
                survey.design_resolution_score + 
                survey.design_coverage_score + 
                survey.design_timeliness_score
            ) / 3
        };
    }, { metadata: 0, accessibility: 0, spatial: 0, design: 0 });

    return {
        metadata: totals.metadata / surveys.length,
        accessibility: totals.accessibility / surveys.length,
        spatial: totals.spatial / surveys.length,
        design: totals.design / surveys.length
    };
}

function renderScoreDistributionChart(surveys) {
    const categories = ['Metadata', 'Accessibility', 'Spatial', 'Design'];
    const series = [1, 2, 3, 4].map(score => {
        return {
            name: `Score ${score}`,
            data: categories.map(category => {
                const count = surveys.filter(survey => {
                    switch(category) {
                        case 'Metadata': return survey.metadata_score === score;
                        case 'Accessibility': return survey.accessibility_score === score;
                        case 'Spatial': return survey.spatial_score === score;
                        case 'Design': 
                            const designScore = Math.round((
                                survey.design_resolution_score + 
                                survey.design_coverage_score + 
                                survey.design_timeliness_score
                            ) / 3);
                            return designScore === score;
                        default: return false;
                    }
                }).length;
                return count;
            })
        };
    });

    const options = {
        series: series,
        chart: {
            type: 'bar',
            height: 350,
            stacked: true,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: { horizontal: true }
        },
        xaxis: { categories: categories },
        yaxis: { title: { text: 'Number of Evaluations' } },
        colors: ['#ff6b6b', '#ffb347', '#4ecdc4', '#66bb6a'],
        legend: { position: 'top' }
    };

    const chart = new ApexCharts(document.querySelector("#score-distribution-chart"), options);
    chart.render();
}

function renderTemporalChart(surveys) {
    if (surveys.length === 0) return;

    // Group by assessment date
    const dateCounts = surveys.reduce((acc, survey) => {
        const date = new Date(survey.assessment_date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const dates = Object.keys(dateCounts).sort();
    const counts = dates.map(date => dateCounts[date]);

    const options = {
        series: [{
            name: 'Evaluations',
            data: counts
        }],
        chart: {
            type: 'area',
            height: 350,
            zoom: { enabled: false }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' },
        xaxis: { categories: dates },
        yaxis: { title: { text: 'Number of Evaluations' } },
        colors: ['#4ecdc4']
    };

    const chart = new ApexCharts(document.querySelector("#temporal-chart"), options);
    chart.render();
}

function renderDatasetsList(surveys) {
    const listContainer = document.getElementById('datasets-list');
    listContainer.innerHTML = '';

    if (surveys.length === 0) {
        listContainer.innerHTML = '<p>No datasets found matching your criteria</p>';
        return;
    }

    surveys.forEach(survey => {
        const avgScore = (
            survey.metadata_score + 
            survey.accessibility_score + 
            survey.spatial_score + 
            (survey.design_resolution_score + survey.design_coverage_score + survey.design_timeliness_score) / 3
        ) / 4;

        const datasetElement = document.createElement('div');
        datasetElement.className = 'dataset-item';
        datasetElement.innerHTML = `
            <div class="dataset-header">
                <h3>${survey.dataset_title}</h3>
                <div class="dataset-score">${avgScore.toFixed(1)}</div>
            </div>
            <div class="dataset-meta">
                <span>${new Date(survey.assessment_date).toLocaleDateString()}</span>
                <span>${survey.evaluator} (${survey.institution})</span>
            </div>
            <p class="dataset-description">${survey.dataset_description}</p>
            <div class="dataset-keywords">
                ${survey.keywords?.map(k => `<sl-tag>${k}</sl-tag>`).join('') || ''}
            </div>
            <div class="dataset-footer">
                <sl-button size="small" variant="text">
                    <sl-icon name="eye" slot="prefix"></sl-icon>
                    View Details
                </sl-button>
            </div>
        `;
        listContainer.appendChild(datasetElement);
    });
}

async function handleSearch() {
    const searchInput = document.querySelector('sl-input').value;
    const scoreFilter = Array.from(document.querySelector('sl-select[placeholder="Filter by score"]').value).map(Number);
    const sortBy = document.querySelector('sl-select[placeholder="Sort by"]').value;

    const minScore = scoreFilter.length ? Math.min(...scoreFilter) : null;
    const maxScore = scoreFilter.length ? Math.max(...scoreFilter) : null;

    const surveys = await fetchSurveys({
        search: searchInput,
        minScore: minScore,
        maxScore: maxScore,
        sort: sortBy
    });

    renderMetrics(surveys);
    renderScoreDistributionChart(surveys);
    renderTemporalChart(surveys);
    renderDatasetsList(surveys);
}