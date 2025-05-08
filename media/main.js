// 获取VSCode的webview API
const vscode = acquireVsCodeApi();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const titleInput = document.getElementById('title-input');
    const contentInput = document.getElementById('content-input');
    const saveButton = document.getElementById('save-button');
    const promptList = document.getElementById('prompt-list');
    
    // 保存按钮点击事件
    saveButton.addEventListener('click', () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        if (title && content) {
            // 发送消息到扩展
            vscode.postMessage({
                command: 'addPrompt',
                title: title,
                content: content
            });
            
            // 清空输入
            titleInput.value = '';
            contentInput.value = '';
        } else {
            vscode.postMessage({
                command: 'showError',
                message: '标题和内容不能为空'
            });
        }
    });
    
    // 处理从扩展收到的消息
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.command) {
            case 'updatePromptList':
                renderPromptList(message.prompts);
                break;
        }
    });
    
    // 渲染提示词列表
    function renderPromptList(prompts) {
        promptList.innerHTML = '';
        
        if (prompts.length === 0) {
            promptList.innerHTML = '<div class="empty-message">暂无提示词</div>';
            return;
        }
        
        prompts.forEach(prompt => {
            const promptElement = document.createElement('div');
            promptElement.className = 'prompt-item';
            
            // 获取内容的前三行
            const contentLines = prompt.content.split('\n');
            const previewLines = contentLines.slice(0, 3);
            let preview = previewLines.join('\n');
            
            // 如果内容超过三行，添加省略号
            if (contentLines.length > 3) {
                preview += '...';
            }
            
            promptElement.innerHTML = `
                <div class="prompt-content">
                    <div class="prompt-title">${prompt.title}</div>
                    <div class="prompt-preview">${preview}</div>
                </div>
                <div class="prompt-actions">
                    <button class="action-button copy-button" data-id="${prompt.id}" title="复制">📋</button>
                    <button class="action-button delete-button" data-id="${prompt.id}" title="删除">🗑️</button>
                </div>
            `;
            
            promptList.appendChild(promptElement);
            
            // 添加复制按钮事件
            const copyButton = promptElement.querySelector('.copy-button');
            copyButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'copyPrompt',
                    id: prompt.id
                });
            });
            
            // 添加删除按钮事件
            const deleteButton = promptElement.querySelector('.delete-button');
            deleteButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'deletePrompt',
                    id: prompt.id
                });
            });
        });
    }
}); 