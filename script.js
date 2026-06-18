document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Theme
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    // DOM Elements - Form Inputs
    const gstForm = document.getElementById('gstForm');
    const amountInput = document.getElementById('amount');
    const transactionTypeSelect = document.getElementById('transactionType');
    const gstRateSelect = document.getElementById('gstRate');
    const customRateGroup = document.getElementById('customRateGroup');
    const customRateInput = document.getElementById('customRate');
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    // DOM Elements - Error Messages
    const amountError = document.getElementById('amountError');
    const customRateError = document.getElementById('customRateError');
    // DOM Elements - Results Card
    const resultsCard = document.getElementById('resultsCard');
    const resOriginalAmount = document.getElementById('resOriginalAmount');
    const resGstAmount = document.getElementById('resGstAmount');
    const resTotalAmount = document.getElementById('resTotalAmount');
    const breakdownList = document.getElementById('breakdownList');
    const copyBtn = document.getElementById('copyBtn');
    // Initial State Variables
    let currentTheme = localStorage.getItem('gst-theme') || 'dark';
    // Apply Saved Theme on Load
    applyTheme(currentTheme);
    // Event Listener: Theme Toggle
    themeToggle.addEventListener('click', () => {
        currentTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
        localStorage.setItem('gst-theme', currentTheme);
    });
    // Event Listener: GST Rate Change (Toggle custom rate input)
    gstRateSelect.addEventListener('change', () => {
        if (gstRateSelect.value === 'custom') {
            customRateGroup.classList.remove('hidden');
            customRateInput.setAttribute('required', 'required');
        } else {
            customRateGroup.classList.add('hidden');
            customRateInput.removeAttribute('required');
            // Clear custom rate error if hidden
            clearError(customRateInput, customRateError);
        }
    });
    // Real-time Input Validation
    amountInput.addEventListener('input', () => {
        validateAmount();
    });
    customRateInput.addEventListener('input', () => {
        validateCustomRate();
    });
    // Event Listener: Form Submit (Calculate)
    gstForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const isAmountValid = validateAmount();
        const isCustomRateValid = gstRateSelect.value === 'custom' ? validateCustomRate() : true;
        if (isAmountValid && isCustomRateValid) {
            calculateGST();
        } else {
            // Trigger animation visual feedback
            if (!isAmountValid) {
                shakeElement(amountInput.closest('.input-group'));
            }
            if (!isCustomRateValid && gstRateSelect.value === 'custom') {
                shakeElement(customRateInput.closest('.input-group'));
            }
        }
    });
    // Event Listener: Reset Form
    resetBtn.addEventListener('click', () => {
        resetCalculator();
    });
    // Event Listener: Copy Details to Clipboard
    copyBtn.addEventListener('click', () => {
        copyResults();
    });
    /* --- Helper & Logic Functions --- */
    // Apply Light/Dark Theme Class and Icons
    function applyTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        if (theme === 'light') {
            themeIcon.className = 'fa-solid fa-sun';
        } else {
            themeIcon.className = 'fa-solid fa-moon';
        }
    }
    // Shake element for failure animation
    function shakeElement(element) {
        element.classList.remove('has-error');
        // Trigger reflow to restart animation
        void element.offsetWidth;
        element.classList.add('has-error');
    }
    // Clear Error Styling
    function clearError(inputEl, errorEl) {
        inputEl.closest('.input-group').classList.remove('has-error');
    }
    // Show Error Styling
    function showError(inputEl, errorEl) {
        inputEl.closest('.input-group').classList.add('has-error');
    }
    // Validate Invoice Amount Input
    function validateAmount() {
        const value = parseFloat(amountInput.value);
        if (isNaN(value) || value <= 0) {
            showError(amountInput, amountError);
            return false;
        } else {
            clearError(amountInput, amountError);
            return true;
        }
    }
    // Validate Custom GST Rate input
    function validateCustomRate() {
        const value = parseFloat(customRateInput.value);
        if (isNaN(value) || value < 0 || value > 100) {
            showError(customRateInput, customRateError);
            return false;
        } else {
            clearError(customRateInput, customRateError);
            return true;
        }
    }
    // Format Number to Indian Currency Style
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    }
    // Perform GST Calculation & Render Breakdown
    function calculateGST() {
        const amount = parseFloat(amountInput.value);
        let rate = 0;
        if (gstRateSelect.value === 'custom') {
            rate = parseFloat(customRateInput.value);
        } else {
            rate = parseFloat(gstRateSelect.value);
        }
        const transactionType = transactionTypeSelect.value;
        
        // GST Calculations
        const gstAmount = amount * (rate / 100);
        const totalAmount = amount + gstAmount;
        // Render Results to UI
        resOriginalAmount.textContent = formatCurrency(amount);
        resGstAmount.textContent = formatCurrency(gstAmount);
        resTotalAmount.textContent = formatCurrency(totalAmount);
        // Build GST Breakdown HTML
        let breakdownHtml = '';
        if (transactionType === 'intra') {
            // Split GST into CGST (Central) and SGST (State)
            const splitRate = rate / 2;
            const splitAmount = gstAmount / 2;
            breakdownHtml = `
                <div class="breakdown-item">
                    <span class="tax-name">CGST (${splitRate}%)</span>
                    <span class="tax-val">${formatCurrency(splitAmount)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="tax-name">SGST (${splitRate}%)</span>
                    <span class="tax-val">${formatCurrency(splitAmount)}</span>
                </div>
            `;
        } else {
            // IGST applied on Inter-State transaction
            breakdownHtml = `
                <div class="breakdown-item">
                    <span class="tax-name">IGST (${rate}%)</span>
                    <span class="tax-val">${formatCurrency(gstAmount)}</span>
                </div>
            `;
        }
        breakdownList.innerHTML = breakdownHtml;
        // Unhide Results Card with Animation
        resultsCard.classList.remove('hidden');
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    // Reset Form and Results Section
    function resetCalculator() {
        gstForm.reset();
        
        // Hide custom rate group & remove required attribute
        customRateGroup.classList.add('hidden');
        customRateInput.removeAttribute('required');
        // Clear all validation errors
        clearError(amountInput, amountError);
        clearError(customRateInput, customRateError);
        // Hide results card
        resultsCard.classList.add('hidden');
        
        // Scroll back to top of form
        document.querySelector('.calculator-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Copy formatted results to user clipboard
    function copyResults() {
        const amount = parseFloat(amountInput.value);
        let rate = 0;
        if (gstRateSelect.value === 'custom') {
            rate = parseFloat(customRateInput.value);
        } else {
            rate = parseFloat(gstRateSelect.value);
        }
        const transactionType = transactionTypeSelect.value;
        const gstAmount = amount * (rate / 100);
        const totalAmount = amount + gstAmount;
        let taxBreakdownText = '';
        if (transactionType === 'intra') {
            const splitRate = rate / 2;
            const splitAmount = gstAmount / 2;
            taxBreakdownText = `CGST (${splitRate}%): ${formatCurrency(splitAmount)}\nSGST (${splitRate}%): ${formatCurrency(splitAmount)}`;
        } else {
            taxBreakdownText = `IGST (${rate}%): ${formatCurrency(gstAmount)}`;
        }
        // Construct complete copy payload
        const copyPayload = `
-----------------------------------------
   GST CALCULATOR INVOICE SUMMARY
-----------------------------------------
Original Amount:   ${formatCurrency(amount)}
GST Rate:          ${rate}%
Transaction Type:  ${transactionType === 'intra' ? 'Intra-State' : 'Inter-State'}
-----------------------------------------
TAX BREAKDOWN:
${taxBreakdownText}
-----------------------------------------
Total GST Tax:     ${formatCurrency(gstAmount)}
Total Gross Price: ${formatCurrency(totalAmount)}
-----------------------------------------
Calculated by: Keshav Maini (keshav.maini@example.com)
Built for Digital Heroes (https://digitalheroesco.com)
-----------------------------------------
`;
        navigator.clipboard.writeText(copyPayload.trim())
            .then(() => {
                // Success visual state
                const originalContent = copyBtn.innerHTML;
                copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Copied!</span>`;
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.innerHTML = originalContent;
                    copyBtn.classList.remove('copied');
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy results: ', err);
                alert('Could not copy results to clipboard. Please copy manually.');
            });
    }
});
