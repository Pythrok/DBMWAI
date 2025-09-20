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

function getProjectsPath() {
    const { app } = require('electron').remote || require('@electron/remote');
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'Projects');
}

function loadProjects() {
    try {
        const projectsPath = getProjectsPath();
        if (!fs.existsSync(projectsPath)) {
            return [];
        }
        
        const projects = [];
        const folders = fs.readdirSync(projectsPath);
        
        for (const folder of folders) {
            const projectPath = path.join(projectsPath, folder);
            const packagePath = path.join(projectPath, 'package.json');
            
            if (fs.existsSync(packagePath)) {
                const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                projects.push({
                    name: packageData.name,
                    description: packageData.description,
                    author: packageData.author,
                    path: projectPath
                });
            }
        }
        
        return projects;
    } catch (error) {
        console.error('Error loading projects:', error);
        return [];
    }
}

function createProject(name, description, author, botToken, botId) {
    try {
        const projectsPath = getProjectsPath();
        const projectPath = path.join(projectsPath, name);
        
        if (!fs.existsSync(projectsPath)) {
            fs.mkdirSync(projectsPath, { recursive: true });
        }
        
        if (fs.existsSync(projectPath)) {
            return false;
        }
        
        fs.mkdirSync(projectPath, { recursive: true });
        
        const packageJson = {
            name: name,
            version: '1.0.0',
            description: description,
            main: 'index.js',
            author: author,
            dependencies: {
                'discord.js': '^14.0.0',
                'dotenv': '^16.0.0'
            }
        };
        
        const packagePath = path.join(projectPath, 'package.json');
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        
        const envContent = `DISCORD_TOKEN=${botToken}\nDISCORD_BOT_ID=${botId}`;
        const envPath = path.join(projectPath, '.env');
        fs.writeFileSync(envPath, envContent);
        
        return true;
    } catch (error) {
        console.error('Error creating project:', error);
        return false;
    }
}

function displayProjects() {
    const projectsList = document.getElementById('projectsList');
    if (!projectsList) return;
    
    const projects = loadProjects();
    projectsList.innerHTML = '';
    
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <div class="project-author">by ${project.author}</div>
        `;
        projectCard.addEventListener('click', () => openProject(project));
        projectsList.appendChild(projectCard);
    });
}

function setupProjectModal() {
    const modal = document.getElementById('createProjectModal');
    const createBtn = document.getElementById('createProjectCard');
    const cancelBtn = document.getElementById('cancelProjectBtn');
    const form = document.getElementById('createProjectForm');
    
    if (!modal || !createBtn || !cancelBtn || !form) return;
    
    createBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        form.reset();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            form.reset();
        }
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDescription').value.trim();
        const author = document.getElementById('projectAuthor').value.trim();
        const botToken = document.getElementById('botToken').value.trim();
        const botId = document.getElementById('botId').value.trim();
        
        if (!name || !description || !author || !botToken || !botId) return;
        
        if (createProject(name, description, author, botToken, botId)) {
            modal.style.display = 'none';
            form.reset();
            displayProjects();
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
            } else if (section === 'projects') {
                setTimeout(() => {
                    displayProjects();
                    setupProjectModal();
                }, 100);
            }
        });
    });
    
    setupConfigForm();
    setupProjectModal();
    displayProjects();
    setupChatInterface();
    setupProjectConfig();
});

let currentProject = null;

function openProject(project) {
    currentProject = project;
    
    document.getElementById('mainSidebar').style.display = 'none';
    document.getElementById('projectSidebar').style.display = 'block';
    document.getElementById('currentProjectName').textContent = project.name;
    
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');
    
    document.getElementById('project-main-section').style.display = 'block';
    
    const projectNavLinks = document.querySelectorAll('#projectSidebar .nav-link');
    projectNavLinks.forEach(link => link.classList.remove('active'));
    document.querySelector('[data-section="project-main"]').classList.add('active');
    
    loadProjectConfig();
    clearChat();
}

function closeProject() {
    currentProject = null;
    
    document.getElementById('projectSidebar').style.display = 'none';
    document.getElementById('mainSidebar').style.display = 'block';
    
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');
    
    document.getElementById('projects-section').style.display = 'block';
    
    const mainNavLinks = document.querySelectorAll('#mainSidebar .nav-link');
    mainNavLinks.forEach(link => link.classList.remove('active'));
    document.querySelector('[data-section="projects"]').classList.add('active');
}

function loadProjectConfig() {
    if (!currentProject) return;
    
    try {
        const envPath = path.join(currentProject.path, '.env');
        const packagePath = path.join(currentProject.path, 'package.json');
        
        if (fs.existsSync(envPath) && fs.existsSync(packagePath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            const envLines = envContent.split('\n');
            const envVars = {};
            envLines.forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) envVars[key] = value;
            });
            
            document.getElementById('projectConfigAuthor').value = packageContent.author || '';
            document.getElementById('projectConfigToken').value = envVars.DISCORD_TOKEN || '';
            document.getElementById('projectConfigBotId').value = envVars.DISCORD_BOT_ID || '';
        }
    } catch (error) {
        console.error('Error loading project config:', error);
    }
}

function saveProjectConfig() {
    if (!currentProject) return false;
    
    try {
        const author = document.getElementById('projectConfigAuthor').value;
        const token = document.getElementById('projectConfigToken').value;
        const botId = document.getElementById('projectConfigBotId').value;
        
        const packagePath = path.join(currentProject.path, 'package.json');
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        packageContent.author = author;
        fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
        
        const envContent = `DISCORD_TOKEN=${token}\nDISCORD_BOT_ID=${botId}`;
        const envPath = path.join(currentProject.path, '.env');
        fs.writeFileSync(envPath, envContent);
        
        return true;
    } catch (error) {
        console.error('Error saving project config:', error);
        return false;
    }
}

function setupProjectConfig() {
    const form = document.getElementById('project-config-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (saveProjectConfig()) {
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

function setupChatInterface() {
    const sendBtn = document.getElementById('sendMessage');
    const chatInput = document.getElementById('chatInput');
    const backBtn = document.getElementById('backToProjects');
    
    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', closeProject);
    }
    
    const projectNavLinks = document.querySelectorAll('#projectSidebar .nav-link');
    projectNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showProjectSection(section);
        });
    });
}

function showProjectSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');
    
    const targetSection = document.getElementById(sectionId + '-section');
    if (targetSection) targetSection.style.display = 'block';
    
    const navLinks = document.querySelectorAll('#projectSidebar .nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`#projectSidebar [data-section="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');
    
    if (sectionId === 'project-config') {
        setTimeout(loadProjectConfig, 100);
    }
}

