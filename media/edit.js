// 获取VSCode的webview API
const vscode = acquireVsCodeApi();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const titleInput = document.getElementById('title-input');
    const contentInput = document.getElementById('content-input');
    const saveButton = document.getElementById('save-button');
    
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
            case 'clearForm':
                // 清空表单
                titleInput.value = '';
                contentInput.value = '';
                break;
        }
    });
}); 