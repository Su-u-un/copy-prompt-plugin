const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { showMultilineInputBox } = require('./multiInputBox');

class PromptTreeItem extends vscode.TreeItem {
    constructor(label, id, content) {
        super(label);
        this.id = id;
        this.content = content;
        this.tooltip = content;
        this.contextValue = 'prompt';
    }
}

class PromptProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.prompts = [];
        this.dataPath = this.getStoragePath();
        this.loadPrompts();
    }

    getStoragePath() {
        return path.join(this.context.globalStorageUri.fsPath, 'prompts.json');
    }

    loadPrompts() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const data = fs.readFileSync(this.dataPath, 'utf8');
                const parsed = JSON.parse(data);
                this.prompts = parsed.prompts || [];
            } else {
                // 确保目录存在
                const dir = path.dirname(this.dataPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                this.prompts = [];
                this.savePrompts();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`加载提示词失败: ${error.message}`);
            this.prompts = [];
        }
    }

    savePrompts() {
        try {
            const data = JSON.stringify({ prompts: this.prompts }, null, 2);
            fs.writeFileSync(this.dataPath, data, 'utf8');
        } catch (error) {
            vscode.window.showErrorMessage(`保存提示词失败: ${error.message}`);
        }
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren() {
        return this.prompts.map(p => new PromptTreeItem(p.title, p.id, p.content));
    }

    async addPrompt() {
        const title = await vscode.window.showInputBox({
            placeHolder: '请输入提示词标题',
            prompt: '提示词标题'
        });

        if (!title) return;

        const content = await showMultilineInputBox({
            title: '添加提示词内容',
            prompt: '请输入提示词内容',
            placeholder: '在此输入提示词内容'
        });

        if (!content) return;

        const id = Date.now().toString();
        this.prompts.push({
            id,
            title,
            content
        });
        
        this.savePrompts();
        this.refresh();
        vscode.window.showInformationMessage(`提示词 "${title}" 已添加`);
    }

    async deletePrompt(item) {
        const confirm = await vscode.window.showWarningMessage(
            `确定要删除 "${item.label}" 吗？`,
            { modal: true },
            '确定'
        );

        if (confirm !== '确定') return;

        this.prompts = this.prompts.filter(p => p.id !== item.id);
        this.savePrompts();
        this.refresh();
        vscode.window.showInformationMessage(`提示词 "${item.label}" 已删除`);
    }

    async copyPrompt(item) {
        await vscode.env.clipboard.writeText(item.content);
        vscode.window.showInformationMessage(`提示词 "${item.label}" 已复制到剪贴板`);
    }

    async showPromptContent(item) {
        const document = await vscode.workspace.openTextDocument({
            content: item.content,
            language: 'plaintext'
        });
        await vscode.window.showTextDocument(document);
    }
}

module.exports = PromptProvider; 