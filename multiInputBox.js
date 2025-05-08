const vscode = require('vscode');

/**
 * 显示多行输入对话框
 * @param {Object} options 配置选项
 * @param {string} options.title 对话框标题
 * @param {string} options.prompt 提示文本
 * @param {string} options.placeholder 占位文本
 * @returns {Promise<string|undefined>} 用户输入的文本或取消时返回undefined
 */
async function showMultilineInputBox(options) {
    const document = await vscode.workspace.openTextDocument({
        content: '',
        language: 'plaintext'
    });
    
    const editor = await vscode.window.showTextDocument(document);
    
    // 显示信息提示
    vscode.window.showInformationMessage(
        `${options.prompt || '请输入内容'}，完成后按Ctrl+S保存或关闭编辑器取消。`,
        '确定'
    );
    
    return new Promise((resolve) => {
        // 监听保存事件
        const saveListener = vscode.workspace.onDidSaveTextDocument(async (doc) => {
            if (doc === document) {
                const content = doc.getText();
                // 清理
                saveListener.dispose();
                closeListener.dispose();
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                resolve(content);
            }
        });
        
        // 监听关闭事件
        const closeListener = vscode.window.onDidChangeVisibleTextEditors((editors) => {
            if (!editors.some(e => e.document === document)) {
                // 编辑器关闭
                saveListener.dispose();
                closeListener.dispose();
                resolve(undefined);
            }
        });
    });
}

module.exports = {
    showMultilineInputBox
}; 