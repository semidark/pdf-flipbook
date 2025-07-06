
(function($) {
    "use strict";

    // Load PDF.js library
    function loadPDFJS(callback) {
        if (window['pdfjsLib'] || window['PDFJS']) {
            // PDF.js is already loaded
            callback();
        } else {
            // Load PDF.js script
            const script = document.createElement('script');
            script.src = './lib/js/libs/pdf.min.js';
            script.async = false;
            script.onload = () => {
                console.log('PDF.js library loaded');
                callback();
            };
            script.onerror = () => {
                console.error('Failed to load PDF.js library');
            };
            document.head.appendChild(script);
        }
    }

    // Use the PDF.js library
    let pdfjsLib = null;
    loadPDFJS(() => {
        pdfjsLib = window['pdfjsLib'] || window['PDFJS'];

        // Load PDF.js worker script
        if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = './lib/js/libs/pdf.worker.min.js';
        }
    });

    /**
     * Default configuration options for flipbook
     * @typedef {Object} FlipbookConfig
     * @property {string} pdf - PDF file URL
     * @property {string} title - Book title
     * @property {number} pageTurnDuration - Page turn animation duration in ms
     * @property {string} backgroundColor - Background color
     * @property {number} height - Flipbook height
     * @property {number} zoomLevel - Initial zoom level
     * @property {boolean} enableDownload - Show download button
     * @property {boolean} enablePrint - Show print button
     * @property {boolean} enableFullscreen - Show fullscreen toggle
     */
    const DEFAULT_CONFIG = {
        pdf: null,
        title: "Untitled",
        pageTurnDuration: 800,
        backgroundColor: "#222",
        height: 650,
        zoomLevel: 1,
        enableDownload: true,
        enablePrint: true,
        enableFullscreen: true
    };

    /**
     * Utility functions and constants for the flipbook
     * @namespace
     */
    const utils = {
        /**
         * Drag direction constants
         * @enum {number}
         */
        drag: {
            left: 0,
            right: 1,
            none: -1
        },

        /**
         * Mouse/touch event mappings based on device capabilities
         * @type {Object}
         * @property {string} type - Event type (mouse or touch)
         * @property {string} start - Start event name
         * @property {string} move - Move event name
         * @property {string} end - End event name
         */
        getMouseEvents: function() {
            return "onmousedown" in window ? {
                type: "mouse",
                start: "mousedown",
                move: "mousemove",
                end: "mouseup"
            } : {
                type: "touch",
                start: "touchstart",
                move: "touchmove",
                end: "touchend"
            };
        },

        /**
         * HTML element templates
         * @type {Object}
         * @property {string} div - Div element template
         * @property {string} img - Image element template
         * @property {string} a - Anchor element template
         * @property {string} input - Input element template
         */
        html: {
            div: "<div/>",
            img: "<img/>",
            a: "<a>",
            input: "<input type='text'/>"
        },

        /**
         * Get the share prefix
         * @returns {string} Share prefix
         */
        getSharePrefix: function() {
            const prefixes = ["flipbook-", "dflip-", "flipbook-", "dearflip-"].filter(Boolean);
            return prefixes[0];
        },

        /**
         * Convert degrees to radians
         * @param {number} degrees - Angle in degrees
         * @returns {number} Angle in radians
         */
        toRad: function(degrees) {
            return degrees * Math.PI / 180;
        },

        /**
         * Check if value is null or undefined
         * @param {*} value - Value to check
         * @returns {boolean} True if value is null or undefined
         */
        isNull: function(value) {
            return value == null;
        },

        /**
         * Limit a value between min and max
         * @param {number} value - Value to limit
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {number} Limited value
         */
        limitAt: function(value, min, max) {
            return value < min ? min : value > max ? max : value;
        }
    };

    /**
     * Extends options with default values
     * @param {Object} defaults - Default options
     * @param {Object} custom - Custom options
     * @returns {Object} Merged options
     */
    const extendOptions = function(defaults, custom) {
        return $.extend(true, {}, defaults, custom);
    };

    /**
     * Flipbook class
     * @class
     */
    class Flipbook {
        /**
         * Create a new flipbook instance
         * @param {string|HTMLElement} container - Container selector or element
         * @param {string} pdfUrl - PDF file URL
         * @param {FlipbookConfig} options - Configuration options
         */
        constructor(container, pdfUrl, options = {}) {
            console.log('Flipbook constructor called');
            this.container = $(container);
            this.pdfUrl = pdfUrl;
            this.options = extendOptions(DEFAULT_CONFIG, options);

            console.log('Flipbook options:', this.options);
            this.init();
        }

        /**
         * Initialize the flipbook
         * @private
         */
        init() {
            console.log('Initializing flipbook');
            // Initialize UI components
            this.createUI();

            // Load PDF
            this.loadPDF();

            // Set up event listeners
            this.setupEventListeners();
        }

        /**
         * Create UI components
         * @private
         */
        createUI() {
            console.log('Creating UI components');
            // Create flipbook container
            this.flipbookElement = $("<div>", {
                class: "flipbook-container"
            }).appendTo(this.container);

            // Add loading indicator
            this.loadingIndicator = $("<div>", {
                class: "loading-indicator",
                text: "Loading PDF..."
            }).appendTo(this.flipbookElement);

            // Create UI controls container
            this.uiControls = $("<div>", {
                class: "df-ui df-ui-wrapper df-ui-controls df-floating",
                css: {
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "10px"
                }
            }).appendTo(this.flipbookElement);

            // Add previous page button
            this.prevButton = $("<div>", {
                class: "df-ui-btn df-ui-prev",
                text: "Previous"
            }).appendTo(this.uiControls);

            // Add page counter
            this.pageCounter = $("<div>", {
                class: "df-ui-page",
                html: '<input type="text" value="1"><label>1</label>'
            }).appendTo(this.uiControls);

            // Add next page button
            this.nextButton = $("<div>", {
                class: "df-ui-btn df-ui-next",
                text: "Next"
            }).appendTo(this.uiControls);
        }

        /**
         * Load the PDF file
         * @private
         */
        loadPDF() {
            console.log('Loading PDF:', this.pdfUrl);
            // Check if PDF.js is already loaded
            if (typeof pdfjsLib !== 'undefined') {
                console.log('PDF.js is already loaded');
                this.initPDF();
            } else {
                console.log('Loading PDF.js library');
                // Load PDF.js library
                const script = document.createElement('script');
                script.src = './lib/js/libs/pdf.min.js';
                script.async = false;
                script.onload = () => {
                    console.log('PDF.js library loaded');
                    this.initPDF();
                };
                script.onerror = () => {
                    console.error('Failed to load PDF.js library');
                    this.showError('Failed to load PDF.js library');
                };
                document.head.appendChild(script);
            }
        }

        /**
         * Initialize PDF.js and render the PDF
         * @private
         */
        initPDF() {
            try {
                console.log('Initializing PDF.js with URL:', this.pdfUrl);
                const loadingTask = pdfjsLib.getDocument(this.pdfUrl);
                loadingTask.promise.then((pdf) => {
                    console.log('PDF loaded successfully, rendering pages');
                    this.pdf = pdf; // Store the PDF object
                    this.renderPDF(pdf);
                    this.currentPage = 1; // Initialize current page
                    this.updatePageCounter(); // Update page counter
                }).catch((error) => {
                    console.error('Error loading PDF:', error);
                    this.showError('Failed to load PDF: ' + error.message);
                });
            } catch (error) {
                console.error('Exception in initPDF:', error);
                this.showError('Exception: ' + error.message);
            }
        }

        /**
         * Render the PDF pages
         * @param {pdfjsLib.PDFDocument} pdf - PDF document
         * @private
         */
        renderPDF(pdf) {
            const container = this.flipbookElement;
            const numPages = pdf.numPages;

            console.log(`Rendering ${numPages} pages`);

            // Hide loading indicator
            this.loadingIndicator.hide();

            // Render each page
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                pdf.getPage(pageNum).then((page) => {
                    console.log(`Rendering page ${pageNum}`);
                    const viewport = page.getViewport({ scale: this.options.zoomLevel });
                    const pageDiv = $('<div>', {
                        class: 'pdf-page',
                        css: {
                            width: '100%',
                            height: 'auto',
                            position: 'relative',
                            maxWidth: '100%',
                            maxHeight: '100%'
                        },
                        attr: {
                            'data-page': pageNum
                        }
                    }).appendTo(container);

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    pageDiv.append(canvas);

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    page.render(renderContext).promise.then(() => {
                        console.log(`Page ${pageNum} rendered successfully`);
                    }).catch((error) => {
                        console.error(`Error rendering page ${pageNum}:`, error);
                    });
                }).catch((error) => {
                    console.error(`Error getting page ${pageNum}:`, error);
                });
            }
        }

        /**
         * Show an error message
         * @param {string} message - Error message
         * @private
         */
        showError(message) {
            console.error('Error:', message);
            this.loadingIndicator.text(message).addClass('error');
        }

        /**
         * Set up event listeners
         * @private
         */
        setupEventListeners() {
            // Event listeners for UI interactions
            console.log('Setting up event listeners');

            // Previous page button click
            this.prevButton.on('click', () => {
                console.log('Previous page button clicked');
                this.goToPreviousPage();
            });

            // Next page button click
            this.nextButton.on('click', () => {
                console.log('Next page button clicked');
                this.goToNextPage();
            });
        }

        goToPreviousPage() {
            console.log('Going to previous page');
            // Get the current page number
            const currentPage = this.currentPage || 1;
            if (currentPage > 1) {
                this.currentPage = currentPage - 1;
                this.updatePageCounter();
                this.showPage(this.currentPage);
            }
        }

        goToNextPage() {
            console.log('Going to next page');
            // Get the current page number
            const currentPage = this.currentPage || 1;
            if (this.pdf && currentPage < this.pdf.numPages) {
                this.currentPage = currentPage + 1;
                this.updatePageCounter();
                this.showPage(this.currentPage);
            }
        }

        updatePageCounter() {
            if (this.pageCounter && this.pdf) {
                const currentPage = this.currentPage || 1;
                // Update the input value and label text
                this.pageCounter.find('input').val(currentPage);
                this.pageCounter.find('label').text(currentPage);
            }
        }

        showPage(pageNumber) {
            console.log(`Showing page ${pageNumber}`);
            // Hide all pages
            this.flipbookElement.find('.pdf-page').hide();

            // Show the selected page
            const pageElement = this.flipbookElement.find(`.pdf-page[data-page="${pageNumber}"]`);
            if (pageElement.length > 0) {
                pageElement.show();
            } else {
                console.warn(`Page element for page ${pageNumber} not found`);
            }
        }

        /**
         * Go to a specific page
         * @param {number} pageNumber - Page number to go to
         */
        goToPage(pageNumber) {
            console.log(`Going to page ${pageNumber}`);
            // Page navigation logic
        }

        /**
         * Zoom in or out
         * @param {number} level - Zoom level (positive for in, negative for out)
         */
        zoom(level) {
            console.log(`Zooming by level ${level}`);
            // Zoom logic
        }

        /**
         * Toggle fullscreen mode
         */
        toggleFullscreen() {
            console.log('Toggling fullscreen');
            // Fullscreen logic
        }
    }

    /**
     * Initialize a flipbook when the document is ready
     * @param {string} selector - Container selector
     * @param {string} pdfUrl - PDF file URL
     * @param {FlipbookConfig} options - Configuration options
     */
    $.fn.flipBook = function(pdfUrl, options = {}) {
        return this.each(function() {
            new Flipbook(this, pdfUrl, options);
        });
    };

    /**
     * Add a method to initialize the flipbook
     * @param {string} containerSelector - Container selector
     * @param {string} pdfUrl - PDF file URL
     * @param {FlipbookConfig} options - Configuration options
     */
    function initializeFlipbook(containerSelector, pdfUrl, options = {}) {
        $(containerSelector).flipBook(pdfUrl, options);
    }

    // Export the initializeFlipbook function
    window.initializeFlipbook = initializeFlipbook;

})(jQuery);
