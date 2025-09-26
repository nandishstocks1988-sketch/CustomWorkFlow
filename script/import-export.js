/* ==========================================================================
   Import/Export Module - Bridge to export.js functionality
   ========================================================================== */

// This file serves as a bridge to the functionality in export.js
// It's created to satisfy the script include in the HTML

// Make sure the proper handlers are attached
document.addEventListener("DOMContentLoaded", function () {
    // Ensure JSON upload handler is attached
    const uploadInput = document.getElementById("uploadJSON");
    if (uploadInput && window.handleJSONUpload) {
        uploadInput.addEventListener("change", window.handleJSONUpload);
    }

    const fabUpload = document.getElementById("fabUploadJSON");
    if (fabUpload && window.handleJSONUpload) {
        fabUpload.addEventListener("change", window.handleJSONUpload);
    }
});