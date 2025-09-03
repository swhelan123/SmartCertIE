/**
 * Enhanced Chat Component with Smart Scrolling
 * Handles auto-scroll behavior, fade effects, and jump-to-bottom functionality
 */

class ChatScroller {
    constructor(chatMessagesElement) {
        this.chatMessages = chatMessagesElement;
        this.isUserAtBottom = true;
        this.fadeTimeout = null;
        this.jumpButton = null;
        this.isTyping = false;
        
        this.init();
    }

    init() {
        this.createJumpToBottomButton();
        this.attachScrollListener();
        this.updateScrollState();
    }

    createJumpToBottomButton() {
        // Create the jump to bottom button
        this.jumpButton = document.createElement('button');
        this.jumpButton.className = 'jump-to-bottom';
        this.jumpButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
        `;
        
        this.jumpButton.addEventListener('click', () => {
            this.scrollToBottom(true);
        });

        // Insert the button into the chat container
        this.chatMessages.parentElement.appendChild(this.jumpButton);
    }

    attachScrollListener() {
        this.chatMessages.addEventListener('scroll', () => {
            this.updateScrollState();
        });
    }

    updateScrollState() {
        const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
        const threshold = 50; // pixels from bottom to consider "at bottom"
        
        this.isUserAtBottom = scrollTop + clientHeight >= scrollHeight - threshold;
        
        // Update fade effect and jump button visibility
        this.updateFadeEffect();
        this.updateJumpButtonVisibility();
    }

    updateFadeEffect() {
        if (this.isUserAtBottom) {
            this.chatMessages.classList.remove('show-fade');
        } else {
            this.chatMessages.classList.add('show-fade');
        }
    }

    updateJumpButtonVisibility() {
        if (this.isUserAtBottom) {
            this.jumpButton.classList.remove('show');
        } else {
            this.jumpButton.classList.add('show');
        }
    }

    scrollToBottom(smooth = false) {
        const scrollOptions = {
            top: this.chatMessages.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        };
        
        this.chatMessages.scrollTo(scrollOptions);
        
        // Update state immediately after scrolling
        setTimeout(() => {
            this.updateScrollState();
        }, 100);
    }

    // Called when AI starts typing
    startTyping() {
        this.isTyping = true;
        // Only scroll if user was at bottom when typing started
        if (this.isUserAtBottom) {
            this.scrollToBottom();
        }
    }

    // Called when AI finishes typing
    endTyping() {
        this.isTyping = false;
        // Final scroll if user is still at bottom
        if (this.isUserAtBottom) {
            this.scrollToBottom();
        }
    }

    // Called during typing to maintain scroll position
    maintainScroll() {
        if (this.isTyping && this.isUserAtBottom) {
            this.scrollToBottom();
        }
    }

    // Force scroll to bottom (for new messages)
    forceScrollToBottom() {
        this.scrollToBottom();
        this.isUserAtBottom = true;
        this.updateScrollState();
    }
}

export { ChatScroller };