function addChatMessage(content, type) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.textContent = content;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLoadingMessage() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.innerHTML = 'AI is thinking<span class="loading-dots"></span>';
    loadingDiv.id = 'loadingMessage';
    
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return loadingDiv;
}

function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) loadingMessage.remove();
}

function clearChat() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) chatMessages.innerHTML = '';
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message || !currentProject) return;
    
    chatInput.value = '';
    addChatMessage(message, 'user');
    
    const loadingMessage = addLoadingMessage();
    
    try {
        const config = loadConfig();
        const prompt = await loadPrompt(config.prompt || 'default');
        
        const response = await fetch(`${config.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'user', content: `${prompt.system}\n\nUser request: ${message}` }
                ]
            })
        });
        
        const data = await response.json();
        removeLoadingMessage();
        
        if (data.choices && data.choices[0]) {
            const aiResponse = data.choices[0].message.content;
            
            const parts = aiResponse.split('```json');
            const explanation = parts[0].trim();
            
            if (explanation) {
                addChatMessage(explanation, 'assistant');
            }
            
            if (parts.length > 1) {
                const jsonPart = parts[1].split('```')[0];
                try {
                    const fileData = JSON.parse(jsonPart);
                    if (fileData.files) {
                        await processFiles(fileData.files);
                        addChatMessage('Files updated successfully!', 'system');
                    }
                } catch (jsonError) {
                    console.error('Error parsing JSON:', jsonError);
                    addChatMessage('AI response received but file processing failed.', 'system');
                }
            }
        }
    } catch (error) {
        console.error('Error sending message:', error);
        removeLoadingMessage();
        addChatMessage('Error communicating with AI. Check your API configuration.', 'system');
    }
}

async function loadPrompt(promptName) {
    try {
        const promptPath = path.join(__dirname, 'prompts', `${promptName}.json`);
        const promptData = fs.readFileSync(promptPath, 'utf8');
        return JSON.parse(promptData);
    } catch (error) {
        console.error('Error loading prompt:', error);
        return { system: 'You are a helpful Discord bot developer assistant.' };
    }
}

async function processFiles(files) {
    if (!currentProject) return;
    
    for (const file of files) {
        try {
            const filePath = path.join(currentProject.path, file.path);
            const fileDir = path.dirname(filePath);
            
            if (!fs.existsSync(fileDir)) {
                fs.mkdirSync(fileDir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, file.content);
        } catch (error) {
            console.error(`Error processing file ${file.path}:`, error);
        }
    }
}