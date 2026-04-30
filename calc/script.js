const cropData = {
    "potato": {
        "fond": { "N": 800, "P": 0, "K": 0, label: "Base (Fond)" },
        "entretien": { "N": 200, "P": 0, "K": 100, label: "Maintenance (Entretien)" },
        "dailyWaterLPerHa": 50000
    },
    "lettuce": {
        "fond": { "N": 300, "P": 200, "K": 400, label: "Base (Fond)" },
        "dailyWaterLPerHa": 40000
    },
    "onion": {
        "fond": { "N": 0, "P": 800, "K": 0, label: "Base (Fond)" },
        "dailyWaterLPerHa": 45000
    },
    "pepper": {
        "fond": { "N": 0, "P": 600, "K": 0, label: "Base (Fond)" },
        "couverture": { "N": 200, "P": 0, "K": 200, label: "Cover (Couverture)" },
        "dailyWaterLPerHa": 55000
    },
    "tomato": {
        "fond": { "N": 133, "P": 133, "K": 134, label: "Base (Fond)" }, 
        "dailyWaterLPerHa": 60000
    }
};

const cropSelect = document.getElementById('cropInput');
const areaInput = document.getElementById('areaInput');
const stageSelect = document.getElementById('stageInput');
const errorMsg = document.getElementById('errorMessage');

let animations = {};

function animateValue(id, end, unit) {
    const obj = document.getElementById(id);
    let start = parseFloat(obj.innerText.replace(/,/g, '')) || 0;
    
    if (animations[id]) cancelAnimationFrame(animations[id]);
    
    const duration = 500;
    let startTime = null;
    
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        const current = start + (end - start) * ease;
        
        obj.innerHTML = `${Math.round(current).toLocaleString()} <span class="unit">${unit}</span>`;
        
        if (progress < 1) {
            animations[id] = requestAnimationFrame(step);
        } else {
            obj.innerHTML = `${end.toLocaleString()} <span class="unit">${unit}</span>`;
        }
    }
    
    animations[id] = requestAnimationFrame(step);
}

function updateStages() {
    const cropKey = cropSelect.value;
    stageSelect.innerHTML = ''; 
    
    if (!cropKey || !cropData[cropKey]) {
        stageSelect.innerHTML = '<option value="" disabled selected>Select crop first...</option>';
        stageSelect.disabled = true;
        calculate();
        return;
    }
    
    stageSelect.disabled = false;
    const stages = Object.keys(cropData[cropKey]).filter(k => k !== 'dailyWaterLPerHa');
    
    stages.forEach(stageKey => {
        const option = document.createElement('option');
        option.value = stageKey;
        option.textContent = cropData[cropKey][stageKey].label || stageKey;
        stageSelect.appendChild(option);
    });
    
    calculate();
}

function calculate() {
    const cropKey = cropSelect.value;
    const area = parseFloat(areaInput.value);
    const stage = stageSelect.value;
    
    errorMsg.textContent = '';
    
    if (!cropKey || isNaN(area) || area <= 0 || !stage) {
        setZeroes();
        if ((!isNaN(area) && area <= 0) || (areaInput.value && isNaN(area))) {
            errorMsg.textContent = 'Please enter a valid area > 0.';
        }
        return;
    }
    
    const cropInfo = cropData[cropKey];
    const rates = cropInfo[stage];
    
    const nTotal = (rates.N || 0) * area;
    const pTotal = (rates.P || 0) * area;
    const kTotal = (rates.K || 0) * area;
    const waterTotal = cropInfo.dailyWaterLPerHa * area;
    
    animateValue('nResult', nTotal, 'kg');
    animateValue('pResult', pTotal, 'kg');
    animateValue('kResult', kTotal, 'kg');
    animateValue('waterResult', waterTotal, 'Liters');
}

function setZeroes() {
    animateValue('nResult', 0, 'kg');
    animateValue('pResult', 0, 'kg');
    animateValue('kResult', 0, 'kg');
    animateValue('waterResult', 0, 'Liters');
}

cropSelect.addEventListener('change', updateStages);
areaInput.addEventListener('input', calculate);
stageSelect.addEventListener('change', calculate);

updateStages();
