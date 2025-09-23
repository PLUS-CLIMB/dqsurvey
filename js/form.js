document.addEventListener('DOMContentLoaded', function() {
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
    // Section visibility logic for data type selection
    const dataTypeSelect = document.getElementById('dataprocessinglevel');
    const sectionIds = [
        'descriptives',
        'accessibility',
        'spatial-precision',
        'design',
        'conformance',
        'strengths',
        'metadata-assessment'
    ];
    function updateSectionVisibility() {
        if (!dataTypeSelect) return;
        const value = dataTypeSelect.value;
        sectionIds.forEach((id, idx) => {
            const section = document.getElementById(id);
            if (!section) return;
            if (value === 'primary') {
                // Show only sections 1,2,3 (descriptives, accessibility, spatial-precision)
                if (idx <= 2) {
                    section.style.display = '';
                } else {
                    section.style.display = 'none';
                }
            } else if (value === 'product') {
                // Show all sections
                section.style.display = '';
            } else {
                // If not selected, show all
                section.style.display = '';
            }
        });
    }
    if (dataTypeSelect) {
        dataTypeSelect.addEventListener('change', updateSectionVisibility);
        updateSectionVisibility();
    }
    const form = document.getElementById('evaluation-form');
    if (!form) {
        console.error('Form element not found!');
        return;
    }

    // Table of Contents navigation
    const tocLinks = document.querySelectorAll('#toc a');
    const sections = document.querySelectorAll('.section');
    
    // Highlight required fields
    function highlightRequiredFields() {
        document.querySelectorAll('[required]').forEach(field => {
            const label = field.closest('.question').querySelector('label');
            if (label && !label.classList.contains('required')) {
                label.classList.add('required');
            }
        });
    }

    // Scroll spy for TOC
    function updateTocHighlight() {
        let fromTop = window.scrollY + 100;
        
        tocLinks.forEach(link => {
            const section = document.querySelector(link.getAttribute('href'));
            if (
                section.offsetTop <= fromTop &&
                section.offsetTop + section.offsetHeight > fromTop
            ) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Smooth scroll for TOC links
    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop - 80,
                behavior: 'smooth'
            });
            
            // Update URL without page reload
            history.pushState(null, null, targetId);
        });
    });
    
    window.addEventListener('scroll', updateTocHighlight);
    window.addEventListener('load', () => {
        updateTocHighlight();
        highlightRequiredFields();
    });

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous errors
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Show loading state
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        
        try {
            // Collect all form data explicitly
            const data = {
                // Dataset Information
                datasetTitle: document.getElementById('dataset-title').value,
                datasetDescription: document.getElementById('dataset-description').value,
                datasetIdentifier: document.getElementById('dataset-identifier').value,
                datasetSubject: document.getElementById('dataset-subject').value,
                datasetContent: document.getElementById('dataset-content').value,
                
                // Descriptives
                metadataDocumentationLink: document.getElementById('metadata-documentation-link').value,
                metadataDocumentationScore: document.getElementById('metadata-documentation-score').value,
                metadataDocumentationCertainty: document.getElementById('metadata-documentation-certainty').value,
                
                // Accessibility
                accessSource: document.getElementById('access-source').value,
                accessPublisher: document.getElementById('access-publisher').value,
                accessRegistration: document.getElementById('access-registration').value,
                accessApi: document.getElementById('access-api').value,
                accessRights: document.getElementById('access-rights').value,
                accessFormat: document.getElementById('access-format').value,
                accessLanguage: document.getElementById('access-language').value,
                accessScore: document.getElementById('access-score').value,
                accessScoreCertainty: document.getElementById('access-score-certainty').value,
                
                // Spatial Precision
                spatialCrs: document.getElementById('spatial-crs').value,
                spatialAccuracy: document.getElementById('spatial-accuracy').value,
                spatialScore: document.getElementById('spatial-score').value,
                spatialScoreCertainty: document.getElementById('spatial-score-certainty').value,
                
                // Design
                designResolution: document.getElementById('design-resolution').value,
                designResolutionScore: document.getElementById('design-resolution-score').value,
                designResolutionCertainty: document.getElementById('design-resolution-certainty').value,
                designCoverage: document.getElementById('design-coverage').value,
                designCoverageScore: document.getElementById('design-coverage-score').value,
                designCoverageCertainty: document.getElementById('design-coverage-certainty').value,
                designTimelinessResolution: document.getElementById('design-timeliness-resolution').value,
                designTimelinessExtent: document.getElementById('design-timeliness-extent').value,
                designTimelinessDate: document.getElementById('design-timeliness-date').value,
                designTimelinessScore: document.getElementById('design-timeliness-score').value,
                designTimelinessCertainty: document.getElementById('design-timeliness-certainty').value,
                
                // Metadata Assessment
                assessmentEvaluator: document.getElementById('assessment-evaluator').value,
                assessmentInstitution: document.getElementById('assessment-institution').value,
                assessmentDate: document.getElementById('assessment-date').value,
                
                submitOption: 'final'
            };

            // Validate required fields
            const requiredFields = [
                'datasetTitle', 'datasetDescription',
                'metadataDocumentationScore', 'metadataDocumentationCertainty',
                'accessScore', 'accessScoreCertainty',
                'spatialScore', 'spatialScoreCertainty',
                'designResolutionScore', 'designResolutionCertainty',
                'designCoverageScore', 'designCoverageCertainty',
                'designTimelinessScore', 'designTimelinessCertainty',
                'assessmentEvaluator', 'assessmentInstitution', 'assessmentDate'
            ];

            let isValid = true;
            let firstErrorField = null;

            requiredFields.forEach(field => {
                if (!data[field]) {
                    const fieldElement = document.getElementById(field.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase());
                    if (fieldElement) {
                        fieldElement.classList.add('is-invalid');
                        const error = document.createElement('div');
                        error.className = 'error-message';
                        error.textContent = 'This field is required';
                        fieldElement.parentNode.appendChild(error);
                        isValid = false;
                        
                        if (!firstErrorField) {
                            firstErrorField = fieldElement;
                        }
                    }
                }
            });

            if (!isValid) {
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
                throw new Error('Please fill all required fields (marked with *)');
            }

            // Convert score values to numbers
            const scoreFields = [
                'metadataDocumentationScore', 'metadataDocumentationCertainty',
                'accessScore', 'accessScoreCertainty',
                'spatialScore', 'spatialScoreCertainty',
                'designResolutionScore', 'designResolutionCertainty',
                'designCoverageScore', 'designCoverageCertainty',
                'designTimelinessScore', 'designTimelinessCertainty'
            ];
            
            scoreFields.forEach(field => {
                if (data[field]) data[field] = parseInt(data[field]);
            });

            // Format date
            if (data.assessmentDate) {
                data.assessmentDate = new Date(data.assessmentDate).toISOString();
            }

            console.log('Submitting data:', data); // Debug log

            // Send to server
            const response = await fetch('/api/survey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server returned an error');
            }

            // Success - redirect to success page
            window.location.href = '/success.html';
            
        } catch (error) {
            console.error('Submission error:', error);
            
            // Show error to user
            const errorContainer = document.createElement('div');
            errorContainer.className = 'alert alert-danger mt-3';
            errorContainer.innerHTML = `
                <strong>Error:</strong> ${error.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            // Insert error message after the form header
            const formHeader = document.querySelector('.form-header');
            if (formHeader) {
                formHeader.insertAdjacentElement('afterend', errorContainer);
            } else {
                form.insertAdjacentElement('afterbegin', errorContainer);
            }
            
            // Add close functionality
            errorContainer.querySelector('.btn-close').addEventListener('click', () => {
                errorContainer.remove();
            });
            
            // Remove error message after 8 seconds
            setTimeout(() => {
                if (document.body.contains(errorContainer)) {
                    errorContainer.remove();
                }
            }, 8000);
            
        } finally {
            // Reset loading state
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    });

    // Add draft submission button
    const draftBtn = document.createElement('button');
    draftBtn.type = 'button';
    draftBtn.className = 'btn btn-secondary me-2';
    draftBtn.textContent = 'Save as Draft';
    form.querySelector('button[type="submit"]').insertAdjacentElement('beforebegin', draftBtn);

    draftBtn.addEventListener('click', async function() {
        // Prepare form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Add submit option flag
        data.submitOption = 'draft';
        
        // Show loading state
        const originalBtnText = draftBtn.innerHTML;
        draftBtn.disabled = true;
        draftBtn.innerHTML = 'Saving <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        
        try {
            // Send to server
            const response = await fetch('/api/survey/draft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to save draft');
            }

            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'alert alert-success mt-3';
            successMsg.textContent = 'Draft saved successfully!';
            form.insertBefore(successMsg, draftBtn.nextSibling);
            
            setTimeout(() => {
                successMsg.remove();
            }, 3000);
            
        } catch (error) {
            console.error('Draft save error:', error);
            
            // Show error to user
            const errorContainer = document.createElement('div');
            errorContainer.className = 'alert alert-danger mt-3';
            errorContainer.textContent = `Error: ${error.message}`;
            form.insertBefore(errorContainer, draftBtn.nextSibling);
            
            setTimeout(() => {
                errorContainer.remove();
            }, 5000);
            
        } finally {
            // Reset loading state
            draftBtn.disabled = false;
            draftBtn.innerHTML = originalBtnText;
        }
    });

    // Add input validation on blur
    const requiredInputs = document.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.classList.add('is-invalid');
                if (!this.nextElementSibling || !this.nextElementSibling.classList.contains('error-message')) {
                    const error = document.createElement('div');
                    error.className = 'error-message';
                    error.textContent = 'This field is required';
                    this.parentNode.appendChild(error);
                }
            } else {
                this.classList.remove('is-invalid');
                const error = this.nextElementSibling;
                if (error && error.classList.contains('error-message')) {
                    error.remove();
                }
            }
        });
    });
});