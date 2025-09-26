/* ==========================================================================
   Init - Application initialization and connections
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    console.log("Initializing application...");

    // Initialize mermaid
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'loose',
            flowchart: {
                htmlLabels: true
            }
        });
        console.log("Mermaid initialized");
    }

    // Ensure upload handlers are attached
    const uploadInput = document.getElementById("uploadJSON");
    if (uploadInput && window.handleJSONUpload) {
        uploadInput.addEventListener("change", window.handleJSONUpload);
    }

    const fabUpload = document.getElementById("fabUploadJSON");
    if (fabUpload && window.handleJSONUpload) {
        fabUpload.addEventListener("change", window.handleJSONUpload);
    }

    console.log("Application initialization complete");
});