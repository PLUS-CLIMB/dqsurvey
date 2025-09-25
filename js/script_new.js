// Updated script_new.js with full dynamic behavior & summary
document.addEventListener('DOMContentLoaded', function () {
  
  // ---- COMPREHENSIVE DATA MANAGEMENT SYSTEM ----
  const DataManager = {
    // Initialize data structure
    init() {
      if (!localStorage.getItem('surveyData')) {
        const initialData = {
          section1: {
            basic: {},
            useCase: {},
            spatial: {},
            aoi: {}
          },
          section2: {
            descriptives: {},
            metadata: {},
            keywords: []
          },
          section3: {
            spatialResolution: {},
            spatialCoverage: {},
            timeliness: {}
          },
          section4: {
            conformance: {}
          },
          section5: {
            context: {}
          },
          scores: {
            byGroup: {},
            bySection: {},
            overall: null
          },
          timestamps: {
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
          }
        };
        localStorage.setItem('surveyData', JSON.stringify(initialData));
      }
    },
    
    // Get all survey data
    getData() {
      return JSON.parse(localStorage.getItem('surveyData') || '{}');
    },
    
    // Save data to specific section
    saveSection(sectionKey, subsectionKey, data) {
      const surveyData = this.getData();
      if (!surveyData[sectionKey]) surveyData[sectionKey] = {};
      if (subsectionKey) {
        surveyData[sectionKey][subsectionKey] = { ...surveyData[sectionKey][subsectionKey], ...data };
      } else {
        surveyData[sectionKey] = { ...surveyData[sectionKey], ...data };
      }
      surveyData.timestamps.lastModified = new Date().toISOString();
      localStorage.setItem('surveyData', JSON.stringify(surveyData));
    },
    
    // Get data from specific section
    getSection(sectionKey, subsectionKey) {
      const data = this.getData();
      if (subsectionKey) {
        return data[sectionKey]?.[subsectionKey] || {};
      }
      return data[sectionKey] || {};
    },
    
    // Save scoring data
    saveScore(fieldId, value, scoreGroup, section) {
      const surveyData = this.getData();
      if (!surveyData.scores.byGroup[scoreGroup]) {
        surveyData.scores.byGroup[scoreGroup] = [];
      }
      if (!surveyData.scores.bySection[section]) {
        surveyData.scores.bySection[section] = {};
      }
      
      // Remove existing score for this field
      surveyData.scores.byGroup[scoreGroup] = surveyData.scores.byGroup[scoreGroup].filter(s => s.fieldId !== fieldId);
      
      if (value && value !== '') {
        surveyData.scores.byGroup[scoreGroup].push({
          fieldId: fieldId,
          value: parseInt(value),
          section: section,
          timestamp: new Date().toISOString()
        });
        surveyData.scores.bySection[section][fieldId] = parseInt(value);
      }
      
      this.calculateOverallScore(surveyData);
      surveyData.timestamps.lastModified = new Date().toISOString();
      localStorage.setItem('surveyData', JSON.stringify(surveyData));
    },
    
    // Calculate overall score
    calculateOverallScore(surveyData) {
      const allScores = [];
      Object.values(surveyData.scores.byGroup).forEach(groupScores => {
        groupScores.forEach(score => allScores.push(score.value));
      });
      surveyData.scores.overall = allScores.length ? (allScores.reduce((a, b) => a + b, 0) / allScores.length) : null;
    },
    
    // Collect all form data from current page
    collectCurrentPageData() {
      const currentPage = window.location.pathname.split('/').pop();
      const formData = {};
      
      // Collect all form inputs
      document.querySelectorAll('input, select, textarea').forEach(element => {
        if (element.id && element.value) {
          formData[element.id] = element.value;
        }
      });
      
      // Collect checkboxes and radio buttons
      document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(element => {
        if (element.id) {
          formData[element.id] = element.checked;
        }
      });
      
      // Collect keywords if present
      const keywordTags = document.getElementById('keyword-tags');
      if (keywordTags) {
        const keywords = Array.from(keywordTags.querySelectorAll('.badge')).map(badge => badge.textContent);
        formData.keywords = keywords;
      }
      
      return formData;
    },
    
    // Restore form data to current page
    restoreCurrentPageData() {
      const currentPage = window.location.pathname.split('/').pop();
      let sectionKey = '';
      
      switch (currentPage) {
        case 'section1.html': sectionKey = 'section1'; break;
        case 'section2.html': sectionKey = 'section2'; break;
        case 'section3.html': sectionKey = 'section3'; break;
        case 'section4.html': sectionKey = 'section4'; break;
        case 'section5.html': sectionKey = 'section5'; break;
        default: return;
      }
      
      const sectionData = this.getSection(sectionKey);
      this.populateFormFields(sectionData);
    },
    
    // Populate form fields with saved data
    populateFormFields(data) {
      Object.entries(data).forEach(([subsection, subsectionData]) => {
        if (typeof subsectionData === 'object' && subsectionData !== null) {
          Object.entries(subsectionData).forEach(([fieldId, value]) => {
            const element = document.getElementById(fieldId);
            if (element) {
              if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = value;
              } else {
                element.value = value;
              }
            }
          });
        }
      });
      
      // Restore keywords if present
      if (data.descriptives?.keywords) {
        const keywordTags = document.getElementById('keyword-tags');
        if (keywordTags) {
          keywordTags.innerHTML = '';
          data.descriptives.keywords.forEach(keyword => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-secondary me-1';
            badge.textContent = keyword;
            badge.style.cursor = 'pointer';
            badge.title = 'Click to remove';
            badge.addEventListener('click', () => badge.remove());
            keywordTags.appendChild(badge);
          });
        }
      }
    }
  };
  
  // Initialize data management system
  DataManager.init();
  
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
    // Get evaluation type from current form or saved data
    let isUseCase = false;
    if (evaluationType && evaluationType.value) {
      isUseCase = evaluationType.value === 'use-case-adequacy';
      // Save to localStorage and DataManager
      localStorage.setItem('evaluationType', evaluationType.value);
      DataManager.saveSection('section1', 'basic', { evaluationType: evaluationType.value });
    } else {
      // Check saved data if no current form value
      const savedEvaluationType = localStorage.getItem('evaluationType') || DataManager.getSection('section1', 'basic').evaluationType;
      isUseCase = savedEvaluationType === 'use-case-adequacy';
    }
    
    console.log('toggleUseCase called, isUseCase:', isUseCase);
    
    // Toggle visibility in Section 1
    if (useCaseSection) useCaseSection.style.display = isUseCase ? 'block' : 'none';
    
    // Toggle visibility across all sections
    document.querySelectorAll('.use-case-only').forEach(el => {
      el.style.display = isUseCase ? 'block' : 'none';
      console.log('Setting use-case-only element to:', isUseCase ? 'block' : 'none', el);
    });
    
    document.querySelectorAll('.general-design-only').forEach(el => {
      el.style.display = isUseCase ? 'none' : 'block';
      console.log('Setting general-design-only element to:', isUseCase ? 'none' : 'block', el);
    });
    
    document.querySelectorAll('.general-quality-only').forEach(el => {
      el.style.display = isUseCase ? 'none' : 'block';
      console.log('Setting general-quality-only element to:', isUseCase ? 'none' : 'block', el);
    });
    
    // Auto-fill use-case optimum date into design timeliness subsection
    const opt = document.getElementById('optimumDataCollection');
    const out = document.getElementById('optimumCollectionAuto');
    if (opt && out) {
      out.value = opt.value || '';
    } else {
      // Try to get from saved data
      const savedOptimumDate = localStorage.getItem('optimumDataCollection') || DataManager.getSection('section1', 'useCase').optimumDataCollection;
      if (out && savedOptimumDate) {
        out.value = savedOptimumDate;
      }
    }
    
    // Auto-populate optimal resolution for use-case evaluations
    if (isUseCase) {
      autoPopulateOptimalResolution();
    }
  }
  
  // Initialize use-case toggle based on saved data (for all pages)
  function initializeUseCaseToggle() {
    const savedEvaluationType = localStorage.getItem('evaluationType') || DataManager.getSection('section1', 'basic').evaluationType;
    console.log('Initializing use-case toggle, saved evaluation type:', savedEvaluationType);
    
    // Set the dropdown value if we're on section1
    if (evaluationType && savedEvaluationType) {
      evaluationType.value = savedEvaluationType;
    }
    
    // Apply the visibility toggle
    toggleUseCase();
  }
  
  // Set up event listener only if we're on the page with the dropdown
  if (evaluationType) {
    evaluationType.addEventListener('change', toggleUseCase);
  }
  
  // Always initialize use-case toggle on every page
  initializeUseCaseToggle();
  
  const optimumDate = document.getElementById('optimumDataCollection');
  if (optimumDate) {
    optimumDate.addEventListener('change', () => {
      localStorage.setItem('optimumDataCollection', optimumDate.value);
      DataManager.saveSection('section1', 'useCase', { optimumDataCollection: optimumDate.value });
      toggleUseCase();
    });
  }

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
    const savedDataType = localStorage.getItem('dataType') || (dataType ? dataType.value : '');
    const isRS = savedDataType === 'remote-sensing';
    const show = (id, on) => { const el = document.getElementById(id); if (el) el.style.display = on ? 'block' : 'none'; };
    
    // Section 1 resolution inputs
    show('pixel-size-input', isRS);
    show('grid-size-input', !isRS && savedDataType !== '');
    show('aggregation-level-input', !isRS && savedDataType !== '');
    
    // Section 3 resolution inputs - auto-select based on data type
    toggleSpatialResolutionInputs(savedDataType);
    
    document.querySelectorAll('.remote-sensing-only').forEach(el => el.style.display = isRS ? 'block' : 'none');

    // Accuracy subforms
    show('thematic-accuracy', isRS);
    show('attribute-accuracy', savedDataType === 'gis');
    show('model-performance', savedDataType === 'model-ml' || savedDataType === 'prediction');
    show('data-plausibility', savedDataType === 'survey' || savedDataType === 'other');
  }
  
  // Save data type to localStorage when changed
  if (dataType) {
    dataType.addEventListener('change', () => {
      localStorage.setItem('dataType', dataType.value);
      toggleDataType();
    });
    toggleDataType();
  }
  
  // ---- SPATIAL RESOLUTION INPUTS (Section 3) ----
  function toggleSpatialResolutionInputs(dataTypeValue) {
    const savedDataType = dataTypeValue || localStorage.getItem('dataType');
    const show = (id, on) => { const el = document.getElementById(id); if (el) el.style.display = on ? 'block' : 'none'; };
    
    // Show appropriate resolution input based on data type
    if (savedDataType === 'remote-sensing') {
      show('pixel-resolution', true);
      show('grid-resolution', false);
      show('aggregation-resolution', false);
      show('manual-resolution-selection', false);
    } else if (savedDataType && savedDataType !== '' && savedDataType !== 'other') {
      show('pixel-resolution', false);
      show('grid-resolution', false);
      show('aggregation-resolution', true);
      show('manual-resolution-selection', false);
    } else if (savedDataType === 'other' || !savedDataType) {
      // Show manual selection for 'other' data type or when no data type is set
      show('pixel-resolution', false);
      show('grid-resolution', false);
      show('aggregation-resolution', false);
      show('manual-resolution-selection', true);
    }
    
    // Auto-populate optimal resolution for use-case evaluations
    autoPopulateOptimalResolution();
    
    // Set up automatic scoring suggestion
    setupAutomaticScoring();
  }
  
  // Manual resolution type selection
  document.querySelectorAll('input[name="resolutionType"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const show = (id, on) => { const el = document.getElementById(id); if (el) el.style.display = on ? 'block' : 'none'; };
      show('pixel-resolution', radio.value === 'pixel');
      show('grid-resolution', radio.value === 'grid');
      show('aggregation-resolution', radio.value === 'aggregation');
    });
  });
  
  // Initialize spatial resolution inputs on page load
  toggleSpatialResolutionInputs();
  
  // ---- AUTO-POPULATE OPTIMAL RESOLUTION FOR USE-CASE ----
  function autoPopulateOptimalResolution() {
    const savedEvaluationType = localStorage.getItem('evaluationType') || DataManager.getSection('section1', 'basic').evaluationType;
    const savedDataType = localStorage.getItem('dataType') || DataManager.getSection('section1', 'basic').dataType;
    
    console.log('autoPopulateOptimalResolution called, evaluationType:', savedEvaluationType, 'dataType:', savedDataType);
    
    if (savedEvaluationType === 'use-case-adequacy') {
      const optimalResolutionField = document.getElementById('optimalResolution');
      if (!optimalResolutionField) {
        console.log('optimalResolution field not found');
        return;
      }
      
      let optimalValue = '';
      
      // Get spatial data from both localStorage and DataManager
      const spatialData = DataManager.getSection('section1', 'spatial');
      
      if (savedDataType === 'remote-sensing') {
        const pixelSize = localStorage.getItem('pixelSize') || spatialData.pixelSize;
        if (pixelSize) {
          optimalValue = `${pixelSize} m`;
          console.log('Set optimal pixel size:', optimalValue);
        }
      } else if (savedDataType && savedDataType !== 'other') {
        // For aggregation-based data types (census, survey, administrative, etc.)
        const aggregationLevel = localStorage.getItem('aggregationLevel') || spatialData.aggregationLevel;
        if (aggregationLevel) {
          const levelNames = {
            'household': 'Household level',
            'city': 'City level', 
            'region': 'Regional level',
            'country': 'Country level'
          };
          optimalValue = levelNames[aggregationLevel] || (aggregationLevel.charAt(0).toUpperCase() + aggregationLevel.slice(1));
          console.log('Set optimal aggregation level:', optimalValue);
        }
      } else {
        // For grid-based or other/unknown data types
        const gridSize = localStorage.getItem('gridSize') || spatialData.gridSize;
        if (gridSize) {
          optimalValue = `${gridSize} m`;
          console.log('Set optimal grid size:', optimalValue);
        }
      }
      
      if (optimalValue) {
        optimalResolutionField.value = optimalValue;
        console.log('Populated optimal resolution field with:', optimalValue);
      } else {
        console.log('No optimal resolution value found');
      }
      
      // Trigger spatial deviation calculation
      calcSpatialDeviation();
    }
  }
  
  // ---- AUTOMATIC SCORING SUGGESTION ----
  function setupAutomaticScoring() {
    const pixelInput = document.getElementById('pixelResolutionValue');
    const gridInput = document.getElementById('gridResolutionValue');
    const aggregationSelect = document.getElementById('aggregationResolutionLevel');
    const scoreSelect = document.getElementById('generalResolutionScore');
    const suggestionDiv = document.getElementById('auto-score-suggestion');
    
    function suggestScore() {
      if (!scoreSelect || !suggestionDiv) return;
      
      let suggestedScore = null;
      let explanation = '';
      
      // Check pixel resolution (Remote Sensing)
      if (pixelInput && pixelInput.value && pixelInput.offsetParent !== null) {
        const pixelValue = parseFloat(pixelInput.value);
        if (pixelValue > 30) {
          suggestedScore = 1;
          explanation = 'Pixel size > 30m suggests score 1';
        } else if (pixelValue >= 5) {
          suggestedScore = 2;
          explanation = 'Pixel size 5-30m suggests score 2';
        } else if (pixelValue >= 1) {
          suggestedScore = 3;
          explanation = 'Pixel size 1-5m suggests score 3';
        } else {
          suggestedScore = 4;
          explanation = 'Pixel size < 1m suggests score 4';
        }
      }
      
      // Check grid resolution (Other data types)
      if (gridInput && gridInput.value && gridInput.offsetParent !== null) {
        const gridValue = parseFloat(gridInput.value);
        if (gridValue > 30) {
          suggestedScore = 1;
          explanation = 'Grid size > 30m suggests score 1';
        } else if (gridValue >= 5) {
          suggestedScore = 2;
          explanation = 'Grid size 5-30m suggests score 2';
        } else if (gridValue >= 1) {
          suggestedScore = 3;
          explanation = 'Grid size 1-5m suggests score 3';
        } else {
          suggestedScore = 4;
          explanation = 'Grid size < 1m suggests score 4';
        }
      }
      
      // Check aggregation level
      if (aggregationSelect && aggregationSelect.value && aggregationSelect.offsetParent !== null) {
        switch (aggregationSelect.value) {
          case 'country':
            suggestedScore = 1;
            explanation = 'Country/Federation level suggests score 1';
            break;
          case 'region':
            suggestedScore = 2;
            explanation = 'Region/Province/State level suggests score 2';
            break;
          case 'city':
            suggestedScore = 3;
            explanation = 'City/District/Village level suggests score 3';
            break;
          case 'household':
            suggestedScore = 4;
            explanation = 'Household level suggests score 4';
            break;
        }
      }
      
      // Display suggestion
      if (suggestedScore && explanation) {
        suggestionDiv.style.display = 'block';
        suggestionDiv.innerHTML = `<span class="text-info"><i class="fas fa-lightbulb"></i> Suggested: ${explanation}</span>`;
        suggestionDiv.className = 'form-text text-info';
      } else {
        suggestionDiv.style.display = 'none';
      }
    }
    
    // Add event listeners for automatic scoring suggestion
    if (pixelInput) pixelInput.addEventListener('input', suggestScore);
    if (gridInput) gridInput.addEventListener('input', suggestScore);
    if (aggregationSelect) aggregationSelect.addEventListener('change', suggestScore);
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
  
  // ---- LANGUAGE OTHER OPTION ----
  const languageDropdown = document.getElementById('languageDropdown');
  const languageOtherContainer = document.getElementById('language-other-container');
  if (languageDropdown && languageOtherContainer) {
    languageDropdown.addEventListener('change', () => {
      languageOtherContainer.style.display = (languageDropdown.value === 'other') ? 'block' : 'none';
    });
  }
  
  // ---- DATA TYPE OTHER OPTION ----
  const dataTypeOtherContainer = document.getElementById('datatype-other-container');
  if (dataType && dataTypeOtherContainer) {
    const originalToggleDataType = toggleDataType;
    toggleDataType = function() {
      originalToggleDataType();
      dataTypeOtherContainer.style.display = (dataType.value === 'other') ? 'block' : 'none';
    };
    
    // Also add direct event listener for consistency
    dataType.addEventListener('change', () => {
      dataTypeOtherContainer.style.display = (dataType.value === 'other') ? 'block' : 'none';
    });
  }
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
  const kwBank = ['flood', 'land cover','elevation','precipitation','temperature','population','roads','cloud','DEM','forest','urban'];
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
    const savedDataType = localStorage.getItem('dataType') || DataManager.getSection('section1', 'basic').dataType;
    const isRS = savedDataType === 'remote-sensing';
    const spatialData = DataManager.getSection('section1', 'spatial');
    
    console.log('calcSpatialDeviation called, dataType:', savedDataType, 'spatialData:', spatialData);
    
    const out = document.getElementById('spatialDeviation');
    if (!out) return;
    
    let deviationText = '';
    
    if (isRS) {
      // For remote sensing: compare pixel sizes
      const optimalPixelSize = parseFloat(localStorage.getItem('pixelSize') || spatialData.pixelSize || 'NaN');
      const actualPixelSize = parseFloat(document.getElementById('pixelResolutionValue')?.value || 'NaN');
      
      if (isFinite(optimalPixelSize) && isFinite(actualPixelSize)) {
        const deviation = actualPixelSize - optimalPixelSize;
        deviationText = `${deviation.toFixed(2)} m`;
        console.log('Pixel size deviation calculated:', deviationText);
      }
    } else if (savedDataType && savedDataType !== 'other') {
      // For aggregation-based data: check if levels match
      const optimalAggregation = localStorage.getItem('aggregationLevel') || spatialData.aggregationLevel;
      const actualAggregation = document.getElementById('aggregationResolutionLevel')?.value;
      
      if (optimalAggregation && actualAggregation) {
        if (optimalAggregation === actualAggregation) {
          deviationText = 'Perfect match';
        } else {
          // Map aggregation levels to numeric values for comparison
          const aggregationLevels = { 'household': 4, 'city': 3, 'region': 2, 'country': 1 };
          const optimalLevel = aggregationLevels[optimalAggregation] || 0;
          const actualLevel = aggregationLevels[actualAggregation] || 0;
          const levelDiff = actualLevel - optimalLevel;
          
          if (levelDiff > 0) {
            deviationText = `${levelDiff} levels coarser than optimal`;
          } else {
            deviationText = `${Math.abs(levelDiff)} levels finer than optimal`;
          }
        }
        console.log('Aggregation deviation calculated:', deviationText);
      }
    } else {
      // For grid-based data (if gridSize is available)
      const optimalGridSize = parseFloat(localStorage.getItem('gridSize') || spatialData.gridSize || 'NaN');
      const actualGridSize = parseFloat(document.getElementById('gridResolutionValue')?.value || 'NaN');
      
      if (isFinite(optimalGridSize) && isFinite(actualGridSize)) {
        const deviation = actualGridSize - optimalGridSize;
        deviationText = `${deviation.toFixed(2)} m`;
        console.log('Grid size deviation calculated:', deviationText);
      }
    }
    
    if (deviationText) {
      out.value = deviationText;
    } else {
      out.value = 'Cannot calculate - missing optimal or actual values';
    }
    
    // Auto-populate optimal resolution display
    autoPopulateOptimalResolution();
  }
  
  // Add event listeners for deviation calculation
  ['pixelResolutionValue','gridResolutionValue','aggregationResolutionLevel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === 'aggregationResolutionLevel') {
        el.addEventListener('change', calcSpatialDeviation);
      } else {
        el.addEventListener('input', calcSpatialDeviation);
      }
    }
  });
  
  // Save section 1 resolution values to localStorage when changed
  ['pixelSize','gridSize','aggregationLevel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === 'aggregationLevel') {
        el.addEventListener('change', () => {
          localStorage.setItem(id, el.value);
          calcSpatialDeviation();
        });
      } else {
        el.addEventListener('input', () => {
          localStorage.setItem(id, el.value);
          calcSpatialDeviation();
        });
      }
    }
  });

  // ---- ENHANCED SUMMARY GENERATION ----
  function gatherScores() {
    // Get scores from DataManager (comprehensive across all sections)
    const surveyData = DataManager.getData();
    const storedScores = surveyData.scores || { byGroup: {}, bySection: {}, overall: null };
    
    // Also collect current page scores for immediate feedback
    const currentPageGroups = {};
    document.querySelectorAll('.score-field').forEach(sel => {
      const val = parseInt(sel.value, 10);
      if (!sel.dataset.scoregroup || Number.isNaN(val)) return;
      const g = sel.dataset.scoregroup;
      if (!currentPageGroups[g]) currentPageGroups[g] = [];
      currentPageGroups[g].push(val);
    });
    
    // Merge stored scores with current page scores
    const mergedGroups = { ...storedScores.byGroup };
    Object.entries(currentPageGroups).forEach(([group, scores]) => {
      if (!mergedGroups[group]) mergedGroups[group] = [];
      scores.forEach(score => {
        if (!mergedGroups[group].find(s => s.value === score)) {
          mergedGroups[group].push({ value: score, timestamp: new Date().toISOString() });
        }
      });
    });
    
    // Calculate averages
    const byGroup = {};
    let allVals = [];
    Object.entries(mergedGroups).forEach(([groupName, groupScores]) => {
      const values = groupScores.map(s => s.value || s);
      const avg = values.length ? (values.reduce((a,b)=>a+b,0)/values.length) : null;
      byGroup[groupName] = {
        count: values.length, 
        average: avg,
        scores: values,
        lastUpdated: groupScores.length ? Math.max(...groupScores.map(s => new Date(s.timestamp || Date.now()).getTime())) : null
      };
      allVals = allVals.concat(values);
    });
    
    const overall = allVals.length ? (allVals.reduce((a,b)=>a+b,0)/allVals.length) : null;
    
    return {
      byGroup, 
      bySection: storedScores.bySection,
      overall,
      totalScores: allVals.length,
      spiderChartData: generateSpiderChartData(byGroup)
    };
  }
  
  // Generate spider chart data structure
  function generateSpiderChartData(scoresByGroup) {
    const chartData = {
      labels: [],
      datasets: [{
        label: 'Data Quality Scores',
        data: [],
        backgroundColor: 'rgba(13, 110, 253, 0.2)',
        borderColor: 'rgba(13, 110, 253, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(13, 110, 253, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(13, 110, 253, 1)'
      }]
    };
    
    // Map score groups to readable labels
    const groupLabels = {
      'design-resolution': 'Spatial Resolution',
      'design-coverage': 'Spatial Coverage', 
      'design-timeliness': 'Timeliness',
      'usecase-spatial-fit': 'Spatial Fit',
      'usecase-coverage-fit': 'Coverage Fit',
      'usecase-temporal-fit': 'Temporal Fit',
      'conformance': 'Conformance',
      'context': 'Context',
      'accuracy': 'Accuracy',
      'completeness': 'Completeness',
      'consistency': 'Consistency'
    };
    
    Object.entries(scoresByGroup).forEach(([group, data]) => {
      if (data.average !== null) {
        chartData.labels.push(groupLabels[group] || group);
        chartData.datasets[0].data.push(data.average);
      }
    });
    
    return chartData;
  }

  // Enhanced summary generation with comprehensive data
  function generateSummaryText() {
    const scoreInfo = gatherScores();
    const surveyData = DataManager.getData();
    
    // Get basic information from stored data
    const basicInfo = surveyData.section1?.basic || {};
    const useCaseInfo = surveyData.section1?.useCase || {};
    const descriptives = surveyData.section2?.descriptives || {};
    
    let txt = `DATA QUALITY EVALUATION SUMMARY\n`;
    txt += `=====================================\n\n`;
    
    // Basic Information
    txt += `DATASET INFORMATION:\n`;
    txt += `- Title: ${basicInfo.datasetTitle || 'Not specified'}\n`;
    txt += `- Data Type: ${basicInfo.dataType || 'Not specified'}\n`;
    txt += `- Processing Level: ${basicInfo.dataprocessinglevel || 'Not specified'}\n`;
    txt += `- Evaluation Type: ${basicInfo.evaluationType || 'Not specified'}\n`;
    txt += `- Language: ${descriptives.languageDropdown || 'Not specified'}\n`;
    txt += `- Evaluator: ${basicInfo.evaluatorName || 'Not specified'}\n`;
    txt += `- Organization: ${basicInfo.evaluatorOrg || 'Not specified'}\n\n`;
    
    // Use-case specific information if applicable
    if (basicInfo.evaluationType === 'use-case-adequacy') {
      txt += `USE-CASE SPECIFIC REQUIREMENTS:\n`;
      txt += `- Description: ${useCaseInfo.useCaseDescription || 'Not specified'}\n`;
      txt += `- Optimum Collection Date: ${useCaseInfo.optimumDataCollection || 'Not specified'}\n`;
      
      const spatialInfo = surveyData.section1?.spatial || {};
      if (spatialInfo.pixelSize) txt += `- Optimum Pixel Size: ${spatialInfo.pixelSize}m\n`;
      if (spatialInfo.gridSize) txt += `- Optimum Grid Size: ${spatialInfo.gridSize}m\n`;
      if (spatialInfo.aggregationLevel) txt += `- Optimum Aggregation: ${spatialInfo.aggregationLevel}\n`;
      
      const aoiInfo = surveyData.section1?.aoi || {};
      if (aoiInfo.aoiType) txt += `- AOI Type: ${aoiInfo.aoiType}\n`;
      
      txt += `- Other Requirements: ${useCaseInfo.otherRequirements || 'None specified'}\n\n`;
    }
    
    // Descriptive information
    if (descriptives.identifier || descriptives.datasetDescription) {
      txt += `DATASET DESCRIPTION:\n`;
      if (descriptives.identifier) txt += `- Identifier: ${descriptives.identifier}\n`;
      if (descriptives.datasetDescription) txt += `- Description: ${descriptives.datasetDescription}\n`;
      if (descriptives.keywords && descriptives.keywords.length > 0) {
        txt += `- Keywords: ${descriptives.keywords.join(', ')}\n`;
      }
      txt += `\n`;
    }
    
    // Quality Scores Summary
    txt += `QUALITY ASSESSMENT SCORES:\n`;
    if (scoreInfo.totalScores > 0) {
      txt += `- Total Assessments: ${scoreInfo.totalScores}\n`;
      txt += `- Overall Score: ${scoreInfo.overall?.toFixed(2) || 'N/A'} / 4.0\n\n`;
      
      txt += `Detailed Scores by Category:\n`;
      Object.entries(scoreInfo.byGroup).forEach(([group, data]) => {
        if (data.average !== null) {
          const groupName = group.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          txt += `  • ${groupName}: ${data.average.toFixed(2)}/4.0 (${data.count} assessment${data.count > 1 ? 's' : ''})\n`;
        }
      });
      
      // Performance interpretation
      txt += `\nPERFORMANCE INTERPRETATION:\n`;
      const overall = scoreInfo.overall;
      if (overall >= 3.5) {
        txt += `- Overall Rating: EXCELLENT (${overall.toFixed(2)}/4.0)\n`;
        txt += `- The dataset demonstrates very high quality across evaluated dimensions.\n`;
      } else if (overall >= 2.5) {
        txt += `- Overall Rating: GOOD (${overall.toFixed(2)}/4.0)\n`;
        txt += `- The dataset shows good quality with some areas for improvement.\n`;
      } else if (overall >= 1.5) {
        txt += `- Overall Rating: FAIR (${overall.toFixed(2)}/4.0)\n`;
        txt += `- The dataset has moderate quality with several limitations.\n`;
      } else if (overall > 0) {
        txt += `- Overall Rating: POOR (${overall.toFixed(2)}/4.0)\n`;
        txt += `- The dataset has significant quality issues requiring attention.\n`;
      }
    } else {
      txt += `- No quality scores available yet.\n`;
    }
    
    // Section-specific highlights
    const section3Data = surveyData.section3 || {};
    if (section3Data.spatialCoverage?.aoiCoverage) {
      txt += `\nSPATIAL COVERAGE ANALYSIS:\n`;
      txt += `- AOI Coverage: ${section3Data.spatialCoverage.aoiCoverage}%\n`;
      if (section3Data.spatialCoverage.cloudCover) {
        txt += `- Cloud Cover: ${section3Data.spatialCoverage.cloudCover}%\n`;
      }
    }
    
    // Timestamp information
    txt += `\nEVALUATION METADATA:\n`;
    txt += `- Created: ${new Date(surveyData.timestamps?.created || Date.now()).toLocaleString()}\n`;
    txt += `- Last Modified: ${new Date(surveyData.timestamps?.lastModified || Date.now()).toLocaleString()}\n`;
    
    return txt;
  }
  
  // Generate comprehensive JSON export
  function generateComprehensiveExport() {
    const surveyData = DataManager.getData();
    const scoreInfo = gatherScores();
    
    return {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        evaluationType: surveyData.section1?.basic?.evaluationType || 'unknown'
      },
      dataset: {
        basic: surveyData.section1?.basic || {},
        useCase: surveyData.section1?.useCase || {},
        spatial: surveyData.section1?.spatial || {},
        aoi: surveyData.section1?.aoi || {}
      },
      descriptives: surveyData.section2?.descriptives || {},
      design: {
        spatialResolution: surveyData.section3?.spatialResolution || {},
        spatialCoverage: surveyData.section3?.spatialCoverage || {},
        timeliness: surveyData.section3?.timeliness || {}
      },
      conformance: surveyData.section4 || {},
      context: surveyData.section5 || {},
      qualityScores: {
        summary: scoreInfo,
        spiderChartData: scoreInfo.spiderChartData,
        bySection: scoreInfo.bySection,
        overall: scoreInfo.overall
      },
      timestamps: surveyData.timestamps
    };
  }

  const summaryBtn = document.getElementById('generateSummary');
  const summaryOut = document.getElementById('summary-output');
  if (summaryBtn && summaryOut) {
    summaryBtn.addEventListener('click', () => {
      summaryOut.textContent = generateSummaryText();
    });
  }

  // ---- ENHANCED DOWNLOAD FUNCTIONALITY ----
  const downloadBtn = document.getElementById('downloadSummary');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const comprehensiveData = generateComprehensiveExport();
      const blob = new Blob([JSON.stringify(comprehensiveData, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename with dataset title and timestamp
      const datasetTitle = comprehensiveData.dataset.basic.datasetTitle || 'DataQuality';
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      a.download = `${datasetTitle.replace(/[^a-z0-9]/gi, '_')}_evaluation_${timestamp}.json`;
      
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  
  // Add spider chart data export button if present
  const chartBtn = document.getElementById('exportChartData');
  if (chartBtn) {
    chartBtn.addEventListener('click', () => {
      const scoreInfo = gatherScores();
      const chartData = {
        spiderChart: scoreInfo.spiderChartData,
        chartConfig: {
          type: 'radar',
          options: {
            scales: {
              r: {
                beginAtZero: true,
                max: 4,
                ticks: {
                  stepSize: 1
                }
              }
            },
            plugins: {
              title: {
                display: true,
                text: 'Data Quality Assessment - Spider Chart'
              }
            }
          }
        },
        metadata: {
          exportDate: new Date().toISOString(),
          totalScores: scoreInfo.totalScores,
          overallScore: scoreInfo.overall
        }
      };
      
      const blob = new Blob([JSON.stringify(chartData, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const datasetTitle = DataManager.getData().section1?.basic?.datasetTitle || 'DataQuality';
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      a.download = `${datasetTitle.replace(/[^a-z0-9]/gi, '_')}_spider_chart_${timestamp}.json`;
      
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  
  // ---- AUTOMATIC DATA SAVING SYSTEM ----
  
  // Function to determine section and subsection from field ID
  function getSectionMapping(fieldId) {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Section 1 mappings
    if (currentPage === 'section1.html') {
      if (['datasetTitle', 'evaluatorName', 'evaluatorOrg', 'dataprocessinglevel', 'dataType', 'evaluationType'].includes(fieldId)) {
        return { section: 'section1', subsection: 'basic' };
      }
      if (['useCaseDescription', 'optimumDataCollection', 'otherRequirements'].includes(fieldId)) {
        return { section: 'section1', subsection: 'useCase' };
      }
      if (['pixelSize', 'gridSize', 'aggregationLevel'].includes(fieldId)) {
        return { section: 'section1', subsection: 'spatial' };
      }
      if (['aoiType', 'aoiDropdown', 'minLat', 'maxLat', 'minLon', 'maxLon'].includes(fieldId)) {
        return { section: 'section1', subsection: 'aoi' };
      }
    }
    
    // Section 2 mappings
    if (currentPage === 'section2.html') {
      if (['identifier', 'datasetDescription', 'datasetDescriptionLink', 'metadataDoc', 'languageDropdown', 'languageOtherInput'].includes(fieldId)) {
        return { section: 'section2', subsection: 'descriptives' };
      }
      if (fieldId.includes('metadata') || fieldId.includes('standard')) {
        return { section: 'section2', subsection: 'metadata' };
      }
    }
    
    // Section 3 mappings
    if (currentPage === 'section3.html') {
      if (['pixelResolutionValue', 'gridResolutionValue', 'aggregationResolutionLevel', 'optimalResolution', 'spatialFit', 'spatialDeviation'].includes(fieldId)) {
        return { section: 'section3', subsection: 'spatialResolution' };
      }
      if (['generalExtent', 'generalExtentDetails', 'aoiCoverage', 'cloudCover', 'coverageDeviation'].includes(fieldId)) {
        return { section: 'section3', subsection: 'spatialCoverage' };
      }
      if (['collectionDate', 'temporalResolution', 'latestUpdate', 'temporalExtent', 'temporalValidity', 'optimumCollectionAuto', 'temporalDeviation'].includes(fieldId)) {
        return { section: 'section3', subsection: 'timeliness' };
      }
    }
    
    // Default section mapping
    const sectionMap = {
      'section1.html': 'section1',
      'section2.html': 'section2', 
      'section3.html': 'section3',
      'section4.html': 'section4',
      'section5.html': 'section5'
    };
    
    return { section: sectionMap[currentPage] || 'unknown', subsection: 'general' };
  }
  
  // Auto-save function for form fields
  function autoSaveField(element) {
    if (!element.id) return;
    
    const mapping = getSectionMapping(element.id);
    let value = element.value;
    
    if (element.type === 'checkbox' || element.type === 'radio') {
      value = element.checked;
    }
    
    const data = { [element.id]: value };
    DataManager.saveSection(mapping.section, mapping.subsection, data);
    
    // Also save to individual localStorage keys for backward compatibility
    if (value && value !== '') {
      localStorage.setItem(element.id, value);
    }
  }
  
  // Auto-save function for scoring fields
  function autoSaveScore(element) {
    if (!element.dataset.scoregroup) return;
    
    const currentPage = window.location.pathname.split('/').pop();
    const sectionMap = {
      'section1.html': 'section1',
      'section2.html': 'section2',
      'section3.html': 'section3',
      'section4.html': 'section4',
      'section5.html': 'section5'
    };
    
    const section = sectionMap[currentPage] || 'unknown';
    DataManager.saveScore(element.id, element.value, element.dataset.scoregroup, section);
  }
  
  // Add event listeners to all form elements for auto-saving
  function initializeAutoSave() {
    // Save on input/change for all form elements
    document.querySelectorAll('input, select, textarea').forEach(element => {
      if (element.id) {
        const events = element.type === 'checkbox' || element.type === 'radio' ? ['change'] : ['input', 'change'];
        
        events.forEach(eventType => {
          element.addEventListener(eventType, () => {
            autoSaveField(element);
            
            // Handle scoring fields
            if (element.classList.contains('score-field')) {
              autoSaveScore(element);
            }
          });
        });
      }
    });
    
    // Special handling for keywords
    const kwInput = document.getElementById('keyword-input');
    if (kwInput) {
      kwInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && kwInput.value.trim()) {
          setTimeout(() => {
            const keywords = Array.from(document.querySelectorAll('#keyword-tags .badge')).map(badge => badge.textContent);
            DataManager.saveSection('section2', 'descriptives', { keywords: keywords });
          }, 100);
        }
      });
    }
    
    // Save keywords when tags are clicked/removed
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('badge') && e.target.closest('#keyword-tags')) {
        setTimeout(() => {
          const keywords = Array.from(document.querySelectorAll('#keyword-tags .badge')).map(badge => badge.textContent);
          DataManager.saveSection('section2', 'descriptives', { keywords: keywords });
        }, 100);
      }
    });
  }
  
  // Restore data when page loads
  DataManager.restoreCurrentPageData();
  
  // Initialize auto-saving
  initializeAutoSave();
  
  // Handle accuracy type radio buttons in Section 4
  function handleAccuracyTypeChange() {
    // Hide all accuracy input sections first
    const accuracyInputs = document.querySelectorAll('#accuracy-inputs > div');
    accuracyInputs.forEach(input => {
      input.style.display = 'none';
    });
    
    // Get selected accuracy type
    const selectedType = document.querySelector('input[name="accuracyType"]:checked');
    if (selectedType) {
      const value = selectedType.value;
      
      // Map radio button values to correct div IDs
      const targetIdMap = {
        'thematic': 'thematic-accuracy',
        'attribute': 'attribute-accuracy',
        'model': 'model-performance',
        'plausibility': 'data-plausibility'
      };
      
      const targetId = targetIdMap[value];
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        targetElement.style.display = 'block';
        console.log('Showing accuracy input for:', value, '-> div ID:', targetId);
      } else {
        console.error('Target element not found for accuracy type:', value, '-> expected ID:', targetId);
      }
      
      // Save the selected accuracy type
      DataManager.saveSection('section4', 'conformance', { accuracyType: value });
      console.log('Accuracy type changed to:', value);
    }
  }
  
  // Initialize accuracy type handlers on Section 4
  if (window.location.pathname.includes('section4.html')) {
    document.querySelectorAll('input[name="accuracyType"]').forEach(radio => {
      radio.addEventListener('change', handleAccuracyTypeChange);
    });
    
    // Restore selected accuracy type on page load
    setTimeout(() => {
      const savedData = DataManager.getSection('section4', 'conformance');
      if (savedData && savedData.accuracyType) {
        const radioToCheck = document.querySelector(`input[name="accuracyType"][value="${savedData.accuracyType}"]`);
        if (radioToCheck) {
          radioToCheck.checked = true;
          handleAccuracyTypeChange();
        }
      }
    }, 100);
  }

  // Save data before page unload
  window.addEventListener('beforeunload', () => {
    const formData = DataManager.collectCurrentPageData();
    const currentPage = window.location.pathname.split('/').pop();
    const sectionMap = {
      'section1.html': 'section1',
      'section2.html': 'section2',
      'section3.html': 'section3',
      'section4.html': 'section4',
      'section5.html': 'section5'
    };
    
    const section = sectionMap[currentPage];
    if (section) {
      DataManager.saveSection(section, 'general', formData);
    }
  });
  
});

// Simple submit handler
document.addEventListener('DOMContentLoaded',function(){
  var submitBtn=document.getElementById('submitForm');
  if(submitBtn){ submitBtn.addEventListener('click',function(){alert('Form submitted!');});}
});
