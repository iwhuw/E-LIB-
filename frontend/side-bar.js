// Direct implementation of sidebar collapse and chat input functionality
// This should be included after common.js

document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing direct sidebar collapse and chat input functionality");
    
    // Left Sidebar
    const leftSidebar = document.querySelector('.sidebar');
    const leftSidebarCollapseBtn = document.querySelector('.sidebar .collapse-btn');

    if (leftSidebar && leftSidebarCollapseBtn) {
        console.log('Found left sidebar elements');
        leftSidebarCollapseBtn.addEventListener('click', function() {
            console.log('Left sidebar button clicked');
            leftSidebar.classList.toggle('collapsed');
            this.textContent = leftSidebar.classList.contains('collapsed') ? '▶' : '◀';
        });
    } else {
        console.error('Left sidebar elements not found:', { 
            sidebar: !!leftSidebar, 
            button: !!leftSidebarCollapseBtn 
        });
    }

    // Right Sidebar (Chat Panel)
    const rightSidebar = document.querySelector('.chat-panel');
    const rightSidebarCollapseBtn = document.querySelector('.chat-panel .collapse-btn');

    if (rightSidebar && rightSidebarCollapseBtn) {
        console.log('Found right sidebar elements');
        rightSidebarCollapseBtn.addEventListener('click', function() {
            console.log('Right sidebar button clicked');
            rightSidebar.classList.toggle('collapsed');
            this.textContent = rightSidebar.classList.contains('collapsed') ? '◀' : '▶';
        });
    } else {
        console.error('Right sidebar elements not found:', { 
            sidebar: !!rightSidebar, 
            button: !!rightSidebarCollapseBtn 
        });
    }

    // Chat Input
    const chatInput = document.querySelector('.chat-input input');
    if (chatInput) {
        console.log('Found chat input element');
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                console.log('Enter pressed in chat input');
                if (typeof addUserMessage === 'function') {
                    addUserMessage(this.value.trim());
                    this.value = '';
                } else {
                    console.error('addUserMessage function not found');
                }
            }
        });
    } else {
        console.error('Chat input element not found');
    }
});

// Direct implementation of chat input functionality
// This should be included after common.js

document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing direct chat input functionality");
    
    // Chat Input
    const chatInput = document.querySelector('.chat-input input');
    if (chatInput) {
        console.log('Found chat input element');
        
        // Remove any existing event listeners by cloning and replacing
        const newChatInput = chatInput.cloneNode(true);
        chatInput.parentNode.replaceChild(newChatInput, chatInput);
        
        // Add fresh event listener
        newChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                console.log('Enter key pressed with text:', this.value.trim());
                e.preventDefault();
                
                // Check if addUserMessage function exists (from common.js)
                if (typeof window.addUserMessage === 'function') {
                    window.addUserMessage(this.value.trim());
                } else {
                    // Fallback implementation if addUserMessage doesn't exist
                    console.log('Using fallback chat implementation');
                    sendChatMessage(this.value.trim());
                }
                
                this.value = '';
            }
        });
        
        console.log('Chat input event listener attached');
    } else {
        console.error('Chat input element not found!');
    }
    
    // Fallback implementation for sending chat messages
    function sendChatMessage(text) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) {
            console.error('Chat messages container not found!');
            return;
        }
        
        // Create user message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        
        const messagePara = document.createElement('p');
        messagePara.textContent = text;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = 'You';
        
        messageDiv.appendChild(messagePara);
        messageDiv.appendChild(timeSpan);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Create loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message loading';
        loadingDiv.innerHTML = '<p>...</p>';
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simulate response after 1 second
        setTimeout(function() {
            // Remove loading indicator
            chatMessages.removeChild(loadingDiv);
            
            // Add bot response
            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'message';
            
            // Create the header with avatar and name
            const headerDiv = document.createElement('div');
            headerDiv.style = 'display: flex; gap: 10px; align-items: center;';
            
            const avatar = document.createElement('img');
            avatar.src = 'https://ui-avatars.com/api/?name=AI&background=1a73e8&color=fff';
            avatar.alt = 'AI Assistant';
            avatar.style = 'border-radius: 50%; width: 40px; height: 40px;';
            
            const nameTimeDiv = document.createElement('div');
            
            const nameStrong = document.createElement('strong');
            nameStrong.textContent = 'BookBot';
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'message-time';
            timeSpan.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            nameTimeDiv.appendChild(nameStrong);
            nameTimeDiv.appendChild(document.createTextNode(' '));
            nameTimeDiv.appendChild(timeSpan);
            
            headerDiv.appendChild(avatar);
            headerDiv.appendChild(nameTimeDiv);
            
            // Message content
            const messagePara = document.createElement('p');
            messagePara.textContent = "I'm ready to help with books and recommendations! What would you like to know?";
            
            // Assemble the message
            botMessageDiv.appendChild(headerDiv);
            botMessageDiv.appendChild(messagePara);
            
            chatMessages.appendChild(botMessageDiv);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }
});