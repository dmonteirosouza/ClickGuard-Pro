document.addEventListener('DOMContentLoaded', async function() {
    // Elementos DOM
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const clickCounter = document.getElementById('clickCounter');
    const startWork = document.getElementById('startWork');
    const lunchStart = document.getElementById('lunchStart');
    const lunchEnd = document.getElementById('lunchEnd');
    const endWork = document.getElementById('endWork');
    const saveSchedule = document.getElementById('saveSchedule');
    const resetStats = document.getElementById('resetStats');
    const todayClicks = document.getElementById('todayClicks');
    const weekClicks = document.getElementById('weekClicks');
    const avgClicks = document.getElementById('avgClicks');
    const workHours = document.getElementById('workHours');

    // Carregar configurações salvas
    const result = await chrome.storage.sync.get([
        'schedule',
        'dailyStats',
        'weeklyStats',
        'isTracking'
    ]);

    // Configurar horários salvos
    if (result.schedule) {
        startWork.value = result.schedule.startWork;
        lunchStart.value = result.schedule.lunchStart;
        lunchEnd.value = result.schedule.lunchEnd;
        endWork.value = result.schedule.endWork;
    }

    // Verificar se está em horário de trabalho
    function isWorkTime() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        if (!result.schedule) return false;

        const schedule = result.schedule;
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

    function updateStatus() {
        const working = isWorkTime();
        
        if (working) {
            statusDot.className = 'status-dot status-active';
            statusText.textContent = 'Monitorando atividade';
        } else {
            statusDot.className = 'status-dot status-inactive';
            statusText.textContent = 'Fora do horário';
        }
    }

    function updateStats() {
        const today = new Date().toDateString();
        const todayStats = result.dailyStats?.[today] || { clicks: 0, workMinutes: 0 };
        
        clickCounter.textContent = todayStats.clicks;
        todayClicks.textContent = todayStats.clicks;
        
        // Calcular horas trabalhadas hoje
        const hours = Math.floor(todayStats.workMinutes / 60);
        const minutes = todayStats.workMinutes % 60;
        workHours.textContent = `${hours}h${minutes > 0 ? minutes + 'm' : ''}`;

        // Calcular média de cliques por hora
        if (todayStats.workMinutes > 0) {
            const avgPerHour = Math.round((todayStats.clicks / todayStats.workMinutes) * 60);
            avgClicks.textContent = avgPerHour;
        } else {
            avgClicks.textContent = '0';
        }

        // Calcular cliques da semana
        let weekTotal = 0;
        if (result.weeklyStats) {
            const currentWeek = getWeekNumber(new Date());
            weekTotal = result.weeklyStats[currentWeek] || 0;
        }
        weekClicks.textContent = weekTotal;
    }

    function getWeekNumber(date) {
        const onejan = new Date(date.getFullYear(), 0, 1);
        const millisecsInDay = 86400000;
        return Math.ceil(((date - onejan) / millisecsInDay + onejan.getDay() + 1) / 7);
    }

    // Salvar horários
    saveSchedule.addEventListener('click', async function() {
        const schedule = {
            startWork: startWork.value,
            lunchStart: lunchStart.value,
            lunchEnd: lunchEnd.value,
            endWork: endWork.value
        };

        await chrome.storage.sync.set({ schedule });
        
        // Notificar background script sobre mudança
        chrome.runtime.sendMessage({ 
            action: 'scheduleUpdated', 
            schedule 
        });

        // Atualizar status imediatamente
        result.schedule = schedule;
        updateStatus();
        
        // Feedback visual
        saveSchedule.textContent = 'Salvo!';
        saveSchedule.style.background = 'rgba(76, 175, 80, 0.4)';
        
        setTimeout(() => {
            saveSchedule.textContent = 'Salvar Horários';
            saveSchedule.style.background = 'rgba(255, 255, 255, 0.2)';
        }, 1500);
    });

    // Resetar estatísticas
    resetStats.addEventListener('click', async function() {
        if (confirm('Tem certeza que deseja resetar todas as estatísticas?')) {
            await chrome.storage.sync.remove(['dailyStats', 'weeklyStats']);
            
            // Limpar display
            clickCounter.textContent = '0';
            todayClicks.textContent = '0';
            weekClicks.textContent = '0';
            avgClicks.textContent = '0';
            workHours.textContent = '0h';
            
            // Feedback visual
            resetStats.textContent = 'Resetado!';
            resetStats.style.background = 'rgba(76, 175, 80, 0.4)';
            
            setTimeout(() => {
                resetStats.textContent = 'Resetar Estatísticas';
                resetStats.style.background = 'rgba(220, 53, 69, 0.3)';
            }, 1500);
        }
    });

    // Atualizar dados ao receber mensagem do background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'statsUpdated') {
            result.dailyStats = message.dailyStats;
            result.weeklyStats = message.weeklyStats;
            updateStats();
        }
    });

    // Atualizar status e estatísticas iniciais
    updateStatus();
    updateStats();

    // Atualizar status a cada minuto
    setInterval(updateStatus, 60000);
});