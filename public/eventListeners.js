// eventListeners.js - define all event listeners w/ DOM

import {
    tryAgainButton,
    superchargeSwitch, debugModeCheckbox, enableLiveLocalSwitch,
} from './domElements.js';

// New Search button click:
tryAgainButton.addEventListener("click", function() {
    location.reload();
});

// Supercharge switch change:
superchargeSwitch.addEventListener('change', function() {
    this.value = this.checked ? 'on' : 'off';
    superAI = this.value;
    console.log(`Download in Excel=${superAI}`);
});

// Debug mode checkbox change:
debugModeCheckbox.addEventListener('change', function() {
    this.value = this.checked ? 'on' : 'off';
    debugMode = this.value;
    console.log(`Debug Mode=${debugModeCheckbox}`);
});

// Enable Live Local switch change:
enableLiveLocalSwitch.addEventListener('change', function() {
    this.value = this.checked ? 'on' : 'off';
    enableLiveLocalModule = this.value;
    console.log(`Use Live Local=${enableLiveLocalModule}`);
});
