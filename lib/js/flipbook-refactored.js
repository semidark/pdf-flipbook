
(function($) {
    "use strict";

    // Default configuration options for flipbook
    const DEFAULT_CONFIG = {
        webgl: true,
        webglShadow: true,
        soundEnable: true,
        search: false,
        height: "auto",
        autoEnableOutline: false,
        autoEnableThumbnail: false,
        overwritePDFOutline: false,
        enableDownload: true,
        duration: 800,
        direction: DFLIP.DIRECTION.LTR,
        pageMode: DFLIP.PAGE_MODE.AUTO,
        singlePageMode: DFLIP.SINGLE_PAGE_MODE.AUTO,
        backgroundColor: "#fff",
        forceFit: true,
        transparent: false,
        hard: "none",
        openPage: 1,
        annotationClass: "",
        autoPlay: false,
        autoPlayDuration: 5000,  // Converted from 5e3 to more readable format
        autoPlayStart: false,
        maxTextureSize: 1600,
        minTextureSize: 256,
        rangeChunkSize: 524288,
        icons: {
            altnext: "ti-angle-right",
            altprev: "ti-angle-left",
            next: "ti-angle-right",
            prev: "ti-angle-left",
            end: "ti-angle-double-right",
            start: "ti-angle-double-left",
            share: "ti-sharethis",
            help: "ti-help-alt",
            more: "ti-more-alt",
            download: "ti-download",
            zoomin: "ti-zoom-in",
            zoomout: "ti-zoom-out",
            fullscreen: "ti-fullscreen",
            fitscreen: "ti-arrows-corner",
            thumbnail: "ti-layout-grid2",
            outline: "ti-menu-alt",
            close: "ti-close",
            search: "ti-search",
            doublepage: "ti-book",
            singlepage: "ti-file",
            sound: "ti-volume",
            facebook: "ti-facebook",
            google: "ti-google",
            twitter: "ti-twitter-alt",
            mail: "ti-email",
            play: "ti-control-play",
            pause: "ti-control-pause"
        },
        text: {
            toggleSound: "Turn on/off Sound",
            toggleThumbnails: "Toggle Thumbnails",
            toggleOutline: "Toggle Outline/Bookmark",
            previousPage: "Previous Page",
            nextPage: "Next Page",
            toggleFullscreen: "Toggle Fullscreen",
            zoomIn: "Zoom In",
            zoomOut: "Zoom Out",
            toggleHelp: "Toggle Help",
            singlePageMode: "Single Page Mode",
            doublePageMode: "Double Page Mode",
            downloadPDFFile: "Download PDF File",
            gotoFirstPage: "Goto First Page",
            gotoLastPage: "Goto Last Page",
            play: "Start AutoPlay",
            pause: "Pause AutoPlay",
            share: "Share",
            mailSubject: "I wanted you to see this FlipBook",
            mailBody: "Check out this site {{url}}",
            loading: "Loading"
        },
        allControls: "altPrev,pageNumber,altNext,play,outline,thumbnail,zoomIn,zoomOut,fullScreen,share,download,search,more,pageMode,startPage,endPage,sound",
        moreControls: "download,pageMode,startPage,endPage,sound",
        hideControls: "",
        controlsPosition: DFLIP.CONTROLSPOSITION.BOTTOM,
        paddingTop: 30,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 30,
        enableAnalytics: false,
        scrollWheel: true,
        onCreate: function(e) {},
        onCreateUI: function(e) {},
        onFlip: function(e) {},
        beforeFlip: function(e) {},
        onReady: function(e) {},
        zoomRatio: 1.5,
        pageSize: DFLIP.PAGE_SIZE.AUTO,
        pdfjsSrc: "js/libs/pdf.min.js",
        pdfjsCompatibilitySrc: "js/libs/compatibility.js",
        pdfjsWorkerSrc: "js/libs/pdf.worker.min.js",
        threejsSrc: "js/libs/three.min.js",
        mockupjsSrc: "js/libs/mockup.min.js",
        soundFile: "sound/turn2.mp3",
        imagesLocation: "images",
        imageResourcesPath: "images/pdfjs/",
        cMapUrl: "cmaps/",
        enableDebugLog: false,
        canvasToBlob: false,
        enableAnnotation: true,
        pdfRenderQuality: .9,
        textureLoadFallback: "blank",
        stiffness: 3,
        backgroundImage: "",
        pageRatio: null,
        pixelRatio: window.devicePixelRatio || 1,
        thumbElement: "div",
        spotLightIntensity: .22,
        ambientLightColor: "#fff",
        ambientLightIntensity: .8,
        shadowOpacity: .15,
        linkTarget: DFLIP.LINK_TARGET.BLANK,
        sharePrefix: "flipbook-"
    };

    // Utility functions and constants for the flipbook
    const utils = {
        drag: {
            left: 0,
            right: 1,
            none: -1
        },

        mouseEvents: "onmousedown" in window ? {
            type: "mouse",
            start: "mousedown",
            move: "mousemove",
            end: "mouseup"
        } : {
            type: "touch",
            start: "touchstart",
            move: "touchmove",
            end: "touchend"
        },

        html: {
            div: "<div/>",
            img: "<img/>",
            a: "<a>",
            input: "<input type='text'/>"
        },

        toRad: function(degrees) {
            return degrees * Math.PI / 180;
        },

        toDeg: function(radians) {
            return radians * 180 / Math.PI;
        },

        transition: function(enable, duration) {
            return enable ? duration / 1000 + "s ease-out" : "0s none";
        },

        translateStr: function(x, y) {
            return "WebKitCSSMatrix" in window ?
                " translate3d(" + x + "px," + y + "px, 0px) " :
                " translate(" + x + "px, " + y + "px) ";
        },

        rotateStr: function(degrees) {
            return " rotateZ(" + degrees + "deg) ";
        },

        bg: function(color) {
            return "#fff" + color;
        },

        bgImage: function(src) {
            return src == null || src == "blank" ? "" : " url(" + src + ")";
        },

        src: function(src) {
            return src != null ? "" + src + "" : "";
        },

        limitAt: function(value, min, max) {
            return value < min ? min : value > max ? max : value;
        },

        distOrigin: function(x, y) {
            return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        },

        distPoints: function(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        },

        calculateScale: function(startPoints, endPoints) {
            const startDistance = utils.distPoints(startPoints[0].x, startPoints[0].y, startPoints[1].x, startPoints[1].y);
            const endDistance = utils.distPoints(endPoints[0].x, endPoints[0].y, endPoints[1].x, endPoints[1].y);
            return endDistance / startDistance;
        },

        getVectorAvg: function(points) {
            const xAvg = points.map(p => p.x).reduce((a, b) => a + b, 0) / points.length;
            const yAvg = points.map(p => p.y).reduce((a, b) => a + b, 0) / points.length;
            return { x: xAvg, y: yAvg };
        },

        sum: function(a, b) {
            return a + b;
        },

        getTouches: function(event, offset = { left: 0, top: 0 }) {
            return Array.prototype.slice.call(event.touches).map(touch => {
                return { x: touch.pageX - offset.left, y: touch.pageY - offset.top };
            });
        },

        angleByDistance: function(distance, angle, totalDistance) {
            const halfDistance = totalDistance / 2;
            const segment = utils.distOrigin(distance, 0, totalDistance);
            return segment < halfDistance ?
                utils.toDeg(Math.asin(segment / halfDistance)) :
                90 + utils.toDeg(Math.asin((segment - halfDistance) / halfDistance));
        },

        log: function(message) {
            if (DEFAULT_CONFIG.enableDebugLog && window.console) {
                console.log(message);
            }
        },

        lowerPowerOfTwo: function(value) {
            return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
        },

        nearestPowerOfTwo: function(value, max = 2048) {
            return Math.min(max, Math.pow(2, Math.ceil(Math.log(value) / Math.LN2)));
        },

        zoomStops: function(currentSize, scaleFactor, level = null, minSize = 256, maxSize = 2048) {
            const logScale = Math.log(currentSize / minSize) / Math.log(scaleFactor);
            return minSize * Math.pow(scaleFactor, level != null ? level : Math.round(logScale));
        },

        extendOptions: function(defaults, custom) {
            return $.extend(true, {}, defaults, custom);
        },

        getFullscreenElement: function() {
            return document.fullscreenElement ||
                document.mozFullScreenElement ||
                document.webkitFullscreenElement ||
                document.msFullscreenElement;
        },

        hasFullscreenEnabled: function() {
            return document.fullscreenEnabled ||
                document.mozFullScreenEnabled ||
                document.webkitFullscreenEnabled ||
                document.msFullscreenEnabled;
        },

        getBasePage: function(page) {
            return Math.floor(page / 2) * 2;
        },

        loadResources: function(tag, src, callback) {
            const element = document.createElement(tag);
            const reference = document.getElementsByTagName(tag)[0];
            element.async = true;

            if (callback) {
                element.addEventListener("load", function(event) {
                    callback(null, event);
                }, false);
            }

            element.src = src;
            reference.parentNode.insertBefore(element, reference);
        },

        getScriptCallbacks: [],

        getScript: function(src, callback, errorCallback) {
            const callbacks = utils.getScriptCallbacks[src] || [];
            let scriptElement = null;

            function removeCallbacks() {
                if (scriptElement != null) {
                    if (!scriptElement.readyState || /loaded|complete/.test(scriptElement.readyState)) {
                        scriptElement.onload = scriptElement.onreadystatechange = null;
                        scriptElement = null;

                        if (callbacks.length > 0) {
                            callbacks.forEach(cb => {
                                if (cb) cb();
                            });
                            callbacks.length = 0;
                        }
                    }
                }
            }

            if ($("script[src='" + src + "']").length === 0) {
                callbacks.push(callback);
                scriptElement = document.createElement("script");
                const firstScript = document.body.getElementsByTagName("script")[0];
                scriptElement.async = true;
                scriptElement.setAttribute("data-cfasync", false);

                if (firstScript != null) {
                    firstScript.parentNode.insertBefore(scriptElement, firstScript);
                } else {
                    document.body.appendChild(scriptElement);
                }

                scriptElement.addEventListener("load", removeCallbacks, false);
                scriptElement.addEventListener("readystatechange", removeCallbacks, false);
                scriptElement.addEventListener("complete", removeCallbacks, false);

                if (errorCallback) {
                    scriptElement.addEventListener("error", errorCallback, false);
                }

                scriptElement.src = src + (N.dom == "MS" ? "?" + Math.random(1) : "");
            } else {
                callbacks.push(callback);
            }
        },

        isHardPage: function(style, page, totalPages, isDouble) {
            if (style != null) {
                if (style == "cover") {
                    return page == 0 || isDouble && page == 1 || page == Math.ceil(totalPages / (isDouble ? 1 : 2)) - (isDouble ? 0 : 1);
                } else if (style == "all") {
                    return true;
                } else {
                    const isOddPage = ("," + style + ",").indexOf("," + (page * 2 + 1) + ",") > -1;
                    const isEvenPage = ("," + style + ",").indexOf("," + (page * 2 + 2) + ",") > -1;
                    return isOddPage || isEvenPage;
                }
            }
            return false;
        },

        fixMouseEvent: function(event) {
            if (event) {
                const originalEvent = event.originalEvent || event;
                if (originalEvent.changedTouches && originalEvent.changedTouches.length > 0) {
                    const fixedEvent = $.event.fix(event);
                    const touch = originalEvent.changedTouches[0];
                    fixedEvent.clientX = touch.clientX;
                    fixedEvent.clientY = touch.clientY;
                    fixedEvent.pageX = touch.pageX;
                    fixedEvent.pageY = touch.pageY;
                    fixedEvent.movementX = touch.movementX;
                    fixedEvent.movementY = touch.movementY;
                    fixedEvent.touches = originalEvent.touches;
                    return fixedEvent;
                } else {
                    return event;
                }
            } else {
                return event;
            }
        },

        hasWebgl: function() {
            try {
                const canvas = document.createElement("canvas");
                return !!(window.WebGLRenderingContext &&
                    (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
            } catch (e) {
                return false;
            }
        }(),

        isBookletMode: function(config) {
            return config.pageMode == DFLIP.PAGE_MODE.SINGLE && config.singlePageMode == DFLIP.SINGLE_PAGE_MODE.BOOKLET;
        },

        isRTLMode: function(config) {
            return config.direction == DFLIP.DIRECTION.RTL;
        },

        isMobile: function() {
            const userAgent = navigator.userAgent;
            return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(userAgent) ||
                /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4)));
        }(),

        isIOS: /(iPad|iPhone|iPod)/g.test(navigator.userAgent),

        isSafari: /constructor/i.test(window.HTMLElement) || function(obj) {
            return obj.toString() === "[object SafariRemoteNotification]";
        }(!window["safari"] || safari.pushNotification),

        prefix: function() {
            const computedStyle = window.getComputedStyle(document.documentElement, "");
            const vendorPrefix = Array.prototype.slice.call(computedStyle).join("").match(/-(moz|webkit|ms)-/)[1];
            const domPrefix = "WebKit|Moz|MS".match(new RegExp("(" + vendorPrefix + ")", "i"))[1];
            return {
                dom: domPrefix,
                lowercase: vendorPrefix,
                css: "-" + vendorPrefix + "-",
                js: vendorPrefix[0].toUpperCase() + vendorPrefix.substr(1)
            };
        }(),

        __extends: function(child, parent) {
            for (var key in parent) {
                if (parent.hasOwnProperty(key)) {
                    child[key] = parent[key];
                }
            }

            function TempConstructor() {
                this.constructor = child;
            }

            TempConstructor.prototype = parent.prototype;
            child.prototype = new TempConstructor();
            child.__super = parent.prototype;
            return child;
        }
    };

    // Flipbook class
    class Flipbook {
        constructor(container, pdfUrl, options = {}) {
            this.container = $(container);
            this.pdfUrl = pdfUrl;
            this.options = utils.extendOptions(DEFAULT_CONFIG, options);

            this.init();
        }

        init() {
            // Initialize UI components
            this.createUI();

            // Load PDF
            this.loadPDF();

            // Set up event listeners
            this.setupEventListeners();
        }

        createUI() {
            // Create flipbook container
            this.flipbookElement = $("<div>", {
                class: "flipbook-container"
            }).appendTo(this.container);

            // Add loading indicator
            this.loadingIndicator = $("<div>", {
                class: "loading-indicator",
                text: "Loading PDF..."
            }).appendTo(this.flipbookElement);
        }

        loadPDF() {
            console.log('Loading PDF:', this.pdfUrl);
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

        initPDF() {
            try {
                console.log('Initializing PDF.js with URL:', this.pdfUrl);
                const loadingTask = pdfjsLib.getDocument(this.pdfUrl);
                loadingTask.promise.then((pdf) => {
                    console.log('PDF loaded successfully, rendering pages');
                    this.renderPDF(pdf);
                }).catch((error) => {
                    console.error('Error loading PDF:', error);
                    this.showError('Failed to load PDF: ' + error.message);
                });
            } catch (error) {
                console.error('Exception in initPDF:', error);
                this.showError('Exception: ' + error.message);
            }
        }

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
                            width: `${viewport.width}px`,
                            height: `${viewport.height}px`,
                            position: 'relative'
                        }
                    }).appendTo(container);

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.pageHeight = viewport.height;
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

        showError(message) {
            console.error('Error:', message);
            this.loadingIndicator.text(message).addClass('error');
        }

        setupEventListeners() {
            // Event listeners for UI interactions
            console.log('Setting up event listeners');
        }

        goToPage(pageNumber) {
            console.log(`Going to page ${pageNumber}`);
            // Page navigation logic
        }

        zoom(level) {
            console.log(`Zooming by level ${level}`);
            // Zoom logic
        }

        toggleFullscreen() {
            console.log('Toggling fullscreen');
            // Fullscreen logic
        }
    }

    // Initialize a flipbook when the document is ready
    $.fn.flipBook = function(pdfUrl, options) {
        return this.each(function() {
            new Flipbook(this, pdfUrl, options);
        });
    };

})(jQuery);
