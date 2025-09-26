// Fix for Node Layout - Ensure 3 lines structure
document.addEventListener('DOMContentLoaded', function () {
    // Function to fix node layout
    function fixNodeLayout() {
        const nodes = document.querySelectorAll('.node-inner-grid');

        nodes.forEach(node => {
            // Get all direct children
            const children = Array.from(node.children);

            // Find elements for each line
            const nameField = children.find(el => el.querySelector('label')?.textContent?.toLowerCase().includes('name'));
            const descField = children.find(el => el.querySelector('textarea'));
            const deleteBtn = children.find(el => el.classList.contains('delete-btn'));

            const shapeField = children.find(el => el.querySelector('label')?.textContent?.toLowerCase().includes('shape'));
            const systemField = children.find(el => el.querySelector('label')?.textContent?.toLowerCase().includes('system'));
            const subgroupField = children.find(el => el.querySelector('label')?.textContent?.toLowerCase().includes('subgroup'));
            const textColorField = children.find(el => el.querySelector('label')?.textContent?.toLowerCase().includes('text'));
            const fillColorField = children.find(el => el.querySelector('label')?.textContent?.toLowerCase().includes('fill'));
            const borderColorField = children.find(el => el.querySelector('label')?.textContent?.toLowerCase().includes('border') ||
                el.querySelector('label')?.textContent?.toLowerCase().includes('outline'));
            const addConnBtn = children.find(el => el.classList.contains('add-conn-btn'));

            const connectionsContainer = children.find(el => el.classList.contains('connections-container'));

            // Clear the node
            node.innerHTML = '';

            // Create line wrappers
            const line1 = document.createElement('div');
            line1.style.cssText = 'display: flex; gap: 0.5rem; align-items: flex-end; margin-bottom: 0.5rem; width: 100%;';

            const line2 = document.createElement('div');
            line2.style.cssText = 'display: flex; gap: 0.375rem; align-items: flex-end; margin-bottom: 0.5rem; width: 100%;';

            // Add elements to Line 1
            if (nameField) {
                nameField.style.width = '150px';
                line1.appendChild(nameField);
            }
            if (descField) {
                descField.style.flex = '1';
                descField.style.minWidth = '200px';
                line1.appendChild(descField);
            }
            if (deleteBtn) {
                deleteBtn.style.marginLeft = 'auto';
                line1.appendChild(deleteBtn);
            }

            // Add elements to Line 2
            if (shapeField) {
                shapeField.style.width = '80px';
                line2.appendChild(shapeField);
            }
            if (systemField) {
                systemField.style.width = '150px';
                line2.appendChild(systemField);
            }
            if (subgroupField) {
                subgroupField.style.width = '150px';
                line2.appendChild(subgroupField);
            }
            if (textColorField) {
                textColorField.style.width = '45px';
                line2.appendChild(textColorField);
            }
            if (fillColorField) {
                fillColorField.style.width = '45px';
                line2.appendChild(fillColorField);
            }
            if (borderColorField) {
                borderColorField.style.width = '45px';
                line2.appendChild(borderColorField);
            }
            if (addConnBtn) {
                line2.appendChild(addConnBtn);
            }

            // Add lines to node
            node.appendChild(line1);
            node.appendChild(line2);

            // Add connections as Line 3
            if (connectionsContainer) {
                connectionsContainer.style.cssText = 'display: block; width: 100%; margin-top: 0.5rem;';
                node.appendChild(connectionsContainer);
            }
        });
    }

    // Fix layout initially
    fixNodeLayout();

    // Fix layout when nodes are added/modified
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList') {
                fixNodeLayout();
            }
        });
    });

    // Observe changes in the nodes list
    const nodesList = document.getElementById('nodes-list');
    if (nodesList) {
        observer.observe(nodesList, { childList: true, subtree: true });
    }

    // Also fix when Add Connection is clicked
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('add-conn-btn')) {
            setTimeout(fixNodeLayout, 100);
        }
    });
});