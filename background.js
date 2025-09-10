// Background script para gerenciar o monitoramento de cliques
let isTracking = false;
let currentSchedule = null;
let trackingStartTime = null;

// Inicializar quando a extensão carrega
chrome.runtime.onStartup.addListener(initialize);
chrome.runtime.onInstalled.addListener(initialize);

async function initialize() {
    // Carregar configurações
    const result = await chrome.storage.sync.get(['schedule', 'isTracking']);
    currentSchedule = result.schedule;
    isTracking = result.isTracking || false;
    
    // Configurar alarme para verificar horário de trabalho
    chrome.alarms.create('checkWorkTime', { periodInMinutes: 1 });
    
    // Verificar se deve começar o tracking
    checkWorkTime();
}

// Verificar se está em horário de trabalho
async function checkWorkTime() {
    if (!currentSchedule) return;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const shouldTrack = isWorkTime(currentTime, currentSchedule);
    
    if (shouldTrack && !isTracking) {
        startTracking();
    } else if (!shouldTrack && isTracking) {
        stopTracking();
    }
}

function isWorkTime(currentTime, schedule) {
    const startTime = timeToMinutes(schedule.startWork);
    const lunchStartTime = timeToMinutes(schedule.lunchStart);
    const lunchEndTime = timeToMinutes(schedule.lunchEnd);
    const endTime = timeToMinutes(schedule.endWork);

    return (currentTime >= startTime && currentTime < lunchStartTime) ||
           (currentTime >= lunchEndTime && currentTime < endTime);
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

async function startTracking() {
    isTracking = true;
    trackingStartTime = new Date();
    await chrome.storage.sync.set({ isTracking: true });
    
    // Notificar content scripts em todas as abas existentes
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
        // Verificar se a aba suporta content scripts
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            return;
        }
        
        chrome.tabs.sendMessage(tab.id, { action: 'startTracking' }).catch(() => {
            // Ignorar erros silenciosamente
        });
    });
}

async function stopTracking() {
    if (trackingStartTime) {
        // Calcular tempo trabalhado nesta sessão
        const sessionMinutes = Math.floor((new Date() - trackingStartTime) / 60000);
        await updateWorkTime(sessionMinutes);
    }
    
    isTracking = false;
    trackingStartTime = null;
    await chrome.storage.sync.set({ isTracking: false });
    
    // Notificar content scripts em todas as abas
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            return;
        }
        
        chrome.tabs.sendMessage(tab.id, { action: 'stopTracking' }).catch(() => {
            // Ignorar erros silenciosamente
        });
    });
}

async function updateWorkTime(minutes) {
    const today = new Date().toDateString();
    const result = await chrome.storage.sync.get(['dailyStats']);
    const dailyStats = result.dailyStats || {};
    
    if (!dailyStats[today]) {
        dailyStats[today] = { clicks: 0, workMinutes: 0 };
    }
    
    dailyStats[today].workMinutes += minutes;
    await chrome.storage.sync.set({ dailyStats });
}

// Receber cliques do content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'clickDetected':
            if (isTracking) {
                recordClick().then(() => {
                    sendResponse({ success: true });
                });
            } else {
                sendResponse({ success: false, reason: 'not tracking' });
            }
            return true; // Manter canal aberto para resposta assíncrona
            
        case 'scheduleUpdated':
            currentSchedule = message.schedule;
            checkWorkTime().then(() => {
                sendResponse({ success: true });
            });
            return true;
            
        case 'getTrackingStatus':
            sendResponse({ isTracking, currentSchedule });
            break;
            
        case 'forceStartTracking':
            startTracking().then(() => {
                sendResponse({ success: true, isTracking: true });
            });
            return true;
    }
});

async function recordClick() {
    const today = new Date().toDateString();
    const currentWeek = getWeekNumber(new Date());
    
    // Obter estatísticas atuais
    const result = await chrome.storage.sync.get(['dailyStats', 'weeklyStats']);
    const dailyStats = result.dailyStats || {};
    const weeklyStats = result.weeklyStats || {};
    
    // Inicializar estatísticas do dia se necessário
    if (!dailyStats[today]) {
        dailyStats[today] = { clicks: 0, workMinutes: 0 };
    }
    
    // Incrementar contadores
    dailyStats[today].clicks++;
    weeklyStats[currentWeek] = (weeklyStats[currentWeek] || 0) + 1;
    
    // Salvar estatísticas
    await chrome.storage.sync.set({ dailyStats, weeklyStats });
    
    // Notificar popup se estiver aberto
    chrome.runtime.sendMessage({
        action: 'statsUpdated',
        dailyStats,
        weeklyStats
    }).catch(() => {
        // Popup pode não estar aberto
    });
}

function getWeekNumber(date) {
    const onejan = new Date(date.getFullYear(), 0, 1);
    const millisecsInDay = 86400000;
    return Math.ceil(((date - onejan) / millisecsInDay + onejan.getDay() + 1) / 7);
}

// Responder aos alarmes
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkWorkTime') {
        checkWorkTime();
    }
});

// Gerenciar quando novas abas são criadas
chrome.tabs.onCreated.addListener(async (tab) => {
    if (isTracking) {
        // Aguardar um pouco para garantir que a aba carregou
        setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: 'startTracking' }).catch(() => {
                // Content script pode não estar pronto ainda
            });
        }, 2000);
    }
});

// Gerenciar quando abas são atualizadas/recarregadas
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isTracking && tab.url && !tab.url.startsWith('chrome://')) {
        // Enviar mensagem para iniciar tracking na aba recarregada
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'startTracking' }).catch(() => {
                // Ignorar erros para abas que não suportam content scripts
            });
        }, 1000);
    }
});

// Limpeza de dados antigos (rodar semanalmente)
chrome.alarms.create('cleanupOldData', { periodInMinutes: 10080 }); // 7 dias

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'cleanupOldData') {
        await cleanupOldData();
    }
});

async function cleanupOldData() {
    const result = await chrome.storage.sync.get(['dailyStats']);
    const dailyStats = result.dailyStats || {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Remover estatísticas de mais de 30 dias
    const cleanedStats = {};
    for (const [date, stats] of Object.entries(dailyStats)) {
        if (new Date(date) >= thirtyDaysAgo) {
            cleanedStats[date] = stats;
        }
    }
    
    await chrome.storage.sync.set({ dailyStats: cleanedStats });
}