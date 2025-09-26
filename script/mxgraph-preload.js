// This file MUST be loaded BEFORE mxClient.min.js
// Override image loading to prevent 404s
window.mxLoadResources = false;
window.mxLoadStylesheets = false;

// Create a fake image base path handler
window.mxGraphImageBasePath = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Override the Image constructor for mxGraph
(function () {
    const OriginalImage = window.Image;
    const emptyGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    window.Image = function () {
        const img = new OriginalImage();
        const originalSrc = Object.getOwnPropertyDescriptor(img.__proto__.__proto__, 'src');

        Object.defineProperty(img, 'src', {
            get: function () {
                return originalSrc.get.call(this);
            },
            set: function (value) {
                // Intercept any mxGraph image requests
                if (value && (value.includes('expanded.gif') ||
                    value.includes('collapsed.gif') ||
                    value.includes('warning.gif') ||
                    value.includes('images/') ||
                    value.includes('mxgraph'))) {
                    originalSrc.set.call(this, emptyGif);
                } else {
                    originalSrc.set.call(this, value);
                }
            }
        });

        return img;
    };

    // Preserve prototype chain
    window.Image.prototype = OriginalImage.prototype;
})();