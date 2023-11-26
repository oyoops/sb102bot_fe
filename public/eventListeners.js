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
    debugModeSwitch = this.value;
    console.log(`Debug Mode=${debugModeSwitch}`);
});

// Enable Live Local switch change:
enableLiveLocalSwitch.addEventListener('change', function() {
    this.value = this.checked ? 'on' : 'off';
    enableLiveLocalModule = this.value;
    console.log(`Use Live Local=${enableLiveLocalModule}`);
});

// Call initializeChat to send a guided startup message to the AI chatbot after the page finishes loading
//document.addEventListener('DOMContentLoaded', initializeChat);
//  *IDEA*  Change this to trigger once the aiSupplementalData object is available, and send the data with the request.
//          Alternate idea-- wait until the *entire* initial AI response is received, then send that too.
//          (SEND SUPP DATA ONLY ONCE TIME FOR EFFICIENCY! SERVER SHOULD PRESERVE DATA UNTIL ADDRESS IS CHANGED)
