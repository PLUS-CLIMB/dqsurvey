// Updated script_new.js with full dynamic behavior & summary
document.addEventListener('DOMContentLoaded', function () {
  // ---- Inject overlay and fade-in effect ----
  // Add fade-in effect to main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.add('fade-in');
  }

  // Add overlay if not present
  if (!document.querySelector('.overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.insertBefore(overlay, document.body.firstChild);
  }

  // ---- CONFORMANCE TOGGLE (Primary vs Products) - with localStorage persistence ----
  const dataProcessingLevel = document.getElementById('dataprocessinglevel');
  
  function applyConformanceVisibility(processingLevel) {
    // Show/hide conformance section and nav bar item
    const conf = document.getElementById('conformance');
    const toc = document.getElementById('conformance-toc');
    const navConf = document.getElementById('nav-conformance');
    
    console.log('applyConformanceVisibility called with:', processingLevel);
    console.log('conformance element:', conf);
    console.log('toc element:', toc);
    console.log('navConf element:', navConf);
    
    if (processingLevel === 'primary') {
      console.log('Hiding conformance (primary data selected)');
      if (conf) conf.classList.add('d-none');
      if (toc) toc.classList.add('d-none');
      if (navConf) navConf.classList.add('d-none');
    } else if (processingLevel === 'products' || processingLevel === '') {
      console.log('Showing conformance (data products selected or empty)');
      if (conf) conf.classList.remove('d-none');
      if (toc) toc.classList.remove('d-none');
      if (navConf) navConf.classList.remove('d-none');
    }
  }
  
  function toggleConformance() {
    if (!dataProcessingLevel) return;
    
    const selectedValue = dataProcessingLevel.value;
    console.log('toggleConformance called, selected value:', selectedValue);
    
    // Save to localStorage
    if (selectedValue) {
      localStorage.setItem('dataProcessingLevel', selectedValue);
    } else {
      localStorage.removeItem('dataProcessingLevel');
    }
    
    // Apply visibility
    applyConformanceVisibility(selectedValue);
    
    // Update navigation buttons immediately
    updateNavigationButtons();
  }
  
  // Initialize conformance visibility on page load (for all pages)
  function initializeConformanceVisibility() {
    const savedProcessingLevel = localStorage.getItem('dataProcessingLevel');
    console.log('Initializing conformance visibility, saved value:', savedProcessingLevel);
    
    // Apply the saved setting
    if (savedProcessingLevel) {
      applyConformanceVisibility(savedProcessingLevel);
      
      // Also set the dropdown value if we're on section1
      if (dataProcessingLevel) {
        dataProcessingLevel.value = savedProcessingLevel;
      }
    } else {
      // Default to showing conformance if no selection made
      applyConformanceVisibility('');
    }
  }
  
  // Set up event listener only if we're on the page with the dropdown
  if (dataProcessingLevel) {
    dataProcessingLevel.addEventListener('change', toggleConformance);
  }
  
  // Always initialize conformance visibility on every page
  initializeConformanceVisibility();

  // ---- SMART NAVIGATION: Skip conformance section when hidden ----
  function updateNavigationButtons() {
    const savedProcessingLevel = localStorage.getItem('dataProcessingLevel');
    const isConformanceHidden = savedProcessingLevel === 'primary';
    
    console.log('updateNavigationButtons called, isConformanceHidden:', isConformanceHidden);
    
    // Update navigation buttons to skip section4 if conformance is hidden
    const currentPage = window.location.pathname.split('/').pop();
    
    // Update "Next" buttons to skip section4 if conformance is hidden
    if (currentPage === 'section3.html' && isConformanceHidden) {
      // Look for next button that goes to section4
      const nextBtns = document.querySelectorAll('a[href="section4.html"]');
      nextBtns.forEach(btn => {
        if (btn.classList.contains('btn-next') || btn.textContent.includes('Next')) {
          btn.href = 'section5.html';
          if (btn.textContent.includes('Next Section')) {
            btn.innerHTML = btn.innerHTML.replace('Next Section', 'Skip to Context');
          }
          console.log('Updated next button on section3 to skip to section5');
        }
      });
    }
    
    // Update "Previous" buttons to skip section4 if conformance is hidden
    if (currentPage === 'section5.html' && isConformanceHidden) {
      // Look for previous button that goes to section4
      const prevBtns = document.querySelectorAll('a[href="section4.html"]');
      prevBtns.forEach(btn => {
        if (btn.classList.contains('btn-previous') || btn.textContent.includes('Previous')) {
          btn.href = 'section3.html';
          if (btn.textContent.includes('Previous')) {
            btn.innerHTML = btn.innerHTML.replace('Previous', 'Back to Design');
          }
          console.log('Updated previous button on section5 to go back to section3');
        }
      });
    }
    
    // Reset navigation buttons if conformance is shown
    if (!isConformanceHidden) {
      // Reset section3 next button
      if (currentPage === 'section3.html') {
        const nextBtns = document.querySelectorAll('a[href="section5.html"]');
        nextBtns.forEach(btn => {
          if (btn.classList.contains('btn-next')) {
            btn.href = 'section4.html';
            btn.innerHTML = btn.innerHTML.replace('Skip to Context', 'Next Section');
          }
        });
      }
      
      // Reset section5 previous button
      if (currentPage === 'section5.html') {
        const prevBtns = document.querySelectorAll('a[href="section3.html"]');
        prevBtns.forEach(btn => {
          if (btn.classList.contains('btn-previous')) {
            btn.href = 'section4.html';
            btn.innerHTML = btn.innerHTML.replace('Back to Design', 'Previous');
          }
        });
      }
    }
  }
  
  // Call navigation update after conformance initialization
  updateNavigationButtons();

  // ---- SECTION 4 ACCESS CONTROL ----
  // If user tries to access section4 directly when conformance should be hidden
  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage === 'section4.html') {
    const savedProcessingLevel = localStorage.getItem('dataProcessingLevel');
    if (savedProcessingLevel === 'primary') {
      // Show warning and redirect
      const conformanceSection = document.getElementById('conformance');
      if (conformanceSection) {
        conformanceSection.innerHTML = `
          <div class="alert alert-warning" role="alert">
            <h4 class="alert-heading">Section Not Available</h4>
            <p>The Conformance section is not applicable for Primary Data. You selected "Primary Data" in the Initial Information section.</p>
            <hr>
            <p class="mb-0">
              <a href="section1.html" class="btn btn-primary">Go back to Initial Info</a>
              <a href="section3.html" class="btn btn-secondary">Continue to Design</a>
              <a href="section5.html" class="btn btn-secondary">Skip to Context</a>
            </p>
          </div>
        `;
      }
    }
  }

  // ---- USE-CASE vs GENERAL ----
  const evaluationType = document.getElementById('evaluationType');
  const useCaseSection = document.getElementById('use-case-section');
  function toggleUseCase() {
    const isUseCase = evaluationType && evaluationType.value === 'use-case-adequacy';
    if (useCaseSection) useCaseSection.style.display = isUseCase ? 'block' : 'none';
    document.querySelectorAll('.use-case-only').forEach(el => el.style.display = isUseCase ? 'block' : 'none');
    document.querySelectorAll('.general-design-only').forEach(el => el.style.display = isUseCase ? 'none' : 'block');
    // auto-fill use-case optimum date into design timeliness subsection
    const opt = document.getElementById('optimumDataCollection');
    const out = document.getElementById('optimumCollectionAuto');
    if (opt && out) out.value = opt.value || '';
  }
  if (evaluationType) {
    evaluationType.addEventListener('change', toggleUseCase);
    toggleUseCase();
  }
  const optimumDate = document.getElementById('optimumDataCollection');
  if (optimumDate) optimumDate.addEventListener('change', toggleUseCase);

  // ---- AOI METHOD TOGGLE ----
  const aoiType = document.getElementById('aoiType');
  function toggleAOI() {
    const val = aoiType ? aoiType.value : '';
    ['dropdown','coordinates','upload'].forEach(type => {
      const el = document.getElementById(`aoi-${type}`);
      if (el) el.style.display = (val === type) ? 'block' : 'none';
    });
  }
  if (aoiType) {
    aoiType.addEventListener('change', toggleAOI);
    toggleAOI();
  }

  // ---- DATA TYPE TOGGLE: resolution inputs, RS-only blocks, accuracy inputs ----
  const dataType = document.getElementById('dataType');
  function toggleDataType() {
    const isRS = dataType && dataType.value === 'remote-sensing';
    const show = (id, on) => { const el = document.getElementById(id); if (el) el.style.display = on ? 'block' : 'none'; };
    show('pixel-size-input', isRS);
    show('grid-size-input', !isRS);
    show('aggregation-level-input', !isRS);
    document.querySelectorAll('.remote-sensing-only').forEach(el => el.style.display = isRS ? 'block' : 'none');

    // Accuracy subforms
    show('thematic-accuracy', isRS);
    show('attribute-accuracy', dataType && dataType.value === 'gis');
    show('model-performance', dataType && (dataType.value === 'model-ml' || dataType.value === 'prediction'));
    show('data-plausibility', dataType && (dataType.value === 'survey' || dataType.value === 'other'));
  }
  if (dataType) {
    dataType.addEventListener('change', toggleDataType);
    toggleDataType();
  }

  // ---- METADATA: Conformance -> show standards; also auto-fill format standards ----
  const metadataConformance = document.getElementById('metadata-conformance');
  function handleMetaConf() {
    const val = metadataConformance ? metadataConformance.value : '';
    const fieldset = document.getElementById('metadata-standards');
    if (fieldset) fieldset.style.display = (val === 'yes') ? 'block' : 'none';
    const formatYes = document.getElementById('formatYes');
    if (formatYes) formatYes.checked = (val === 'yes');
  }
  if (metadataConformance) {
    metadataConformance.addEventListener('change', handleMetaConf);
    handleMetaConf();
  }

  // Metadata 'Other' standard control
  const metaOther = document.getElementById('metadata-other');
  const metaOtherContainer = document.getElementById('metadata-other-container');
  const addOtherBtn = document.getElementById('add-other-standard');
  if (metaOther && metaOtherContainer) {
    metaOther.addEventListener('change', () => {
      metaOtherContainer.style.display = metaOther.checked ? 'block' : 'none';
    });
  }
  if (addOtherBtn && metaOtherContainer) {
    addOtherBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-control mt-2';
      input.name = 'metadata-standard-other[]';
      input.placeholder = 'Describe other standard';
      metaOtherContainer.appendChild(input);
    });
  }

  // ---- ACCESS RESTRICTIONS: show details when 'Other' is checked ----
  const accessOther = document.getElementById('accessOther');
  const accessOtherDetails = document.getElementById('accessOtherDetails');
  function toggleAccessOther() {
    if (accessOtherDetails) accessOtherDetails.style.display = accessOther && accessOther.checked ? 'block' : 'none';
  }
  if (accessOther) {
    accessOther.addEventListener('change', toggleAccessOther);
    toggleAccessOther();
  }

  // ---- API AVAILABILITY: show details when not manual ----
  document.querySelectorAll('.api-radio').forEach(r => {
    r.addEventListener('change', () => {
      const details = document.getElementById('apiDetails');
      if (details) details.style.display = (r.value !== 'manual' && r.checked) ? 'block' : (r.value === 'manual' && r.checked) ? 'none' : details.style.display;
    });
  });

  // ---- CRS Other ----
  const crsSelect = document.getElementById('crsSelect');
  const crsOtherDetails = document.getElementById('crsOtherDetails');
  function toggleCRSOther() {
    if (!crsSelect || !crsOtherDetails) return;
    crsOtherDetails.style.display = (crsSelect.value === 'Other') ? 'block' : 'none';
  }
  if (crsSelect) {
    crsSelect.addEventListener('change', toggleCRSOther);
    toggleCRSOther();
  }

  // ---- Inconsistency & Uncertainty 'Other' ----
  const inconsistencyOther = document.getElementById('inconsistencyOther');
  const inconsistencyOtherText = document.getElementById('inconsistencyOtherText');
  if (inconsistencyOther && inconsistencyOtherText) {
    inconsistencyOther.addEventListener('change', () => {
      inconsistencyOtherText.style.display = inconsistencyOther.checked ? 'block' : 'none';
    });
  }
  const uncertaintyOther = document.getElementById('uncertaintyOther');
  const uncertaintyOtherText = document.getElementById('uncertaintyOtherText');
  if (uncertaintyOther && uncertaintyOtherText) {
    uncertaintyOther.addEventListener('change', () => {
      uncertaintyOtherText.style.display = uncertaintyOther.checked ? 'block' : 'none';
    });
  }

  // ---- Strengths / Limitations / Constraints add-remove ----
  function addListHandlers(wrapperId, addClass, removeClass, placeholder) {
    const wrap = document.getElementById(wrapperId);
    if (!wrap) return;
    wrap.addEventListener('click', (e) => {
      if (e.target.classList.contains(addClass)) {
        const container = document.createElement('div');
        container.className = 'input-group mb-2';
        container.innerHTML = `<input type="text" class="form-control" placeholder="${placeholder}">
          <button type="button" class="btn btn-outline-danger ${removeClass}">–</button>`;
        wrap.appendChild(container);
      }
      if (e.target.classList.contains(removeClass)) {
        e.target.parentElement.remove();
      }
    });
  }
  addListHandlers('strength-list','add-strength','remove-strength','Additional Strength');
  addListHandlers('limitation-list','add-limitation','remove-limitation','Additional Limitation');
  addListHandlers('constraint-list','add-constraint','remove-constraint','Additional Constraint');

  // ---- Input Data dynamic rows + autocomplete ----
  const inputDataList = document.getElementById('input-data-list');
  const datasetSuggestions = [
    "Sentinel-1", "Sentinel-2", "MODIS", "Landsat 8", "Landsat 9",
    "VIIRS", "Copernicus DEM", "ASTER", "SRTM", "CHIRPS", "GPM"
  ];
  function createInputDataRow() {
    const row = document.createElement('div');
    row.className = 'row g-2 mb-2 align-items-center input-data-entry';
    row.innerHTML = `
      <div class="col-md-4 position-relative">
        <input type="text" class="form-control dataset-name" name="inputName[]" placeholder="Dataset Name" autocomplete="off">
        <ul class="list-group position-absolute w-100 z-3 suggestion-list" style="top: 100%; max-height: 150px; overflow-y: auto;"></ul>
      </div>
      <div class="col-md-4">
        <input type="url" class="form-control" name="inputLink[]" placeholder="Dataset Link">
      </div>
      <div class="col-md-3">
        <select class="form-select" name="inputScore[]">
          <option value="">Score</option>
          <option value="1">1 - Low</option>
          <option value="2">2 - Medium</option>
          <option value="3">3 - High</option>
        </select>
      </div>
      <div class="col-md-1">
        <button type="button" class="btn btn-outline-danger remove-input-data">–</button>
      </div>`;
    return row;
  }
  if (inputDataList) {
    inputDataList.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-input-data')) {
        inputDataList.appendChild(createInputDataRow());
      }
      if (e.target.classList.contains('remove-input-data')) {
        e.target.closest('.input-data-entry').remove();
      }
    });

    inputDataList.addEventListener('input', (e) => {
      if (e.target.classList.contains('dataset-name')) {
        const input = e.target;
        const list = input.nextElementSibling;
        const value = input.value.toLowerCase();
        list.innerHTML = '';
        if (!value) return;
        const matches = datasetSuggestions.filter(ds => ds.toLowerCase().startsWith(value));
        matches.forEach(match => {
          const li = document.createElement('li');
          li.className = 'list-group-item list-group-item-action';
          li.textContent = match;
          li.addEventListener('click', () => { input.value = match; list.innerHTML = ''; });
          list.appendChild(li);
        });
      }
    });
  }
  document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('dataset-name')) {
      document.querySelectorAll('.suggestion-list').forEach(el => el.innerHTML = '');
    }
  });

  // ---- Keyword tags simple helper ----
  const kwInput = document.getElementById('keyword-input');
  const kwTags = document.getElementById('keyword-tags');
  const kwSuggest = document.getElementById('suggestions');
  const kwBank = ['land cover','elevation','precipitation','temperature','population','roads','cloud','DEM','forest','urban'];
  function addTag(text) {
    const badge = document.createElement('span');
    badge.className = 'badge bg-secondary me-1';
    badge.textContent = text;
    badge.style.cursor = 'pointer';
    badge.title = 'Click to remove';
    badge.addEventListener('click', () => badge.remove());
    kwTags.appendChild(badge);
  }
  if (kwInput && kwSuggest) {
    kwInput.addEventListener('input', () => {
      const v = kwInput.value.trim().toLowerCase();
      kwSuggest.style.display = v ? 'block' : 'none';
      kwSuggest.innerHTML = '';
      if (!v) return;
      kwBank.filter(k => k.startsWith(v)).forEach(k => {
        const li = document.createElement('li');
        li.className = 'list-group-item list-group-item-action';
        li.textContent = k;
        li.addEventListener('click', () => { addTag(k); kwSuggest.style.display='none'; kwInput.value=''; });
        kwSuggest.appendChild(li);
      });
    });
    kwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && kwInput.value.trim()) {
        addTag(kwInput.value.trim()); kwInput.value=''; e.preventDefault();
      }
    });
    document.addEventListener('click', (e) => {
      if (!kwSuggest.contains(e.target) && e.target !== kwInput) kwSuggest.style.display = 'none';
    });
  }

  // ---- Auto calculations (coverage & deviations) ----
  function calcCoverageDeviation() {
    const cov = parseFloat(document.getElementById('aoiCoverage')?.value || 'NaN');
    const out = document.getElementById('coverageDeviation');
    if (isFinite(cov) && out) out.value = `${Math.max(0, 100 - cov).toFixed(1)} %`;
  }
  const aoiCoverage = document.getElementById('aoiCoverage');
  if (aoiCoverage) aoiCoverage.addEventListener('input', calcCoverageDeviation);

  function calcTemporalDeviation() {
    const opt = document.getElementById('optimumDataCollection')?.value;
    const latest = document.getElementById('latestUpdate')?.value;
    const out = document.getElementById('temporalDeviation');
    if (!opt || !latest || !out) return;
    const d1 = new Date(opt), d2 = new Date(latest);
    const ms = Math.abs(d2 - d1);
    const days = Math.round(ms / (1000*60*60*24));
    out.value = `${days} days`;
  }
  const latestUpdate = document.getElementById('latestUpdate');
  if (latestUpdate) latestUpdate.addEventListener('change', calcTemporalDeviation);
  if (optimumDate) optimumDate.addEventListener('change', calcTemporalDeviation);

  function calcSpatialDeviation() {
    const isRS = dataType && dataType.value === 'remote-sensing';
    const opt = isRS ? parseFloat(document.getElementById('pixelSize')?.value || 'NaN')
                     : parseFloat(document.getElementById('gridSize')?.value || 'NaN');
    const actual = isRS ? parseFloat(document.getElementById('pixelResolutionValue')?.value || 'NaN')
                        : parseFloat(document.getElementById('gridResolutionValue')?.value || 'NaN');
    const out = document.getElementById('spatialDeviation');
    if (isFinite(opt) && isFinite(actual) && out) out.value = `${(actual - opt).toFixed(2)} m`;
    const optimalOut = document.getElementById('optimalResolution');
    if (optimalOut) optimalOut.value = isFinite(opt) ? `${opt} m` : '';
  }
  ['pixelSize','gridSize','pixelResolutionValue','gridResolutionValue'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcSpatialDeviation);
  });

  // ---- SUMMARY GENERATION ----
  function gatherScores() {
    const groups = {};
    document.querySelectorAll('.score-field').forEach(sel => {
      const val = parseInt(sel.value, 10);
      if (!sel.dataset.scoregroup) return;
      const g = sel.dataset.scoregroup;
      if (!groups[g]) groups[g] = [];
      if (!Number.isNaN(val)) groups[g].push(val);
    });
    const byGroup = {};
    let allVals = [];
    Object.keys(groups).forEach(k => {
      const arr = groups[k];
      const avg = arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length) : null;
      byGroup[k] = {count: arr.length, average: avg};
      allVals = allVals.concat(arr);
    });
    const overall = allVals.length ? (allVals.reduce((a,b)=>a+b,0)/allVals.length) : null;
    return {byGroup, overall};
  }

  function generateSummaryText() {
    const scoreInfo = gatherScores();
    const lang = document.getElementById('languageDropdown')?.value || '';
    const title = document.getElementById('datasetTitle')?.value || '';
    const evalType = document.getElementById('evaluationType')?.options[document.getElementById('evaluationType').selectedIndex]?.text || '';
    const type = document.getElementById('dataType')?.options[document.getElementById('dataType').selectedIndex]?.text || '';

    let txt = `Dataset: ${title}\nEvaluation: ${evalType}\nData Type: ${type}\nLanguage: ${lang}\n\n`;
    txt += `Scores (avg by group):\n`;
    Object.entries(scoreInfo.byGroup).forEach(([k,v]) => {
      if (v.average != null) txt += ` - ${k}: ${v.average.toFixed(2)} (n=${v.count})\n`; 
    });
    if (scoreInfo.overall != null) txt += `\nOverall score: ${scoreInfo.overall.toFixed(2)} / 4\n`;

    // Highlight key adequacy indicators if use-case
    if (evaluationType && evaluationType.value === 'use-case-adequacy') {
      const cov = document.getElementById('aoiCoverage')?.value;
      const cloud = document.getElementById('cloudCover')?.value;
      if (cov) txt += `\nAOI coverage: ${cov}%\n`;
      if (cloud && (dataType && dataType.value === 'remote-sensing')) txt += `Cloud cover/haziness: ${cloud}%\n`;
    }
    return txt;
  }

  const summaryBtn = document.getElementById('generateSummary');
  const summaryOut = document.getElementById('summary-output');
  if (summaryBtn && summaryOut) {
    summaryBtn.addEventListener('click', () => {
      summaryOut.textContent = generateSummaryText();
    });
  }

  // ---- DOWNLOAD JSON ----
  const downloadBtn = document.getElementById('downloadSummary');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const data = {
        datasetTitle: document.getElementById('datasetTitle')?.value || '',
        evaluationType: document.getElementById('evaluationType')?.value || '',
        dataType: document.getElementById('dataType')?.value || '',
        scores: gatherScores(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'survey-summary.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
});

// Simple submit handler
document.addEventListener('DOMContentLoaded',function(){
  var submitBtn=document.getElementById('submitForm');
  if(submitBtn){ submitBtn.addEventListener('click',function(){alert('Form submitted!');});}
});
