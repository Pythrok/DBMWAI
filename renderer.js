const fs = require('fs');
const path = require('path');

function getRandomPhrase() {
    try {
        const phrasesPath = path.join(__dirname, 'phrases.json');
        const phrasesData = fs.readFileSync(phrasesPath, 'utf8');
        const phrases = JSON.parse(phrasesData);
        
        const totalWeight = phrases.reduce((sum, phrase) => sum + phrase.probability, 0);
        let random = Math.random() * totalWeight;
        
        for (const phrase of phrases) {
            random -= phrase.probability;
            if (random <= 0) {
                return phrase.text;
            }
        }
        
        return phrases[0].text;
    } catch (error) {
        console.error('Error loading phrases:', error);
        return 'Welcome to DBMWAI!';
    }
}

function getConfigPath() {
    const { app } = require('electron').remote || require('@electron/remote');
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'config.json');
}

function loadConfig() {
    try {
        const configPath = getConfigPath();
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
    return {
        apiUrl: '',
        apiKey: '',
        model: '',
        prompt: 'default'
    };
}

function saveConfig(config) {
    try {
        const configPath = getConfigPath();
        const configDir = path.dirname(configPath);
        
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
}

function setupApiKeyBlur() {
    const apiKeyInput = document.getElementById('apiKey');
    if (!apiKeyInput) return;
    
    function updateBlur() {
        if (apiKeyInput.value && !apiKeyInput.matches(':hover') && document.activeElement !== apiKeyInput) {
            apiKeyInput.classList.add('blurred');
        } else {
            apiKeyInput.classList.remove('blurred');
        }
    }
    
    apiKeyInput.addEventListener('blur', updateBlur);
    apiKeyInput.addEventListener('focus', () => apiKeyInput.classList.remove('blurred'));
    apiKeyInput.addEventListener('mouseenter', () => apiKeyInput.classList.remove('blurred'));
    apiKeyInput.addEventListener('mouseleave', updateBlur);
    apiKeyInput.addEventListener('input', updateBlur);
    
    updateBlur();
}

function setupConfigForm() {
    const form = document.getElementById('config-form');
    if (!form) return;
    
    const config = loadConfig();
    
    document.getElementById('apiUrl').value = config.apiUrl;
    document.getElementById('apiKey').value = config.apiKey;
    document.getElementById('model').value = config.model;
    document.getElementById('prompt').value = config.prompt;
    
    setupApiKeyBlur();
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newConfig = {
            apiUrl: document.getElementById('apiUrl').value,
            apiKey: document.getElementById('apiKey').value,
            model: document.getElementById('model').value,
            prompt: document.getElementById('prompt').value
        };
        
        if (saveConfig(newConfig)) {
            const saveBtn = form.querySelector('.save-btn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Configuration Saved!';
            saveBtn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = '';
            }, 2000);
        }
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(sectionId + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const randomPhraseElement = document.getElementById('random-phrase');
    if (randomPhraseElement) {
        randomPhraseElement.textContent = getRandomPhrase();
    }
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
            
            if (section === 'config') {
                setTimeout(setupConfigForm, 100);
            }
        });
    });
    
    setupConfigForm();
});