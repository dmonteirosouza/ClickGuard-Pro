// Content script para detectar cliques em todas as páginas
(function() {
    'use strict';
    
    // Verificar se já foi carregado para evitar duplicação
    if (window.clickguardLoaded) {
        return;
    }
    window.clickguardLoaded = true;
    
    let isTracking = false;
    let clickCount = 0;
    let lastClickTime = 0;
    const CLICK_THROTTLE = 100; // Throttle cliques para evitar spam
    
    // Verificar status inicial com timeout
    function checkInitialStatus() {
        if (!chrome.runtime) {
            setTimeout(checkInitialStatus, 1000);
            return;
        }
        
        chrome.runtime.sendMessage({ action: 'getTrackingStatus' }, (response) => {
            if (chrome.runtime.lastError) {
                // Tentar novamente após 2 segundos
                setTimeout(checkInitialStatus, 2000);
                return;
            }
            
            if (response && response.isTracking) {
                startTracking();
            }
        });
    }
    
    // Executar verificação inicial
    checkInitialStatus();
    
    // Escutar mensagens do background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

        
        switch (message.action) {
            case 'ping':

                sendResponse({ 
                    status: 'alive', 
                    tracking: isTracking, 
                    url: window.location.href,
                    clickCount: clickCount 
                });
                break;
            case 'startTracking':

                startTracking();
                sendResponse({ success: true, tracking: isTracking });
                break;
            case 'stopTracking':

                stopTracking();
                sendResponse({ success: true, tracking: isTracking });
                break;
        }
        return true; // Manter canal de resposta aberto
    });
    
    function startTracking() {
        if (isTracking) return;
        
        isTracking = true;

        
        // Adicionar event listeners para diferentes tipos de cliques
        document.addEventListener('click', handleClick, true);
        document.addEventListener('mousedown', handleClick, true);
        document.addEventListener('keydown', handleKeydown, true);
        
        // Mostrar indicador visual discreto (opcional)
        showTrackingIndicator();
    }
    
    function stopTracking() {
        if (!isTracking) return;
        
        isTracking = false;

        
        // Remover event listeners
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('mousedown', handleClick, true);
        document.removeEventListener('keydown', handleKeydown, true);
        
        // Remover indicador visual
        hideTrackingIndicator();
    }
    
    function handleClick(event) {
        if (!isTracking) return;
        
        const now = Date.now();
        if (now - lastClickTime < CLICK_THROTTLE) return;
        
        lastClickTime = now;
        clickCount++;
        
        // Enviar clique para o background script com timeout e retry
        function sendClickMessage() {
            if (!chrome.runtime) {

                return;
            }
            
            const timeoutId = setTimeout(() => {

            }, 1000);
            
            chrome.runtime.sendMessage({ action: 'clickDetected' }, (response) => {
                clearTimeout(timeoutId);
                if (chrome.runtime.lastError) {

                } else if (response && response.success) {

                }
            });
        }
        
        sendClickMessage();
        
        // Log detalhado para debug (opcional)
        logClickDetails(event);
    }
    
    function handleKeydown(event) {
        if (!isTracking) return;
        
        // Contar apenas teclas "produtivas" (não modificadores)
        const productiveKeys = [
            'Enter', 'Space', 'Tab', 'Backspace', 'Delete',
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
        ];
        
        const isLetter = event.key.length === 1 && event.key.match(/[a-zA-Z0-9]/);
        const isProductiveKey = productiveKeys.includes(event.key);
        
        if (isLetter || isProductiveKey) {
            const now = Date.now();
            if (now - lastClickTime < CLICK_THROTTLE) return;
            
            lastClickTime = now;
            clickCount++;
            
            function sendKeypressMessage() {
                if (!chrome.runtime) {

                    return;
                }
                
                chrome.runtime.sendMessage({ action: 'clickDetected' }, (response) => {
                    if (chrome.runtime.lastError) {

                    }
                });
            }
            
            sendKeypressMessage();
        }
    }
    
    function showTrackingIndicator() {
        // Remover indicador existente se houver
        hideTrackingIndicator();
        
        const indicator = document.createElement('div');
        indicator.id = 'clickguard-indicator';
        indicator.innerHTML = '🛡️';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #FF6B00, #FF8533);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(255, 107, 0, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        // Adicionar tooltip
        indicator.title = 'ClickGuard Pro ativo - Monitorando atividade';
        
        // Efeito hover
        indicator.addEventListener('mouseenter', () => {
            indicator.style.transform = 'scale(1.1)';
        });
        
        indicator.addEventListener('mouseleave', () => {
            indicator.style.transform = 'scale(1)';
        });
        
        // Adicionar à página
        document.body.appendChild(indicator);
        
        // Auto-hide após 3 segundos
        setTimeout(() => {
            if (indicator && indicator.parentNode) {
                indicator.style.opacity = '0.3';
            }
        }, 3000);
    }
    
    function hideTrackingIndicator() {
        const indicator = document.getElementById('clickguard-indicator');
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }
    
    // Detectar mudanças de foco da janela (opcional)
    let windowFocused = true;
    
    window.addEventListener('focus', () => {
        windowFocused = true;
    });
    
    window.addEventListener('blur', () => {
        windowFocused = false;
    });
    
    // Detectar scroll como atividade (opcional)
    let lastScrollTime = 0;
    window.addEventListener('scroll', () => {
        if (!isTracking || !chrome.runtime) return;
        
        const now = Date.now();
        if (now - lastScrollTime < 1000) return; // Throttle scroll events
        
        lastScrollTime = now;
        chrome.runtime.sendMessage({ action: 'clickDetected' }, () => {
            if (chrome.runtime.lastError) {

            }
        });
    });
    
    // Detectar mouse move como atividade leve (muito throttled)
    let lastMouseMoveTime = 0;
    let mouseMoveCount = 0;
    document.addEventListener('mousemove', () => {
        if (!isTracking || !chrome.runtime) return;
        
        const now = Date.now();
        if (now - lastMouseMoveTime < 5000) return; // Apenas a cada 5 segundos
        
        lastMouseMoveTime = now;
        mouseMoveCount++;
        
        // Contar como atividade apenas a cada 10 movimentos
        if (mouseMoveCount % 10 === 0) {
            chrome.runtime.sendMessage({ action: 'clickDetected' }, () => {
                if (chrome.runtime.lastError) {

                }
            });
        }
    });
    
    // Limpeza quando a página é descarregada
    window.addEventListener('beforeunload', () => {
        stopTracking();
    });
    
    // Proteção contra sites que tentam detectar extensões
    Object.defineProperty(window, 'clickguard_active', {
        value: false,
        writable: false,
        configurable: false
    });
    
})();
