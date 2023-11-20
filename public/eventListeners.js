// eventListeners.js - define all event listeners w/ DOM

import {
    tryAgainButton
} from './domElements.js';

// New Search button click:
tryAgainButton.addEventListener("click", function() {
    location.reload();
});
